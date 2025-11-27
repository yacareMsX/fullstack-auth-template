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

            var oViewModel = new JSONModel({
                pdfPanelSize: "0%",
                pdfSource: ""
            });
            this.getView().setModel(oViewModel, "detail");
        },

        _onObjectMatched: function (oEvent) {
            var sInvoiceId = oEvent.getParameter("arguments").invoiceId;
            this._loadInvoiceDetail(sInvoiceId);
            // Reset PDF view
            var oModel = this.getView().getModel("detail");
            oModel.setProperty("/pdfPanelSize", "0%");
            oModel.setProperty("/pdfSource", "");
        },

        _loadInvoiceDetail: function (sInvoiceId) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("/api/invoices/facturas/" + sInvoiceId, {
                headers: {
                    "Authorization": "Bearer " + sToken
                }
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    // Convert date strings to Date objects for proper formatting
                    if (data.fecha_emision) {
                        data.fecha_emision = new Date(data.fecha_emision);
                    }
                    if (data.fecha_vencimiento) {
                        data.fecha_vencimiento = new Date(data.fecha_vencimiento);
                    }

                    var oModel = that.getView().getModel("detail");
                    // Merge data to preserve view properties like pdfPanelSize
                    var oCurrentData = oModel.getData();
                    var oNewData = Object.assign({}, oCurrentData, data);
                    oModel.setData(oNewData);
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

            fetch("/api/invoices/facturas/" + sInvoiceId + "/estado", {
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

        onViewPDF: function () {
            var oModel = this.getView().getModel("detail");
            var sCurrentSize = oModel.getProperty("/pdfPanelSize");

            // Toggle visibility
            if (sCurrentSize !== "0%") {
                oModel.setProperty("/pdfPanelSize", "0%");
                return;
            }

            var sInvoiceId = oModel.getProperty("/id_factura");
            var sToken = localStorage.getItem("auth_token");
            var sUrl = "/api/invoices/facturas/" + sInvoiceId + "/pdf";

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
                    var url = window.URL.createObjectURL(blob);
                    // Append parameters to hide navigation pane and toolbar
                    url += "#navpanes=0&scrollbar=0";
                    console.log("PDF Blob URL:", url);
                    oModel.setProperty("/pdfSource", url);
                    oModel.setProperty("/pdfPanelSize", "50%");
                    console.log("PDF Panel Size set to 50%");
                })
                .catch(function (error) {
                    console.error("Error downloading PDF:", error);
                    MessageToast.show("Error loading PDF");
                });
        },

        onGenerateFacturaE: function () {
            var oModel = this.getView().getModel("detail");
            var sInvoiceId = oModel.getProperty("/id_factura");
            this.getOwnerComponent().getRouter().navTo("facturaE", {
                invoiceId: sInvoiceId
            });
        },

        onGenerateUBL: function () {
            var oModel = this.getView().getModel("detail");
            var sInvoiceId = oModel.getProperty("/id_factura");
            this.getOwnerComponent().getRouter().navTo("ubl21", {
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
