sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "invoice/app/model/formatter"
], function (Controller, JSONModel, Filter, FilterOperator, formatter) {
    "use strict";

    return Controller.extend("invoice.app.controller.CatalogList", {
        formatter: formatter,

        onInit: function () {
            var oViewModel = new JSONModel({
                products: []
            });
            this.getView().setModel(oViewModel, "catalog");

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("catalogList").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._loadProducts();
        },

        _loadProducts: function () {
            var that = this;
            var sToken = localStorage.getItem("auth_token");
            var oModel = this.getView().getModel("catalog");

            fetch("http://localhost:3000/api/catalog/products", {
                headers: {
                    "Authorization": "Bearer " + sToken
                }
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    oModel.setProperty("/products", data);
                })
                .catch(function (error) {
                    console.error("Error loading products:", error);
                });
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oTable = this.byId("productsTable");
            var oBinding = oTable.getBinding("items");

            if (sQuery) {
                var aFilters = [
                    new Filter("sku", FilterOperator.Contains, sQuery),
                    // We can't easily filter by translation name in client-side JSON model if it's nested deep,
                    // but let's try to filter by the first translation name since that's what we show
                    new Filter("translations/0/nombre", FilterOperator.Contains, sQuery)
                ];
                oBinding.filter(new Filter({
                    filters: aFilters,
                    and: false
                }));
            } else {
                oBinding.filter([]);
            }
        },

        onCreateProduct: function () {
            this.getOwnerComponent().getRouter().navTo("catalogNew");
        },

        onProductSelect: function (oEvent) {
            var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
            var oContext = oItem.getBindingContext("catalog");
            var sProductId = oContext.getProperty("id_producto");

            this.getOwnerComponent().getRouter().navTo("catalogDetail", {
                productId: sProductId
            });
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("home");
        }
    });
});
