sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "invoice/app/model/formatter"
], function (Controller, JSONModel, MessageToast, formatter) {
    "use strict";

    return Controller.extend("invoice.app.controller.InvoiceDetail", {
        formatter: formatter,

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("invoiceDetail").attachPatternMatched(this._onObjectMatched, this);

            var oViewModel = new JSONModel({});
            this.getView().setModel(oViewModel, "detail");
        },

        _onObjectMatched: function (oEvent) {
            var sInvoiceId = oEvent.getParameter("arguments").invoiceId;
            this._loadInvoiceDetail(sInvoiceId);
        },

        _loadInvoiceDetail: function (sInvoiceId) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("http://localhost:3000/api/invoices/facturas/" + sInvoiceId, {
                headers: {
                    "Authorization": "Bearer " + sToken
                }
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    var oModel = that.getView().getModel("detail");
                    oModel.setData(data);
                })
                .catch(function (error) {
                    console.error("Error loading invoice detail:", error);
                    MessageToast.show("Error loading invoice");
                });
        },

        onChangeStatus: function (oEvent) {
            var sNewStatus = oEvent.getSource().getText();
            var oModel = this.getView().getModel("detail");
            var sInvoiceId = oModel.getProperty("/id_factura");
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("http://localhost:3000/api/invoices/facturas/" + sInvoiceId + "/estado", {
                method: "PATCH",
                headers: {
                    "Authorization": "Bearer " + sToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ estado: sNewStatus })
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    oModel.setProperty("/estado", data.estado);
                    MessageToast.show("Status changed to " + sNewStatus);
                })
                .catch(function (error) {
                    console.error("Error changing status:", error);
                    MessageToast.show("Error changing status");
                });
        },

        onDownloadPDF: function () {
            var oModel = this.getView().getModel("detail");
            var sInvoiceId = oModel.getProperty("/id_factura");
            var sToken = localStorage.getItem("auth_token");

            // Open PDF in new window
            var sUrl = "http://localhost:3000/api/invoices/facturas/" + sInvoiceId + "/pdf";

            // Create a temporary link to download the PDF
            fetch(sUrl, {
                headers: {
                    "Authorization": "Bearer " + sToken
                }
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Failed to generate PDF");
                    }
                    return response.blob();
                })
                .then(function (blob) {
                    // Create download link
                    var url = window.URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = "invoice_" + oModel.getProperty("/numero") + ".pdf";
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    MessageToast.show("PDF downloaded successfully");
                })
                .catch(function (error) {
                    console.error("Error downloading PDF:", error);
                    MessageToast.show("Error downloading PDF");
                });
        },

        onDownloadXML: function () {
            var oModel = this.getView().getModel("detail");
            var sInvoiceId = oModel.getProperty("/id_factura");
            this.getOwnerComponent().getRouter().navTo("facturaE", {
                invoiceId: sInvoiceId
            });
        },

        onEdit: function () {
            var oModel = this.getView().getModel("detail");
            var sInvoiceId = oModel.getProperty("/id_factura");
            this.getOwnerComponent().getRouter().navTo("invoiceEdit", {
                invoiceId: sInvoiceId
            });
        },

        onNavBack: function () {
            window.history.go(-1);
        }
    });
});
