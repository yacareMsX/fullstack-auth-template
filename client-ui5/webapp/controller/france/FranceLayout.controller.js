sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/ActionSheet",
    "sap/m/Button"
], function (Controller, ActionSheet, Button) {
    "use strict";

    return Controller.extend("invoice.app.controller.france.FranceLayout", {

        onInit: function () {
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
            var oToolPage = this.byId("toolPage");

            // We rely on Shell.controller.js to manage the Global UI Model properties 
            // (franceSidebarVisible, etc.) but we might need to expand our local ToolPage if it was collapsed.
            // Actually, wait - FranceLayout.view.xml binds its sidebar visibility to 'ui>/franceSidebarVisible'.
            // The Shell.controller.js sets that property.
            // So this controller might not need to do much regarding sidebar visibility/expansion 
            // EXCEPT if we want to ensure it starts expanded.

            // However, the previous logic here was hardcoding 'sidebarVisible' to true on the global model?
            // "oUIModel" here was a LOCALLY instantiated model in the old onInit!
            // Line 12: var oUIModel = new sap.ui.model.json.JSONModel({...});
            // Line 20: this.getView().setModel(oUIModel, "ui");

            // CRITICAL FINDING: FranceLayout was overwriting the "ui" model with its own local model!
            // This conflicts with the Global "ui" model set in Component.js or Shell.controller.js (if propagated).
            // Usually, models set on the Component are propagated. 
            // Shell sets "ui" on its view. Shell is top level.
            // FranceLayout is a child view (via routing targets in ShellNavContainer).
            // IF Shell sets "ui" on itself, it propagates to children.
            // BUT FranceLayout was doing `this.getView().setModel(oUIModel, "ui");`, masking the global model.

            // FIX: DO NOT create a local "ui" model. Use the one propagated from Shell/Component.
            // OR if Shell doesn't propagate (it typically does), we need to access it differently.
            // But usually, setting model on 'Shell' view (Root) propagates to all nested views.

            // So, I will REMOVE the local model creation and just rely on the inherited model.
            // And I will remove code that tries to set properties like "sidebarVisible" if they are already handled by Shell controller.

            // To be safe, I'll just keep the navigation logic.
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
                    oRouter.navTo("franceIssueNew");
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
            }

            // Auto-collapse on mobile after selection
            if (sap.ui.Device.system.phone) {
                this.byId("toolPage").setSideExpanded(false);
            }
        },

        onNavHome: function () {
            this.getOwnerComponent().getRouter().navTo("franceDashboard");
        }
    });
});
