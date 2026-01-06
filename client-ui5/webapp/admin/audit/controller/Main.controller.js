sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("audit.app.controller.Main", {

        onInit: function () {
            // UI Model
            var oUIModel = new sap.ui.model.json.JSONModel({
                themeIcon: "sap-icon://show"
            });
            this.getView().setModel(oUIModel, "ui");

            this._initTheme();

            // Router Setup
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRouteMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            var oToolPage = this.byId("toolPage");
            var oSideNav = oToolPage.getSideContent();
            var sKey = "auditLog";

            if (sKey && oSideNav) {
                oSideNav.setSelectedKey(sKey);
            }
        },

        _initTheme: function () {
            var sTheme = localStorage.getItem("theme");
            if (!sTheme) {
                sTheme = "sap_horizon";
            }
            sap.ui.getCore().applyTheme(sTheme);
            this._updateThemeIcon(sTheme);
        },

        onThemeToggle: function () {
            var sCurrentTheme = sap.ui.getCore().getConfiguration().getTheme();
            var sNewTheme = (sCurrentTheme === "sap_horizon_dark") ? "sap_horizon" : "sap_horizon_dark";

            sap.ui.getCore().applyTheme(sNewTheme);
            localStorage.setItem("theme", sNewTheme);
            this._updateThemeIcon(sNewTheme);
        },

        _updateThemeIcon: function (sTheme) {
            if (sTheme === "sap_horizon_dark") {
                this.getView().getModel("ui").setProperty("/themeIcon", "sap-icon://light-mode");
            } else {
                this.getView().getModel("ui").setProperty("/themeIcon", "sap-icon://palette");
            }
        },

        onNavHome: function () {
            window.location.href = "../../index.html";
        },

        onMenuPress: function () {
            var oToolPage = this.byId("toolPage");
            oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
        },

        onItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            var sKey = oItem.getKey();
            this._navToSection(sKey);
        },

        _navToSection: function (sKey) {
            var oRouter = this.getOwnerComponent().getRouter();

            if (sKey === "auditLog") {
                oRouter.navTo("auditLog");
            } else {
                MessageToast.show("Opción seleccionada: " + sKey + ". Funcionalidad en construcción.");
            }
        }
    });
});
