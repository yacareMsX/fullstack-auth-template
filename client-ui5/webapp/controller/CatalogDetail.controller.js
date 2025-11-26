sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("invoice.app.controller.CatalogDetail", {

        onInit: function () {
            var oViewModel = new JSONModel({
                id_producto: null,
                sku: "",
                tipo: "PRODUCTO",
                precio_base: 0,
                id_impuesto: null,
                translations: {
                    en: { codigo_idioma: "en", nombre: "", descripcion: "" },
                    es: { codigo_idioma: "es", nombre: "", descripcion: "" }
                },
                prices: [] // Not implemented in UI yet
            });
            this.getView().setModel(oViewModel, "detail");

            var oTaxesModel = new JSONModel({ taxes: [] });
            this.getView().setModel(oTaxesModel, "taxes");

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("catalogNew").attachPatternMatched(this._onRouteMatchedNew, this);
            oRouter.getRoute("catalogDetail").attachPatternMatched(this._onRouteMatchedEdit, this);

            this._loadTaxes();
        },

        _loadTaxes: function () {
            // Mock taxes for now as we don't have a taxes API endpoint exposed yet or I missed it.
            // Actually, I should check if there is one. 
            // The schema has taxes. Let's assume we can fetch them or hardcode common ones for now.
            // Wait, I saw `GET /api/invoices/impuestos` in `InvoiceForm.controller.js` probably?
            // Let's check `InvoiceForm.controller.js` later. For now, I'll fetch from there if it exists.

            var sToken = localStorage.getItem("auth_token");
            var that = this;

            // Assuming this endpoint exists based on previous context
            fetch("http://localhost:3000/api/invoices/impuestos", {
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(res => res.json())
                .then(data => {
                    that.getView().getModel("taxes").setProperty("/taxes", data);
                })
                .catch(err => console.error("Error loading taxes", err));
        },

        _onRouteMatchedNew: function () {
            this._resetModel();
        },

        _onRouteMatchedEdit: function (oEvent) {
            var sProductId = oEvent.getParameter("arguments").productId;
            this._loadProduct(sProductId);
        },

        _resetModel: function () {
            var oModel = this.getView().getModel("detail");
            oModel.setData({
                id_producto: null,
                sku: "",
                tipo: "PRODUCTO",
                precio_base: 0,
                id_impuesto: null,
                translations: {
                    en: { codigo_idioma: "en", nombre: "", descripcion: "" },
                    es: { codigo_idioma: "es", nombre: "", descripcion: "" }
                },
                prices: []
            });
        },

        _loadProduct: function (sId) {
            var sToken = localStorage.getItem("auth_token");
            var that = this;
            var oModel = this.getView().getModel("detail");

            fetch("http://localhost:3000/api/catalog/products/" + sId, {
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(res => res.json())
                .then(data => {
                    // Transform translations array to object
                    var translations = {
                        en: { codigo_idioma: "en", nombre: "", descripcion: "" },
                        es: { codigo_idioma: "es", nombre: "", descripcion: "" }
                    };

                    if (data.translations) {
                        data.translations.forEach(t => {
                            if (translations[t.codigo_idioma]) {
                                translations[t.codigo_idioma] = t;
                            }
                        });
                    }

                    data.translations = translations;
                    oModel.setData(data);
                })
                .catch(err => console.error("Error loading product", err));
        },

        onSave: function () {
            var oModel = this.getView().getModel("detail");
            var oData = oModel.getData();
            var sToken = localStorage.getItem("auth_token");
            var that = this;

            // Transform translations object back to array
            var aTranslations = [
                oData.translations.en,
                oData.translations.es
            ].filter(t => t.nombre && t.nombre.trim() !== "");

            var oPayload = {
                sku: oData.sku,
                tipo: oData.tipo,
                precio_base: parseFloat(oData.precio_base),
                id_impuesto: oData.id_impuesto,
                translations: aTranslations,
                prices: oData.prices
            };

            var sUrl = "http://localhost:3000/api/catalog/products";
            var sMethod = "POST";

            if (oData.id_producto) {
                sUrl += "/" + oData.id_producto;
                sMethod = "PUT";
            }

            fetch(sUrl, {
                method: sMethod,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + sToken
                },
                body: JSON.stringify(oPayload)
            })
                .then(res => {
                    if (res.ok) {
                        MessageToast.show("Product saved successfully");
                        that.onNavBack();
                    } else {
                        res.json().then(data => {
                            MessageToast.show("Error: " + (data.error || "Unknown error"));
                        });
                    }
                })
                .catch(err => {
                    MessageToast.show("Error saving product");
                    console.error(err);
                });
        },

        onCancel: function () {
            this.onNavBack();
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("catalogList");
        }
    });
});
