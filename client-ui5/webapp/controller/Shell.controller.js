sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/ActionSheet",
    "sap/m/Button"
], function (Controller, ActionSheet, Button) {
    "use strict";

    return Controller.extend("invoice.app.controller.Shell", {

        onInit: function () {
            // Initialize UI model for shell state
            var oUIModel = new sap.ui.model.json.JSONModel({
                // Global Shell Sidebar
                certificateSidebarExpanded: true,

                businessMappingsSidebarVisible: false,
                businessMappingsSidebarExpanded: true,

                faceSidebarVisible: false,

                menuVisible: false, // Default to false for Home
                headerTitle: "Home",
                headerVisible: true,
                backButtonVisible: false,
                themeIcon: "sap-icon://show" // Default icon
            });
            this.getView().setModel(oUIModel, "ui");

            // Initialize Theme
            this._initTheme();

            // Check authentication
            var sToken = localStorage.getItem("auth_token");
            if (!sToken) {
                this.getOwnerComponent().getRouter().navTo("login");
                return;
            }

            // Initialize language selector
            var sCurrentLanguage = sap.ui.getCore().getConfiguration().getLanguage();
            // Handle cases like "en-US" -> "en"
            if (sCurrentLanguage.indexOf("es") === 0) {
                sCurrentLanguage = "es";
            } else {
                sCurrentLanguage = "en";
            }

            var sFlagImg = sCurrentLanguage === "es" ? "img/flag_es.png" : "img/flag_en.png";
            var oLangAvatar = this.byId("languageAvatar");
            if (oLangAvatar) {
                oLangAvatar.setSrc(sFlagImg);
            }

            // Attach to router for navigation within shell
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRouteMatched(this._onRouteMatched, this);

            // Auto-collapse side navigation on phone
            if (sap.ui.Device.system.phone) {
                oUIModel.setProperty("/shellSidebarExpanded", false);
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
            var sIcon = (sTheme === "sap_horizon_dark") ? "sap-icon://light-mode" : "sap-icon://show";
            // 'show' resembles an eye/look, used here as generic if dark mode icon not perfect, 
            // but sap-icon://light-mode is clear for switching BACK to light.
            // Using logic: If Dark -> Show Light Icon. If Light -> Show Dark Icon? 
            // Standard toggle behavior: Icon indicates what clicking will DO, or current state.
            // Let's make it indicate what it IS:
            // Dark Mode = Moon? Light Mode = Sun?
            // Let's use generic toggles.

            // Better:
            // If Light (sap_horizon) -> Show Moon (Enter Dark) -> sap-icon://moon (if avail) or sap-icon://hide
            // If Dark (sap_horizon_dark) -> Show Sun (Enter Light) -> sap-icon://light-mode (if avail) or sap-icon://show

            // Checking common icons: 
            // sap-icon://light-mode (Sun-like)
            // sap-icon://custom/dark-mode (requires registration). 
            // Let's use simple ones. 
            // Light Theme active -> Button shows Moon (to switch to dark) -> sap-icon://sleep
            // Dark Theme active -> Button shows Sun (to switch to light) -> sap-icon://light-mode

            if (sTheme === "sap_horizon_dark") {
                this.getView().getModel("ui").setProperty("/themeIcon", "sap-icon://light-mode");
            } else {
                this.getView().getModel("ui").setProperty("/themeIcon", "sap-icon://show"); // Placeholder for "Dark" intent if Moon not sure. 
                // Actually 'sap-icon://palette' is a safe semantic for "Theme".
                this.getView().getModel("ui").setProperty("/themeIcon", "sap-icon://palette");
            }
        },

        onMenuPress: function () {
            var oUIModel = this.getView().getModel("ui");
            var bExpanded = oUIModel.getProperty("/shellSidebarExpanded");
            oUIModel.setProperty("/shellSidebarExpanded", !bExpanded);
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("home");
        },

        _resetSidebars: function (oUIModel) {
            oUIModel.setProperty("/shellSidebarVisible", false);
            oUIModel.setProperty("/statutorySidebarVisible", false);
            oUIModel.setProperty("/franceSidebarVisible", false);
            oUIModel.setProperty("/certificateSidebarVisible", false);
            oUIModel.setProperty("/businessMappingsSidebarVisible", false);
            oUIModel.setProperty("/faceSidebarVisible", false);
            oUIModel.setProperty("/helpSidebarVisible", false);
        },

        _onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            console.log("DEBUG SHELL ROUTE:", sRouteName);

            var oUIModel = this.getView().getModel("ui");
            // Reset all sidebars first
            this._resetSidebars(oUIModel);

            // Force consistent header defaults immediately
            oUIModel.setProperty("/menuVisible", false);
            oUIModel.setProperty("/backButtonVisible", false);

            var oToolPage = this.byId("toolPage"); // Keep this if needed for other things, but rely on model for visibility
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var sAppTitle = oResourceBundle.getText("appTitle");

            // Hide sidebar and menu button on Home screen
            if (sRouteName === "home") {
                // Sidebars already hidden by _resetSidebars
                oUIModel.setProperty("/headerVisible", true);
                oUIModel.setProperty("/headerTitle", sAppTitle);
                oUIModel.setProperty("/shellSidebarExpanded", false);
            } else if (sRouteName === "help") {
                this._sCurrentContext = "help";
                oUIModel.setProperty("/headerVisible", true);
                oUIModel.setProperty("/menuVisible", true);
                oUIModel.setProperty("/backButtonVisible", false);
                oUIModel.setProperty("/headerTitle", "Delliom Help Portal");
                oUIModel.setProperty("/helpSidebarVisible", true);
                oUIModel.setProperty("/shellSidebarVisible", false);
            } else if (sRouteName === "helpLeyCreaCrece") {
                this._sCurrentContext = "face"; // Mimic Face context
                oUIModel.setProperty("/headerVisible", true);
                oUIModel.setProperty("/menuVisible", true);
                oUIModel.setProperty("/backButtonVisible", true); // Enable back button to return to Help? Or false? User didn't specify, but usually doc needs exit.
                oUIModel.setProperty("/headerTitle", "eCompliance > eInvoice Ley C&C");
                oUIModel.setProperty("/faceSidebarVisible", true); // Show Face Sidebar as requested
                oUIModel.setProperty("/shellSidebarVisible", false);
            } else if (sRouteName && (sRouteName.indexOf("statutory") === 0 || sRouteName.indexOf("model") === 0 || sRouteName.indexOf("france") === 0 || sRouteName.indexOf("certificate") === 0 || sRouteName.indexOf("face") === 0)) {
                // Statutory/France/Cert App Mode
                // Show Global Header (Unified)
                oUIModel.setProperty("/headerVisible", true);

                // Sidebar visibility handled below per app

                // Show Menu Button to allow toggling sidebar
                oUIModel.setProperty("/menuVisible", true);

                // Show Back Button -> DISABLED to keep Home Icon visible
                oUIModel.setProperty("/backButtonVisible", false);

                if (sRouteName.indexOf("statutory") === 0 || sRouteName.indexOf("model") === 0) {
                    this._sCurrentContext = "statutory";
                    oUIModel.setProperty("/headerTitle", "Compliance Hub - Statutory Report");
                    oUIModel.setProperty("/statutorySidebarVisible", true);
                } else if (sRouteName.indexOf("france") === 0) {
                    this._sCurrentContext = "france";
                    oUIModel.setProperty("/headerTitle", "Compliance Hub - France");
                    oUIModel.setProperty("/franceSidebarVisible", true);
                } else if (sRouteName.indexOf("certificate") === 0) {
                    this._sCurrentContext = "certificate";
                    oUIModel.setProperty("/headerTitle", "Gestor de Certificados");
                    oUIModel.setProperty("/certificateSidebarVisible", true);
                } else if (sRouteName.indexOf("face") === 0) {
                    this._sCurrentContext = "face";
                    oUIModel.setProperty("/headerTitle", "Compliance Hub - eInvoice FACE");
                    oUIModel.setProperty("/faceSidebarVisible", true);
                    oUIModel.setProperty("/shellSidebarVisible", false);
                }

            } else if (sRouteName && sRouteName.indexOf("documentation") > -1) {
                // Business Mappings Mode
                this._sCurrentContext = "businessMappings";
                oUIModel.setProperty("/headerVisible", true);
                oUIModel.setProperty("/headerTitle", "Business Mappings");
                oUIModel.setProperty("/menuVisible", true);
                oUIModel.setProperty("/backButtonVisible", false);

                oUIModel.setProperty("/businessMappingsSidebarVisible", true);
                oUIModel.setProperty("/shellSidebarVisible", false);

            } else {
                this._sCurrentContext = "shell";
                oUIModel.setProperty("/shellSidebarVisible", true); // Re-enable default shell sidebar
                oUIModel.setProperty("/sidebarVisible", true); // Fallback for any missed bindings

                // Force Consistent Header
                oUIModel.setProperty("/menuVisible", true);
                oUIModel.setProperty("/headerVisible", true);
                oUIModel.setProperty("/backButtonVisible", false);

                // Force expand by default to ensuring visibility. User can collapse later.
                oUIModel.setProperty("/shellSidebarExpanded", true);

                console.log("DEBUG: Default Shell Context. SidebarVisible:", oUIModel.getProperty("/shellSidebarVisible"), "Expanded:", oUIModel.getProperty("/shellSidebarExpanded"));

                // Dynamic Title Logic
                var sPageTitle = "eInvoice Ley C&C";
                oUIModel.setProperty("/headerTitle", sAppTitle + " / " + sPageTitle);
            }
        },

        onItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            var sKey = oItem.getKey();
            var oRouter = this.getOwnerComponent().getRouter();

            switch (sKey) {
                case "dashboard":
                    oRouter.navTo("dashboard");
                    break;
                case "issueList":
                    oRouter.navTo("issueInvoices");
                    break;
                case "receiptList":
                    oRouter.navTo("receiptInvoices");
                    break;
                case "issueNew":
                    oRouter.navTo("invoiceNew", { tipo: "ISSUE" });
                    break;
                case "receiptNew":
                    oRouter.navTo("invoiceNew", { tipo: "RECEIPT" });
                    break;
                case "scanInvoice":
                    oRouter.navTo("scanInvoice");
                    break;
                case "uploadExcel":
                    sap.m.MessageToast.show("Coming soon");
                    break;
                case "catalogNew":
                    // TODO: Create catalogNew route or point to catalogDetail with 'new'
                    oRouter.navTo("catalogNew"); // Now defined
                    break;
                case "catalogList":
                    oRouter.navTo("catalog"); // Fixed target
                    break;
                case "issuerManager":
                    oRouter.navTo("issuerManager");
                    break;
                case "receiverManager":
                    oRouter.navTo("receiverManager");
                    break;
                case "taxes":
                    // TODO: Navigate to taxes manager
                    sap.m.MessageToast.show("Tax management - Coming soon");
                    break;
                case "workflowList":
                    oRouter.navTo("workflowList");
                    break;
                case "workflowNew":
                    oRouter.navTo("workflowDesigner"); // Assuming designer handles new
                    break;
                case "originList":
                    oRouter.navTo("originList");
                    break;
                case "apiDocs":
                    oRouter.navTo("apiDocs");
                    break;
                case "auditLog":
                    oRouter.navTo("auditLog");
                    break;
                case "xmlMapping":
                    oRouter.navTo("xmlMapping");
                    break;
                case "invoiceCountryList":
                    oRouter.navTo("invoiceCountryList");
                    break;
                case "certificateLayout":
                    oRouter.navTo("certificateList");
                    break;
                case "model303":
                    oRouter.navTo("model303");
                    break;
                case "model349":
                    sap.m.MessageToast.show("Modelo 349 no disponible");
                    break;
                case "model322":
                    sap.m.MessageToast.show("Modelo 202 no disponible");
                    break;

                // France Navigation
                case "franceDashboard":
                    oRouter.navTo("franceDashboard");
                    break;
                case "franceIssueList":
                    oRouter.navTo("franceIssueList");
                    break;
                case "franceIssueNew":
                    oRouter.navTo("franceIssueNew");
                    break;
                case "franceReceiptList":
                    oRouter.navTo("franceReceiptList");
                    break;
                case "franceReceiptNew":
                    oRouter.navTo("franceReceiptNew");
                    break;
                case "franceScanInvoice":
                    oRouter.navTo("franceScanInvoice");
                    break;
                case "franceCatalogNew":
                    oRouter.navTo("franceCatalogNew");
                    break;
                case "franceCatalogList":
                    oRouter.navTo("franceCatalogList");
                    break;
                case "franceIssuerManager":
                    oRouter.navTo("franceIssuerManager");
                    break;
                case "franceReceiverManager":
                    oRouter.navTo("franceReceiverManager");
                    break;
                case "franceOriginList":
                    oRouter.navTo("franceOriginList");
                    break;
                case "franceOriginList":
                    oRouter.navTo("franceOriginList");
                    break;

                // Face Navigation
                case "faceDashboard":
                    oRouter.navTo("faceDashboard");
                    break;
                case "faceIssueList":
                    oRouter.navTo("faceIssueInvoices");
                    break;
                case "faceReceiptList":
                    oRouter.navTo("faceReceiptInvoices");
                    break;
                case "faceIssueNew":
                    oRouter.navTo("faceInvoiceNew", { tipo: "ISSUE" });
                    break;
                case "faceReceiptNew":
                    oRouter.navTo("faceInvoiceNew", { tipo: "RECEIPT" });
                    break;
                case "faceScanInvoice":
                    oRouter.navTo("faceScanInvoice");
                    break;
                case "faceCatalogNew":
                    oRouter.navTo("faceCatalogNew"); // Ensure this route exists in manifest
                    break;
                case "faceCatalogList":
                    oRouter.navTo("faceCatalogList"); // Ensure this route exists in manifest
                    break;
                case "faceIssuerManager":
                    oRouter.navTo("faceIssuerManager");
                    break;
                case "faceReceiverManager":
                    oRouter.navTo("faceReceiverManager");
                    break;

                // Help Portal Navigation
                case "helpApps":
                case "helpReporting":
                case "helpStatutory":
                case "helpConfig":
                case "helpProcess":
                case "helpAudit":
                case "helpAPIs":
                    // Stay on Help page, maybe scroll or filter later. For now, do nothing as requested.
                    break;
            }

            // Auto-collapse on mobile after selection
            if (sap.ui.Device.system.phone) {
                this.byId("toolPage").setSideExpanded(false);
            }
        },

        onNavHome: function () {
            this.getOwnerComponent().getRouter().navTo("home");
        },

        onLanguagePress: function (oEvent) {
            var oButton = oEvent.getSource();

            if (!this._oLanguageActionSheet) {
                this._oLanguageActionSheet = new ActionSheet({
                    title: "Select Language",
                    showCancelButton: true,
                    buttons: [
                        new Button({
                            text: "English",
                            icon: "img/flag_en.png",
                            press: function () {
                                this._setLanguage("en");
                            }.bind(this)
                        }),
                        new Button({
                            text: "Español",
                            icon: "img/flag_es.png",
                            press: function () {
                                this._setLanguage("es");
                            }.bind(this)
                        })
                    ]
                });
                this.getView().addDependent(this._oLanguageActionSheet);
            }

            this._oLanguageActionSheet.openBy(oButton);
        },

        _setLanguage: function (sLanguage) {
            sap.ui.getCore().getConfiguration().setLanguage(sLanguage);
            var sFlagImg = sLanguage === "es" ? "img/flag_es.png" : "img/flag_en.png";
            var oLangAvatar = this.byId("languageAvatar");
            if (oLangAvatar) {
                oLangAvatar.setSrc(sFlagImg);
            }
        },

        onProfilePress: function (oEvent) {
            var oButton = oEvent.getSource();
            var oView = this.getView();

            if (!this._pProfilePopover) {
                this._pProfilePopover = sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "invoice.app.view.UserProfilePopover",
                    controller: this
                }).then(function (oPopover) {
                    oView.addDependent(oPopover);
                    return oPopover;
                });
            }

            this._pProfilePopover.then(function (oPopover) {
                oPopover.openBy(oButton);
            });
        },

        onLogout: function () {
            var sToken = localStorage.getItem("auth_token");
            if (sToken) {
                fetch("/api/logout", {
                    method: "POST",
                    headers: {
                        "Authorization": "Bearer " + sToken
                    }
                }).finally(function () {
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("auth_user");
                    window.location.href = "login.html";
                });
            } else {
                localStorage.removeItem("auth_token");
                localStorage.removeItem("auth_user");
                window.location.href = "login.html";
            }
        }
    });
});
