sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], function (Controller, History) {
    "use strict";

    return Controller.extend("invoice.app.controller.StatutoryLayout", {
        onInit: function () {

        },

        onSideNavButtonPress: function () {
            var oToolPage = this.byId("toolPage");
            var bSideExpanded = oToolPage.getSideExpanded();
            oToolPage.setSideExpanded(!bSideExpanded);
        },

        onHomePress: function () {
            this.getOwnerComponent().getRouter().navTo("home");
        },

        onItemSelect: function (oEvent) {
            var sKey = oEvent.getParameter("item").getKey();
            var oRouter = this.getOwnerComponent().getRouter();

            if (sKey === "modelo303") {
                oRouter.navTo("modelo303");
            }
            // Other keys can be handled here in the future
        }
    });
});
