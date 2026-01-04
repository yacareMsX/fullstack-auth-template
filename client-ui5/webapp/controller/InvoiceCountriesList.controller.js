sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("invoice.app.controller.InvoiceCountriesList", {

        onInit: function () {
            this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);

            // If running within a router context and the route exists (standalone or main app)
            if (this._oRouter && this._oRouter.getRoute("invoiceCountryList")) {
                this._oRouter.getRoute("invoiceCountryList").attachPatternMatched(this._onRouteMatched, this);
            } else {
                // If reuse scenario (e.g., embedded in SplitApp without its own route matching), load data immediately
                this._loadCountries();
            }
        },

        _onRouteMatched: function () {
            this._loadCountries();
        },

        _loadCountries: function () {
            var oModel = new JSONModel();
            oModel.loadData("/api/invoice-countries");
            this.getView().setModel(oModel, "invoiceCountries");
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
            this._oRouter.navTo("invoiceCountryDetail", {
                countryId: "new"
            });
        },

        onItemPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oContext = oItem.getBindingContext("invoiceCountries");
            var sPath = oContext.getPath();
            var oData = oContext.getModel().getProperty(sPath);

            this._oRouter.navTo("invoiceCountryDetail", {
                countryId: oData.id
            });
        }
    });
});
