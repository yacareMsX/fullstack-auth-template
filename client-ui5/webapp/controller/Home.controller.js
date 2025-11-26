sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
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

        onNavigateToIssueInvoices: function () {
            this.getOwnerComponent().getRouter().navTo("invoiceList", {
                tipo: "ISSUE"
            });
        },

        onNavigateToReceiptInvoices: function () {
            this.getOwnerComponent().getRouter().navTo("invoiceList", {
                tipo: "RECEIPT"
            });
        }
    });
});
