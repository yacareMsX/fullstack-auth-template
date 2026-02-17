sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
    "use strict";

    return Controller.extend("invoice.app.controller.help.HelpLeyCreaCrece", {

        onInit: function () {
            // Initialization logic here
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("help");
        }
    });
});
