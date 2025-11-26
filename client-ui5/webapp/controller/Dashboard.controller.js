sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "invoice/app/model/formatter"
], function (Controller, JSONModel, formatter) {
    "use strict";

    return Controller.extend("invoice.app.controller.Dashboard", {
        formatter: formatter,

        onInit: function () {
            // Check if user is authenticated
            var sToken = localStorage.getItem("auth_token");
            if (!sToken) {
                this.getOwnerComponent().getRouter().navTo("login");
                return;
            }

            var oViewModel = new JSONModel({
                stats: {
                    total: 0,
                    borrador: 0,
                    emitida: 0,
                    pagada: 0
                },
                recentInvoices: []
            });
            this.getView().setModel(oViewModel, "dashboard");

            this._loadDashboardData();
        },

        _loadDashboardData: function () {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("http://localhost:3000/api/invoices/facturas?limit=5", {
                headers: {
                    "Authorization": "Bearer " + sToken
                }
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    var oModel = that.getView().getModel("dashboard");

                    // Calculate stats
                    var stats = {
                        total: data.length,
                        borrador: data.filter(function (inv) { return inv.estado === "BORRADOR"; }).length,
                        emitida: data.filter(function (inv) { return inv.estado === "EMITIDA"; }).length,
                        pagada: data.filter(function (inv) { return inv.estado === "PAGADA"; }).length
                    };

                    oModel.setProperty("/stats", stats);
                    oModel.setProperty("/recentInvoices", data);
                })
                .catch(function (error) {
                    console.error("Error loading dashboard data:", error);
                });
        },

        onCreateInvoice: function () {
            this.getOwnerComponent().getRouter().navTo("invoiceNew");
        },

        onNavToList: function () {
            this.getOwnerComponent().getRouter().navTo("invoiceList");
        },

        onInvoiceSelect: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oContext = oItem.getBindingContext("dashboard");
            var sInvoiceId = oContext.getProperty("id_factura");

            this.getOwnerComponent().getRouter().navTo("invoiceDetail", {
                invoiceId: sInvoiceId
            });
        },

        onManageIssuers: function () {
            this.getOwnerComponent().getRouter().navTo("issuerManager");
        },

        onManageReceivers: function () {
            this.getOwnerComponent().getRouter().navTo("receiverManager");
        },

        onLogout: function () {
            // Clear authentication
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");

            // Update auth model
            var oAuthModel = this.getOwnerComponent().getModel("auth");
            oAuthModel.setProperty("/token", null);
            oAuthModel.setProperty("/user", {});

            // Navigate to login
            this.getOwnerComponent().getRouter().navTo("login");
        }
    });
});
