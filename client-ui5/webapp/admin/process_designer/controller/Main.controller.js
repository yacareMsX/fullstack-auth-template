sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("process.designer.controller.Main", {

        onInit: function () {
            // UI Model
            var oUIModel = new sap.ui.model.json.JSONModel({
                themeIcon: "sap-icon://show"
            });
            this.getView().setModel(oUIModel, "ui");

            this._initTheme();
            this._handleDeepLink();
        },

        _handleDeepLink: function () {
            // With Router, deep linking is handled automatically by route matching!
            // But we need to update the SideNavigation selection when route changes.
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRouteMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            var oToolPage = this.byId("toolPage");
            var oSideNav = oToolPage.getSideContent();
            var sKey = "";

            if (sRouteName === "workflowList" || sRouteName === "workflowDesigner" || sRouteName === "workflowNew") {
                // Determine specific key if sidebar has sub-items
                // Sidebar: workflowList, workflowNew
                if (sRouteName === "workflowList") sKey = "workflowList";
                else if (sRouteName === "workflowNew") sKey = "workflowNew";
                else sKey = "workflowList"; // Fallback for detail view
            } else if (sRouteName === "xmlMapping") {
                sKey = "xmlMapping";
            } else if (sRouteName === "documentationXml") {
                sKey = "documentationXml";
            }

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
            // Optional sidebar toggle
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
            if (sKey === "workflowNew") {
                oRouter.navTo("workflowNew");
            } else if (sKey === "workflowList") {
                oRouter.navTo("workflowList");
            } else if (sKey === "xmlMapping") {
                oRouter.navTo("xmlMapping");
            } else if (sKey === "documentationXml") {
                oRouter.navTo("documentationXml");
            } else {
                MessageToast.show("Opción seleccionada: " + sKey + ". Funcionalidad en construcción.");
            }
        }
    });
});
