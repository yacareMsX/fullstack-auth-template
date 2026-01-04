sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("invoice.app.controller.Home", {

        onInit: function () {
            // Check authentication
            var sToken = localStorage.getItem("auth_token");
            if (!sToken) {
                this.getOwnerComponent().getRouter().navTo("login");
                return;
            }
        },

        onAfterRendering: function () {
            // Remove focus from all navigation buttons to prevent blue outline on page load
            var aButtons = [
                this.getView().findAggregatedObjects(true, function (oControl) {
                    return oControl.getMetadata().getName() === "sap.m.Button" &&
                        oControl.hasStyleClass("homeNavButton");
                })
            ];

            aButtons.forEach(function (aButtonGroup) {
                aButtonGroup.forEach(function (oButton) {
                    if (oButton.getDomRef()) {
                        oButton.getDomRef().blur();
                    }
                });
            });
        },

        onNavigateToDashboard: function () {
            this.getOwnerComponent().getRouter().navTo("dashboard");
        },

        onNavigateToUserManagement: function () {
            // Navigate to the standalone app
            window.location.href = "admin/user_management/index.html";
        },

        onNavigateToCountries: function () {
            // Navigate to the Global Configuration app, countries section
            window.location.href = "admin/user_management/index.html?section=countries";
        },

        onNavigateToWorkflow: function () {
            // Navigate to Process Designer app, workflow section
            window.location.href = "admin/process_designer/index.html?section=workflow";
        },

        onNavigateToXmlDesign: function () {
            // Navigate to Process Designer app, mapping section
            window.location.href = "admin/process_designer/index.html?section=mapping";
        },

        onGenericTilePress: function (oEvent) {
            var sTileHeader = oEvent.getSource().getHeader();
            sap.m.MessageToast.show("Funcionalidad '" + sTileHeader + "' próximamente disponible");
        },

        onSectionNavigate: function (oEvent) {
            var oButton = oEvent.getSource();
            var sKey = oButton.data("section");
            var oSection;

            // Remove focus from button to prevent blue outline
            if (oButton.getDomRef()) {
                oButton.getDomRef().blur();
            }

            // Get the section element
            switch (sKey) {
                case "invoices":
                    oSection = this.byId("invoicesSection");
                    break;
                case "reporting":
                    oSection = this.byId("reportingSection");
                    break;
                case "statutory":
                    oSection = this.byId("statutorySection");
                    break;
                case "userManagement":
                    oSection = this.byId("userManagementSection");
                    break;
                case "processDesigner":
                    oSection = this.byId("processDesignerSection");
                    break;
            }

            if (oSection) {
                // Get the DOM element
                var oDomRef = oSection.getDomRef();
                if (oDomRef) {
                    // Scroll to the section with smooth behavior
                    oDomRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }
    });
});
