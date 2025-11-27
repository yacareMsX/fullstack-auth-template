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
                menuVisible: true,
                headerTitle: "Compliance Hub",
                backButtonVisible: false
            });
            this.getView().setModel(oUIModel, "ui");

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
