sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("invoice.app.controller.Shell", {

        onInit: function () {
            // Check authentication
            var sToken = localStorage.getItem("auth_token");
            if (!sToken) {
                this.getOwnerComponent().getRouter().navTo("login");
                return;
            }

            // Attach to router for navigation within shell
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("invoiceList").attachPatternMatched(this._onRouteMatched, this);
            oRouter.getRoute("invoiceNew").attachPatternMatched(this._onRouteMatched, this);
            oRouter.getRoute("invoiceEdit").attachPatternMatched(this._onRouteMatched, this);
            oRouter.getRoute("invoiceDetail").attachPatternMatched(this._onRouteMatched, this);
            oRouter.getRoute("issuerManager").attachPatternMatched(this._onRouteMatched, this);
            oRouter.getRoute("receiverManager").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            // Route matched - views will be loaded by router targets
        },

        onItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            var sKey = oItem.getKey();
            var oRouter = this.getOwnerComponent().getRouter();

            switch (sKey) {
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
            }
        },

        onNavHome: function () {
            this.getOwnerComponent().getRouter().navTo("home");
        },

        onLanguageChange: function (oEvent) {
            var sLanguage = oEvent.getParameter("selectedItem").getKey();
            sap.ui.getCore().getConfiguration().setLanguage(sLanguage);
            // Recargar la página para aplicar el cambio de idioma
            window.location.reload();
        },

        onLogout: function () {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            window.location.href = "login.html";
        }
    });
});
