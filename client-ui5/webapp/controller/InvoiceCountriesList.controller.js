sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("invoice.app.controller.InvoiceCountriesList", {

        onInit: function () {
            this._oRouter = this.getOwnerComponent().getRouter();
            var oRoute;

            try {
                oRoute = this._oRouter.getRoute("invoiceCountryList");
            } catch (e) {
                console.error("Error getting route 'invoiceCountryList':", e);
            }

            if (oRoute) {
                oRoute.attachPatternMatched(this._onRouteMatched, this);
            } else {
                console.warn("Route 'invoiceCountryList' not found in router. Loading data manually.");
                // Log all routes for debugging
                if (this._oRouter && this._oRouter._oRoutes) {
                    console.log("Available routes:", Object.keys(this._oRouter._oRoutes));
                }
                this._loadCountries();
            }
        },

        _onRouteMatched: function () {
            this._loadCountries();
        },

        _loadCountries: function () {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("/api/invoice-countries", {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + sToken,
                    "Content-Type": "application/json"
                }
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then(function (data) {
                    var oModel = new JSONModel(data);
                    that.getView().setModel(oModel, "invoiceCountries");
                })
                .catch(function (error) {
                    console.error("Error loading countries:", error);
                    sap.m.MessageToast.show("Error loading countries");
                });
        },

        onSearch: function (oEvent) {
            var aFilters = [];
            var sQuery = oEvent.getSource().getValue();
            if (sQuery && sQuery.length > 0) {
                var filter = new Filter("pais", FilterOperator.Contains, sQuery);
                aFilters.push(filter);
            }
            var oList = this.byId("countriesTable");
            var oBinding = oList.getBinding("items");
            oBinding.filter(aFilters);
        },

        onCreate: function () {
            if (this._oRouter && this._oRouter.getRoute("invoiceCountryDetail")) {
                this._oRouter.navTo("invoiceCountryDetail", {
                    countryId: "new"
                });
            } else {
                sap.m.MessageToast.show("Navigation to Create Country not available (Route not found)");
                console.error("Route 'invoiceCountryDetail' not found");
            }
        },

        onItemPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oContext = oItem.getBindingContext("invoiceCountries");
            var sPath = oContext.getPath();
            var oData = oContext.getModel().getProperty(sPath);

            if (this._oRouter && this._oRouter.getRoute("invoiceCountryDetail")) {
                this._oRouter.navTo("invoiceCountryDetail", {
                    countryId: oData.id
                });
            } else {
                sap.m.MessageToast.show("Navigation to Country Detail not available");
            }
        },

        formatDate: function (date) {
            if (!date) return "";
            var oDate = new Date(date);
            return oDate.toLocaleDateString();
        }
    });
});
