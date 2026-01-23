sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/ActionSheet",
    "sap/m/Button"
], function (Controller, ActionSheet, Button) {
    "use strict";

    return Controller.extend("invoice.app.controller.france.FranceLayout", {

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

            oUIModel.setProperty("/sidebarVisible", true);
            oUIModel.setProperty("/menuVisible", true);
            oUIModel.setProperty("/backButtonVisible", true);
            oToolPage.setSideExpanded(true);

            // Dynamic Title Logic
            var sPageTitle = "eInvoice France";
            oUIModel.setProperty("/headerTitle", sAppTitle + " / " + sPageTitle);
        },

        onItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            var sKey = oItem.getKey();
            var oRouter = this.getOwnerComponent().getRouter();

            switch (sKey) {
                case "franceDashboard":
                    oRouter.navTo("franceDashboard");
                    break;
                case "franceIssueList":
                    oRouter.navTo("franceIssueList", { tipo: "ISSUE" });
                    break;
                case "franceReceiptList":
                    oRouter.navTo("franceReceiptList", { tipo: "RECEIPT" });
                    break;
                case "franceIssueNew":
                    oRouter.navTo("franceIssueNew", { tipo: "ISSUE" });
                    break;
                case "franceReceiptNew":
                    oRouter.navTo("franceReceiptNew", { tipo: "RECEIPT" });
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
            }

            // Auto-collapse on mobile after selection
            if (sap.ui.Device.system.phone) {
                this.byId("toolPage").setSideExpanded(false);
            }
        },

        onNavHome: function () {
            this.getOwnerComponent().getRouter().navTo("franceDashboard");
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
