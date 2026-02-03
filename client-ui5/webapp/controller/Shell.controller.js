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
                shellSidebarVisible: false, // Default to false for Home
                shellSidebarExpanded: true,

                // Sub-App Sidebars
                statutorySidebarVisible: true,
                statutorySidebarExpanded: true,

                franceSidebarVisible: true,
                franceSidebarExpanded: true,

                certificateSidebarVisible: true,
                certificateSidebarExpanded: true,

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
            var sContext = this._sCurrentContext || "shell";

            if (sContext === "shell") {
                var bExpanded = oUIModel.getProperty("/shellSidebarExpanded");
                oUIModel.setProperty("/shellSidebarExpanded", !bExpanded);
            } else if (sContext === "france") {
                var bExpanded = oUIModel.getProperty("/franceSidebarExpanded");
                oUIModel.setProperty("/franceSidebarExpanded", !bExpanded);
            } else if (sContext === "statutory") {
                var bExpanded = oUIModel.getProperty("/statutorySidebarExpanded");
                oUIModel.setProperty("/statutorySidebarExpanded", !bExpanded);
            } else if (sContext === "certificate") {
                var bExpanded = oUIModel.getProperty("/certificateSidebarExpanded");
                oUIModel.setProperty("/certificateSidebarExpanded", !bExpanded);
            }
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("home");
        },

        _onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");

            var oUIModel = this.getView().getModel("ui");
            var oToolPage = this.byId("toolPage"); // Keep this if needed for other things, but rely on model for visibility
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var sAppTitle = oResourceBundle.getText("appTitle");

            // Hide sidebar and menu button on Home screen
            if (sRouteName === "home") {
                oUIModel.setProperty("/shellSidebarVisible", false);
                oUIModel.setProperty("/menuVisible", false);
                oUIModel.setProperty("/headerVisible", true);
                oUIModel.setProperty("/backButtonVisible", false);
                oUIModel.setProperty("/headerTitle", sAppTitle);
                oUIModel.setProperty("/shellSidebarExpanded", false);
            } else if (sRouteName && (sRouteName.indexOf("statutory") === 0 || sRouteName.indexOf("modelo") === 0 || sRouteName.indexOf("france") === 0 || sRouteName.indexOf("certificate") === 0)) {
                // Statutory/France/Cert App Mode
                // Show Global Header (Unified)
                oUIModel.setProperty("/headerVisible", true);

                // Hide Global Sidebar (Sub-App handles its own)
                oUIModel.setProperty("/shellSidebarVisible", false);

                // Hide Menu Button (Global Sidebar is hidden, so toggling it is useless)
                oUIModel.setProperty("/menuVisible", false);

                // Show Back Button (To allow navigation back to Home/Dashboard)
                oUIModel.setProperty("/backButtonVisible", true);

                // Update Title? Optional, sub-apps might behave better with a generic title or we let them update it if they have access to the model.
                // Keeping previous title logic implies we set it here.
                if (sRouteName.indexOf("statutory") === 0 || sRouteName.indexOf("modelo") === 0) {
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
                }

                oUIModel.setProperty("/shellSidebarExpanded", false);
            } else {
                this._sCurrentContext = "shell";
                oUIModel.setProperty("/shellSidebarVisible", true);
                oUIModel.setProperty("/sidebarVisible", true); // Fallback for any missed bindings
                oUIModel.setProperty("/menuVisible", true);
                oUIModel.setProperty("/headerVisible", true);
                oUIModel.setProperty("/backButtonVisible", true);
                oUIModel.setProperty("/shellSidebarExpanded", true);

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
                    oRouter.navTo("home");
                    break;
                case "issueList":
                    oRouter.navTo("invoiceList", { tipo: "ISSUE" });
                    break;
                case "receiptList":
                    oRouter.navTo("invoiceList", { tipo: "RECEIPT" });
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
                    oRouter.navTo("catalogNew");
                    break;
                case "catalogList":
                    oRouter.navTo("catalogList");
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
                    oRouter.navTo("workflowNew");
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
                    oRouter.navTo("certificateLayout");
                    break;
            }

            // Auto-collapse on mobile after selection
            if (sap.ui.Device.system.phone) {
                this.byId("toolPage").setSideExpanded(false);
            }
        },

        onNavHome: function () {
            this.getOwnerComponent().getRouter().navTo("dashboard");
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
