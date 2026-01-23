sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/ActionSheet",
    "sap/m/Button"
], function (Controller, ActionSheet, Button) {
    "use strict";

    return Controller.extend("invoice.app.controller.certificates.CertificateLayout", {

        onInit: function () {
            // Initialize UI model for shell state
            var oUIModel = new sap.ui.model.json.JSONModel({
                certificateSidebarVisible: true,
                certificateMenuVisible: true,
                headerTitle: "Gestor de Certificados"
            });
            this.getView().setModel(oUIModel, "ui");

            // Attach to router for navigation
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRouteMatched(this._onRouteMatched, this);

            // Auto-collapse side navigation on phone
            if (sap.ui.Device.system.phone) {
                this.byId("certificateToolPage").setSideExpanded(false);
            }
        },

        onMenuPress: function () {
            var oToolPage = this.byId("certificateToolPage");
            var bSideExpanded = oToolPage.getSideExpanded();
            oToolPage.setSideExpanded(!bSideExpanded);
        },

        _onRouteMatched: function (oEvent) {
            // Ensure sidebar is visible when entering this layout
            var oUIModel = this.getView().getModel("ui");
            oUIModel.setProperty("/certificateSidebarVisible", true);
        },

        onItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            var sKey = oItem.getKey();
            var oRouter = this.getOwnerComponent().getRouter();

            switch (sKey) {
                case "certificateList":
                    oRouter.navTo("certificateList");
                    break;
                default:
                    break;
            }

            if (sap.ui.Device.system.phone) {
                this.byId("certificateToolPage").setSideExpanded(false);
            }
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("home");
        },

        onProfilePress: function (oEvent) {
            // Reusing the profile logic if possible or just log for now
            console.log("Profile pressed");
        }
    });
});
