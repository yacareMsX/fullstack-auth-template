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

            this.getOwnerComponent().getRouter().attachRouteMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            if (sRouteName !== "home") {
                return;
            }

            var oArgs = oEvent.getParameter("arguments");
            var oQuery = oArgs["?query"];

            console.log("[Home] _onRouteMatched triggered. Query:", oQuery);

            if (oQuery && oQuery.section) {
                var sSectionId;
                switch (oQuery.section) {
                    case "invoices":
                        sSectionId = "invoices";
                        break;
                    case "reporting":
                        sSectionId = "reporting";
                        break;
                    case "statutory":
                        sSectionId = "statutory";
                        break;
                    case "france":
                        sSectionId = "invoices"; // France is in eInvoice Apps section? No, let's check view.
                        // View has: id="invoices" title="eInvoice Apps" -> contains France tile.
                        // But also France Layout routes exist? 
                        // The sidebar "France" item was likely mapping to `nav_france`?
                        // Shell controller maps `nav_einvoice` -> `section: "invoices"`.
                        // Let's assume France is inside "invoices" or "reporting".
                        // Looking at View: "eInvoice Apps" (id="invoices") has "eInvoice Francia".
                        // "Statutory" (id="statutory") has models.
                        // "Reporting" has France Reporting.
                        // Let's map based on structure.
                        break;
                    case "face":
                        sSectionId = "invoices"; // FACE is in eInvoice Apps
                        break;
                    case "certificates":
                        sSectionId = "config"; // Certificates in Global Configuration? view id="config" has certificate tile.
                        break;
                    case "businessMappings":
                        sSectionId = "school"; // Business Mappings in "School" section (id="school")
                        break;
                    case "userManagement":
                        sSectionId = "config"; // User Management in "Global Config" (id="config")
                        break;
                    case "config":
                        sSectionId = "config";
                        break;
                    case "processDesigner":
                        sSectionId = "workflow";
                        break;
                    case "workflow":
                        sSectionId = "workflow";
                        break;
                    case "school":
                        sSectionId = "school";
                        break;
                    case "audit":
                        sSectionId = "audit";
                        break;
                    case "api":
                        sSectionId = "api";
                        break;
                }

                console.log("[Home] Scrolling to section ID:", sSectionId);

                if (sSectionId) {
                    // Use a timeout to ensure the view is rendered
                    setTimeout(function () {
                        var oObjectPage = this.byId("ObjectPageLayout");
                        if (oObjectPage) {
                            var sFullId = this.byId(sSectionId) ? this.byId(sSectionId).getId() : null;
                            if (sFullId) {
                                console.log("[Home] ObjectPageLayout found. Scrolling to:", sFullId);
                                oObjectPage.scrollToSection(sFullId);
                            } else {
                                console.error("[Home] Section not found: " + sSectionId);
                            }
                        } else {
                            console.error("[Home] ObjectPageLayout NOT found.");
                        }
                    }.bind(this), 500);
                }
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

        onNavigateToFaceDashboard: function () {
            this.getOwnerComponent().getRouter().navTo("faceDashboard");
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
            this.getOwnerComponent().getRouter().navTo("model303");
        },

        onNavigateToFrance: function () {
            this.getOwnerComponent().getRouter().navTo("franceDashboard");
        },

        onNavigateToCertificates: function () {
            this.getOwnerComponent().getRouter().navTo("certificateList");
        },

        onNavigateToBusinessMappings: function () {
            this.getOwnerComponent().getRouter().navTo("documentationXml");
        },

        onNavigateToTutorials: function () {
            sap.m.MessageToast.show("Coming soon: Tutoriales");
        },

        onNavigateToHelp: function () {
            this.getOwnerComponent().getRouter().navTo("help");
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
