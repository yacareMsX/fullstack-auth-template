sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "invoice/app/model/formatter"
], function (Controller, JSONModel, Filter, FilterOperator, formatter) {
    "use strict";

    return Controller.extend("invoice.app.controller.InvoiceList", {
        formatter: formatter,

        onInit: function () {
            var oViewModel = new JSONModel({
                invoices: [],
                tipo: "ISSUE",
                pageTitle: "Issue Invoices"
            });
            this.getView().setModel(oViewModel, "invoiceList");

            // Attach to route pattern matched
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("invoiceList").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sTipo = oEvent.getParameter("arguments").tipo || "ISSUE";
            var oModel = this.getView().getModel("invoiceList");
            oModel.setProperty("/tipo", sTipo);

            // Update page title based on tipo
            var sTitle = sTipo === "ISSUE" ? "Issue Invoices" : "Receipt Invoices";
            oModel.setProperty("/pageTitle", sTitle);

            this._loadInvoices();
        },

        _loadInvoices: function (sStatus) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");
            var oModel = this.getView().getModel("invoiceList");
            var sTipo = oModel.getProperty("/tipo");

            var sUrl = "http://localhost:3000/api/invoices/facturas?tipo=" + sTipo;

            if (sStatus) {
                sUrl += "&estado=" + sStatus;
            }

            fetch(sUrl, {
                headers: {
                    "Authorization": "Bearer " + sToken
                }
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    oModel.setProperty("/invoices", data);
                })
                .catch(function (error) {
                    console.error("Error loading invoices:", error);
                });
        },

        onFilterChange: function (oEvent) {
            var sStatus = oEvent.getParameter("selectedItem").getKey();
            this._loadInvoices(sStatus || null);
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oTable = this.byId("invoicesTable");
            var oBinding = oTable.getBinding("items");

            if (sQuery) {
                var aFilters = [
                    new Filter("numero", FilterOperator.Contains, sQuery),
                    new Filter("receptor_nombre", FilterOperator.Contains, sQuery)
                ];
                oBinding.filter(new Filter({
                    filters: aFilters,
                    and: false
                }));
            } else {
                oBinding.filter([]);
            }
        },

        onInvoiceSelect: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oContext = oItem.getBindingContext("invoiceList");
            var sInvoiceId = oContext.getProperty("id_factura");

            this.getOwnerComponent().getRouter().navTo("invoiceDetail", {
                invoiceId: sInvoiceId
            });
        },

        onCreateInvoice: function () {
            this.getOwnerComponent().getRouter().navTo("invoiceNew");
        },

        onInvoiceAction: function (oEvent) {
            sap.m.MessageToast.show("Invoice actions - Coming soon");
        },

        onNavBack: function () {
            window.history.go(-1);
        }
    });
});
