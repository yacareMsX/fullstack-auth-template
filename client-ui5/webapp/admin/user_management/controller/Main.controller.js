sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("user.management.controller.Main", {

        onInit: function () {
            // UI Model
            var oUIModel = new sap.ui.model.json.JSONModel({
                themeIcon: "sap-icon://show"
            });
            this.getView().setModel(oUIModel, "ui");

            this._initTheme();
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
            // Optional: Toggle sidebar if we wanted to support collapsing the SplitApp master
        },

        onListItemPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var sKey = oItem.data("key");
            var oSplitApp = this.byId("userMgmtSplitApp");

            if (sKey === "users") {
                oSplitApp.toDetail(this.createId("usersDetail"));
            } else if (sKey === "roles") {
                oSplitApp.toDetail(this.createId("rolesDetail"));
            } else {
                oSplitApp.toDetail(this.createId("detailUnderConstruction"));
                MessageToast.show("Opción seleccionada: " + sKey + ". Funcionalidad en construcción.");
            }
        }
    });
});
