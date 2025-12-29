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
                sidebarVisible: true,
                sidebarVisible: true,
                menuVisible: true,
                headerTitle: "Compliance Hub",
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
            this.byId("languageAvatar").setSrc(sFlagImg);

            // Attach to router for navigation within shell
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRouteMatched(this._onRouteMatched, this);

            // Auto-collapse side navigation on phone
            if (sap.ui.Device.system.phone) {
                this.byId("toolPage").setSideExpanded(false);
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
            var oToolPage = this.byId("toolPage");
            var bSideExpanded = oToolPage.getSideExpanded();
            oToolPage.setSideExpanded(!bSideExpanded);
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("home");
        },

        _onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            var oUIModel = this.getView().getModel("ui");
            var oToolPage = this.byId("toolPage");
            var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            var sAppTitle = oResourceBundle.getText("appTitle");

            // Hide sidebar and menu button on Home screen
            if (sRouteName === "home") {
                oUIModel.setProperty("/sidebarVisible", false);
                oUIModel.setProperty("/menuVisible", false);
                oUIModel.setProperty("/backButtonVisible", false);
                oUIModel.setProperty("/headerTitle", sAppTitle);
                oToolPage.setSideExpanded(false);
            } else {
                oUIModel.setProperty("/sidebarVisible", true);
                oUIModel.setProperty("/menuVisible", true);
                oUIModel.setProperty("/backButtonVisible", true);
                oToolPage.setSideExpanded(true);

                // Dynamic Title Logic
                var sPageTitle = "eInvoice Ley C&C";

                if (sPageTitle) {
                    oUIModel.setProperty("/headerTitle", sAppTitle + " / " + sPageTitle);
                } else {
                    oUIModel.setProperty("/headerTitle", sAppTitle);
                }
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
                case "issuers":
                    oRouter.navTo("issuerManager");
                    break;
                case "receivers":
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
            this.byId("languageAvatar").setSrc(sFlagImg);
        },

        onProfilePress: function (oEvent) {
            var oButton = oEvent.getSource();

            if (!this._oProfileActionSheet) {
                this._oProfileActionSheet = new ActionSheet({
                    showCancelButton: true,
                    buttons: [
                        new Button({
                            text: "Logout",
                            icon: "sap-icon://log",
                            type: "Reject",
                            press: this.onLogout.bind(this)
                        })
                    ]
                });
                this.getView().addDependent(this._oProfileActionSheet);
            }

            this._oProfileActionSheet.openBy(oButton);
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
