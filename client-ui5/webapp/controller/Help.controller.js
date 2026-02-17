sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/UIComponent"
], function (Controller, MessageToast, UIComponent) {
    "use strict";

    return Controller.extend("invoice.app.controller.Help", {

        onInit: function () {
            // Initialization logic here
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("home");
        },

        onSearch: function (oEvent) {
            // Placeholder for search functionality
            // If triggered by button, get value from SearchField
            var sQuery = "";

            if (oEvent.getId() === "press") {
                // Button pressed
                var oSearchField = this.getView().byId("searchField"); // We need to add ID to search field if we want to access it here
                // simpler: just show message
            } else {
                // SearchField triggered
                sQuery = oEvent.getParameter("query");
            }

            MessageToast.show("Search feature coming soon.");
        },

        onPressLink: function (oEvent) {
            var sText = oEvent.getSource().getText();
            var oRouter = this.getOwnerComponent().getRouter();

            if (sText === "Ley Crea y Crece") {
                oRouter.navTo("helpLeyCreaCrece");
            } else {
                MessageToast.show("Documentation for '" + sText + "' coming soon.");
            }
        }
    });
});
