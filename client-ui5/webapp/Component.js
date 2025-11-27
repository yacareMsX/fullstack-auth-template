sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("invoice.app.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            // Call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // Force Spanish locale globally
            sap.ui.getCore().getConfiguration().setLanguage("es-ES");
            sap.ui.getCore().getConfiguration().setFormatLocale("es-ES");

            // Set authentication model
            var sToken = localStorage.getItem("auth_token");
            var oAuthModel = new JSONModel({
                token: sToken,
                user: JSON.parse(localStorage.getItem("auth_user") || "{}")
            });
            this.setModel(oAuthModel, "auth");

            // Check authentication - redirect to login if not authenticated
            if (!sToken) {
                window.location.href = "login.html";
                return;
            }

            // Initialize router only if authenticated
            var oRouter = this.getRouter();
            oRouter.initialize();

            // Initialize global model for scanned data
            this.setModel(new JSONModel({}), "scannedData");
        }
    });
});
