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

            // Log Security Model Data
            var oSecurityModel = this.getOwnerComponent().getModel("security");
            console.log("[Home] Security Model Data onInit:", oSecurityModel ? oSecurityModel.getData() : "Model not found");
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

        onShowInfo: function () {
            sap.ui.require(["sap/m/MessageBox"], function (MessageBox) {
                // Style matches the request: Blue header (Info state), "Information" title, OK button.
                MessageBox.information("Por rellenar", {
                    title: "Information",
                    actions: [MessageBox.Action.OK]
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

        onNavigateToAudit: function () {
            window.location.href = "admin/audit/index.html";
        },

        onNavigateToApiDocs: function () {
            window.location.href = "admin/api_docs/index.html";
        },

        onNavigateToModelo303: function () {
            this.getOwnerComponent().getRouter().navTo("modelo303");
        },

        onNavigateToFrance: function () {
            this.getOwnerComponent().getRouter().navTo("franceDashboard");
        },

        onNavigateToCertificates: function () {
            this.getOwnerComponent().getRouter().navTo("certificateLayout");
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
                case "audit":
                    oSection = this.byId("auditSection");
                    break;
                case "api":
                    oSection = this.byId("apiSection");
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
