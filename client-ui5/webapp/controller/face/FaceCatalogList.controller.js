sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, MessageToast, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("invoice.app.controller.face.FaceCatalogList", {

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("faceCatalogList").attachPatternMatched(this._onRouteMatched, this);

            var oModel = new JSONModel({
                products: []
            });
            this.getView().setModel(oModel, "catalog");
        },

        _onRouteMatched: function () {
            this._loadProducts();
        },

        _loadProducts: function (sQuery) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");
            var sUrl = "/api/face/catalog/products";

            // Get current language
            var sLang = sap.ui.getCore().getConfiguration().getLanguage().split("-")[0];
            sUrl += "?lang=" + sLang;

            if (sQuery) {
                sUrl += "&search=" + encodeURIComponent(sQuery);
            }

            fetch(sUrl, {
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(res => res.json())
                .then(data => {
                    that.getView().getModel("catalog").setProperty("/products", data);
                })
                .catch(err => {
                    console.error("Error loading catalog:", err);
                    MessageToast.show("Error loading catalog");
                });
        },

        onSearch: function (oEvent) {
            var aFilters = [];
            var sQuery = this.byId("searchFilter").getValue();
            var sSku = this.byId("skuFilter").getValue();
            var sName = this.byId("nameFilter").getValue();
            var sStatus = this.byId("statusFilter").getSelectedKey();

            if (sQuery) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("sku", FilterOperator.Contains, sQuery),
                        new Filter("nombre", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }

            if (sSku) {
                aFilters.push(new Filter("sku", FilterOperator.Contains, sSku));
            }

            if (sName) {
                aFilters.push(new Filter("nombre", FilterOperator.Contains, sName));
            }

            if (sStatus) {
                var bActive = sStatus === "true";
                aFilters.push(new Filter("activo", FilterOperator.EQ, bActive));
            }

            var oTable = this.byId("catalogTable");
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
        },

        onCreateProduct: function () {
            this.getOwnerComponent().getRouter().navTo("faceCatalogNew");
        },

        onProductPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var sPath = oItem.getBindingContext("catalog").getPath();
            var oProduct = this.getView().getModel("catalog").getProperty(sPath);

            this.getOwnerComponent().getRouter().navTo("faceCatalogNew", {
                productId: oProduct.id_producto
            });
        }
    });
});
