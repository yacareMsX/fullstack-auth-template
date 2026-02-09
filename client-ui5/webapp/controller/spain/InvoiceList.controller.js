sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "invoice/app/model/formatter"
], function (Controller, JSONModel, Filter, FilterOperator, formatter) {
    "use strict";

    return Controller.extend("invoice.app.controller.spain.InvoiceList", {
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
            oRouter.getRoute("invoices").attachPatternMatched(this._onRouteMatched, this);
            oRouter.getRoute("issueInvoices").attachPatternMatched(this._onRouteMatched, this);
            oRouter.getRoute("receiptInvoices").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            var oArgs = oEvent.getParameter("arguments");
            var sTipo = "ISSUE"; // Default

            if (sRouteName === "issueInvoices") {
                sTipo = "ISSUE";
            } else if (sRouteName === "receiptInvoices") {
                sTipo = "RECEIPT";
            } else if (oArgs && oArgs.tipo) {
                sTipo = oArgs.tipo;
            }

            var oModel = this.getView().getModel("invoiceList");
            oModel.setProperty("/tipo", sTipo);

            // Update page title based on tipo
            var sTitle = sTipo === "ISSUE" ? "Facturas Emitidas" : "Facturas Recibidas";
            oModel.setProperty("/pageTitle", sTitle);

            this._loadInvoices();
        },

        _loadInvoices: function (sStatus) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");
            var oModel = this.getView().getModel("invoiceList");
            var sTipo = oModel.getProperty("/tipo");

            var sUrl = "/api/invoices/facturas?tipo=" + sTipo;

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
                    // Convert date strings to Date objects
                    var aInvoices = data.map(function (invoice) {
                        if (invoice.fecha_emision) {
                            invoice.fecha_emision = new Date(invoice.fecha_emision);
                        }
                        return invoice;
                    });
                    oModel.setProperty("/invoices", aInvoices);
                })
                .catch(function (error) {
                    console.error("Error loading invoices:", error);
                });
        },



        onSearch: function (oEvent) {
            var aFilters = [];
            var sQuery = this.byId("searchFilter").getValue();
            var sNumber = this.byId("numberFilter").getValue();
            var sIssuer = this.byId("issuerFilter").getValue();
            var sReceiver = this.byId("receiverFilter").getValue();
            var sStatus = this.byId("statusFilter").getSelectedKey();
            var oDateRange = this.byId("dateFilter");
            var dDateStart = oDateRange.getDateValue();
            var dDateEnd = oDateRange.getSecondDateValue();

            if (sQuery) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("numero", FilterOperator.Contains, sQuery),
                        new Filter("emisor_nombre", FilterOperator.Contains, sQuery),
                        new Filter("receptor_nombre", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }

            if (sNumber) {
                aFilters.push(new Filter("numero", FilterOperator.Contains, sNumber));
            }

            if (sIssuer) {
                aFilters.push(new Filter("emisor_nombre", FilterOperator.Contains, sIssuer));
            }

            if (sReceiver) {
                aFilters.push(new Filter("receptor_nombre", FilterOperator.Contains, sReceiver));
            }

            if (sStatus) {
                aFilters.push(new Filter("estado", FilterOperator.EQ, sStatus));
            }

            if (dDateStart && dDateEnd) {
                aFilters.push(new Filter("fecha_emision", FilterOperator.BT, dDateStart, dDateEnd));
            } else if (dDateStart) {
                aFilters.push(new Filter("fecha_emision", FilterOperator.GE, dDateStart));
            }

            var oTable = this.byId("invoicesTable");
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
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
