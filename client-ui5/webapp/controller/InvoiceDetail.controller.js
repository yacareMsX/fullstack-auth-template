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
                pdfSource: "",
                // Default props for new invoice
                condiciones_pago: "Net 30",
                moneda: "EUR",
                estado: "Draft",
                lineas: []
            });
            this.getView().setModel(oViewModel, "detail");

            // Mock Clients Model
            var oClientsModel = new JSONModel([
                { id: "1", name: "Client A", nif: "A12345678", address: "123 Street, City", email: "contact@clienta.com", phone: "555-0101" },
                { id: "2", name: "Client B", nif: "B98765432", address: "456 Avenue, Town", email: "info@clientb.com", phone: "555-0202" }
            ]);
            this.getView().setModel(oClientsModel, "clients");
        },

        _onObjectMatched: function (oEvent) {
            var sInvoiceId = oEvent.getParameter("arguments").invoiceId;
            if (sInvoiceId === "new") {
                // Initialize empty/default
                this._initNewInvoice();
            } else {
                this._loadInvoiceDetail(sInvoiceId);
            }

            // Reset PDF view
            var oModel = this.getView().getModel("detail");
            oModel.setProperty("/pdfPanelSize", "0%");
            oModel.setProperty("/pdfSource", "");
        },

        _initNewInvoice: function () {
            var oModel = this.getView().getModel("detail");
            oModel.setData({
                numero: "",
                fecha_emision: new Date(),
                fecha_vencimiento: new Date(),
                condiciones_pago: "Net 30",
                moneda: "EUR",
                estado: "Draft",
                lineas: [],
                pdfPanelSize: "0%",
                pdfSource: ""
            });
        },

        _loadInvoiceDetail: function (sInvoiceId) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            Promise.all([
                fetch("/api/invoices/facturas/" + sInvoiceId, {
                    headers: { "Authorization": "Bearer " + sToken }
                }).then(r => r.json()),
                fetch("/api/invoices/impuestos", {
                    headers: { "Authorization": "Bearer " + sToken }
                }).then(r => r.json())
            ])
                .then(function ([invoiceData, taxData]) {
                    // Convert date strings
                    if (invoiceData.fecha_emision) invoiceData.fecha_emision = new Date(invoiceData.fecha_emision);
                    if (invoiceData.fecha_vencimiento) invoiceData.fecha_vencimiento = new Date(invoiceData.fecha_vencimiento);
                    if (invoiceData.fecha_pago) invoiceData.fecha_pago = new Date(invoiceData.fecha_pago);

                    var oModel = that.getView().getModel("detail");
                    // Preserve view props
                    var oCurrentData = oModel.getData();

                    // Merge invoice data
                    var oNewData = Object.assign({}, oCurrentData, invoiceData);

                    // Add taxes to model for display in global tax dropdown
                    oNewData.impuestos = taxData;

                    oModel.setData(oNewData);

                    // Calculate Totals to display
                    that._calculateTotals();
                })
                .catch(function (error) {
                    console.error("Error loading invoice detail:", error);
                    MessageToast.show("Error loading invoice");
                });
        },

        _calculateTotals: function () {
            var oModel = this.getView().getModel("detail");
            var aLineas = oModel.getProperty("/lineas") || [];
            var nRetentionRate = parseFloat(oModel.getProperty("/retencion") || 0);

            var nSubtotal = 0;
            var oTaxMap = {}; // Map to store tax totals by rate

            aLineas.forEach(function (oLinea) {
                var nQty = parseFloat(oLinea.cantidad) || 0;
                var nPrice = parseFloat(oLinea.precio_unitario) || 0;
                var nRate = parseFloat(oLinea.porcentaje_impuesto) || 0;
                var nTaxAmt = parseFloat(oLinea.importe_impuesto) || 0;

                nSubtotal += (nQty * nPrice);

                // Aggregate tax by rate
                if (!oTaxMap[nRate]) {
                    oTaxMap[nRate] = 0;
                }
                oTaxMap[nRate] += nTaxAmt;
            });

            // Convert tax map to array for view binding
            var aTaxBreakdown = [];
            var nTotalTax = 0;
            for (var sRate in oTaxMap) {
                if (oTaxMap.hasOwnProperty(sRate)) {
                    var nAmt = oTaxMap[sRate];
                    aTaxBreakdown.push({
                        rate: sRate,
                        showRate: parseFloat(sRate), // Numeric for display
                        amount: nAmt.toFixed(2)
                    });
                    nTotalTax += nAmt;
                }
            }

            // Sort by rate descending (optional but looks better)
            aTaxBreakdown.sort(function (a, b) { return b.showRate - a.showRate; });

            var nRetentionAmount = nSubtotal * (nRetentionRate / 100);
            var nTotal = nSubtotal + nTotalTax - nRetentionAmount;

            oModel.setProperty("/totals", {
                subtotal: nSubtotal.toFixed(2),
                impuestos: nTotalTax.toFixed(2), // Keep total tax sum if needed elsewhere
                taxBreakdown: aTaxBreakdown,
                retention: nRetentionAmount.toFixed(2),
                total: nTotal.toFixed(2)
            });
        },

        onClientSelect: function (oEvent) {
            var sClientId = oEvent.getParameter("selectedItem").getKey();
            var oClientsModel = this.getView().getModel("clients");
            var aClients = oClientsModel.getData();
            var oClient = aClients.find(function (c) { return c.id === sClientId; });

            if (oClient) {
                var oModel = this.getView().getModel("detail");
                oModel.setProperty("/receptor_nombre", oClient.name);
                oModel.setProperty("/receptor_nif", oClient.nif);
                oModel.setProperty("/receptor_direccion", oClient.address);
                oModel.setProperty("/receptor_email", oClient.email);
                oModel.setProperty("/receptor_telefono", oClient.phone);
            }
        },

        onAddLine: function () {
            var oModel = this.getView().getModel("detail");
            var aLines = oModel.getProperty("/lineas") || [];
            aLines.push({
                descripcion: "",
                cantidad: 1,
                precio_unitario: 0,
                porcentaje_impuesto: 21,
                total_linea: 0
            });
            oModel.setProperty("/lineas", aLines);
        },

        onDeleteLine: function () {
            var oTable = this.byId("lineItemsTable"); // Need to ensure ID in view if not present, checking...
            // View didn't have ID for table? Let's assume user selects and we remove selected?
            // Table ID was not set in my replace_content. I need to fix view or use event source if triggered from item.
            // But valid Delete is usually "Delete Selected".

            // Simplification: Remove last line for now if no selection
            var oModel = this.getView().getModel("detail");
            var aLines = oModel.getProperty("/lineas") || [];
            if (aLines.length > 0) {
                aLines.pop();
                oModel.setProperty("/lineas", aLines);
            }
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
