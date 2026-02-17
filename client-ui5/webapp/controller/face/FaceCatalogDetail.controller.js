sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("invoice.app.controller.face.FaceCatalogDetail", {

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("faceCatalogNew").attachPatternMatched(this._onNewProduct, this);
            oRouter.getRoute("faceCatalogEdit").attachPatternMatched(this._onEditProduct, this);

            var oModel = new JSONModel({
                sku: "",
                tipo: "producto",
                precio_base: 0,
                id_impuesto: 1,
                activo: true,
                translations: [],
                prices: []
            });
            this.getView().setModel(oModel, "detail");
        },

        _onNewProduct: function () {
            var oModel = this.getView().getModel("detail");
            oModel.setData({
                id_producto: null,
                sku: "",
                tipo: "producto",
                precio_base: 0,
                id_impuesto: 1,
                activo: true,
                translations: [],
                prices: []
            });
        },

        _onEditProduct: function (oEvent) {
            var sId = oEvent.getParameter("arguments").productId;
            this._loadProduct(sId);
        },

        _loadProduct: function (sId) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("/api/face/catalog/products/" + sId, {
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(res => res.json())
                .then(data => {
                    that.getView().getModel("detail").setData(data);
                })
                .catch(err => {
                    console.error("Error loading product:", err);
                    MessageToast.show("Error loading product");
                });
        },

        onAddTranslation: function () {
            var oModel = this.getView().getModel("detail");
            var aTranslations = oModel.getProperty("/translations") || [];
            aTranslations.push({ codigo_idioma: "", nombre: "", descripcion: "" });
            oModel.setProperty("/translations", aTranslations);
        },

        onDeleteTranslation: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var sPath = oItem.getBindingContext("detail").getPath();
            var iIndex = parseInt(sPath.split("/").pop());
            var oModel = this.getView().getModel("detail");
            var aTranslations = oModel.getProperty("/translations");
            aTranslations.splice(iIndex, 1);
            oModel.setProperty("/translations", aTranslations);
        },

        onAddPrice: function () {
            var oModel = this.getView().getModel("detail");
            var aPrices = oModel.getProperty("/prices") || [];
            aPrices.push({ codigo_pais: "", moneda: "", precio: 0 });
            oModel.setProperty("/prices", aPrices);
        },

        onDeletePrice: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var sPath = oItem.getBindingContext("detail").getPath();
            var iIndex = parseInt(sPath.split("/").pop());
            var oModel = this.getView().getModel("detail");
            var aPrices = oModel.getProperty("/prices");
            aPrices.splice(iIndex, 1);
            oModel.setProperty("/prices", aPrices);
        },

        onSave: function () {
            var oModel = this.getView().getModel("detail");
            var oData = oModel.getData();
            var sToken = localStorage.getItem("auth_token");

            var sUrl = "/api/face/catalog/products";
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
                body: JSON.stringify(oData)
            })
                .then(res => {
                    if (!res.ok) throw new Error("Failed to save");
                    return res.json();
                })
                .then(() => {
                    MessageToast.show("Product saved successfully");
                    this.onNavBack();
                })
                .catch(err => {
                    console.error("Error saving product:", err);
                    MessageBox.error("Error saving product");
                });
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("faceCatalogList");
        }
    });
});
