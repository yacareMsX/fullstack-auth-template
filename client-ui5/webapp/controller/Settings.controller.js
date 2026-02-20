sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("invoice.app.controller.Settings", {
        onInit: function () {
            // Default Settings
            var oSettings = {
                dateFormat: "dd.MM.yyyy",
                timeFormat: "24h",
                numberFormat: "1,234,567.89",
                language: "en",
                appearance: "auto",
                timeZone: "Europe/Madrid"
            };

            // Load saved settings
            var sStoredSettings = localStorage.getItem("userSettings");
            if (sStoredSettings) {
                oSettings = JSON.parse(sStoredSettings);
            } else {
                // Initialize from current environment if no saved settings
                var sCurrentTheme = localStorage.getItem("theme");
                if (sCurrentTheme) {
                    if (sCurrentTheme === "sap_horizon") oSettings.appearance = "light";
                    else if (sCurrentTheme === "sap_horizon_dark") oSettings.appearance = "dark";
                    else if (sCurrentTheme === "sap_fiori_3_hcb") oSettings.appearance = "hc_dark";
                    else if (sCurrentTheme === "sap_fiori_3_hcw") oSettings.appearance = "hc_light";
                }

                var sCurrentLanguage = sap.ui.getCore().getConfiguration().getLanguage();
                if (sCurrentLanguage.startsWith("es")) oSettings.language = "es";
                else if (sCurrentLanguage.startsWith("fr")) oSettings.language = "fr";
                else if (sCurrentLanguage.startsWith("pl")) oSettings.language = "pl";
                else oSettings.language = "en";
            }

            var oModel = new JSONModel(oSettings);
            this.getView().setModel(oModel, "settings");
        },

        onNavBack: function () {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("home", {}, true);
            }
        },

        onSaveSettings: function () {
            var oModel = this.getView().getModel("settings");
            var oData = oModel.getData();

            // Save to LocalStorage
            localStorage.setItem("userSettings", JSON.stringify(oData));

            // Apply Theme
            this._applyTheme(oData.appearance);

            // Apply Language
            this._applyLanguage(oData.language);

            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("settingsSaved"));
        },

        _applyTheme: function (sAppearance) {
            var sTheme = "sap_horizon"; // Default Light

            switch (sAppearance) {
                case "dark":
                    sTheme = "sap_horizon_dark";
                    break;
                case "hc_light":
                    sTheme = "sap_fiori_3_hcw";
                    break;
                case "hc_dark":
                    sTheme = "sap_fiori_3_hcb";
                    break;
                case "auto":
                    // Simple auto-detect logic based on system preference
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        sTheme = "sap_horizon_dark";
                    }
                    break;
                case "light":
                default:
                    sTheme = "sap_horizon";
                    break;
            }

            sap.ui.getCore().applyTheme(sTheme);
            localStorage.setItem("theme", sTheme);
        },

        _applyLanguage: function (sLanguage) {
            sap.ui.getCore().getConfiguration().setLanguage(sLanguage);
            // Optional: Update binding if standard resource model doesn't auto-refresh (usually requires reload or model refresh)
            // Ideally reload to ensure all resources match
            // window.location.reload(); // Might be too aggressive?

            // For now, let's just set it. UI5 often needs a refresh for full propagation.
        }
    });
});
