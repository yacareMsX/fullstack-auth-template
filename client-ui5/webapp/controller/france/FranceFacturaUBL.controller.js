sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/util/File"
], function (Controller, JSONModel, MessageToast, MessageBox, File) {
    "use strict";

    return Controller.extend("invoice.app.controller.france.FranceFacturaUBL", {

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("franceUbl21").attachPatternMatched(this._onObjectMatched, this);

            var oViewModel = new JSONModel({
                xml: ""
            });
            this.getView().setModel(oViewModel, "ubl");
        },

        _onObjectMatched: function (oEvent) {
            var sInvoiceId = oEvent.getParameter("arguments").invoiceId;
            this._loadInvoiceAndGenerateXML(sInvoiceId);
        },

        _loadInvoiceAndGenerateXML: function (sInvoiceId) {
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
                    var sXML = that._generateUBLXML(data);
                    that.getView().getModel("ubl").setProperty("/xml", sXML);
                    that.getView().getModel("ubl").setProperty("/invoice", data);
                })
                .catch(function (error) {
                    console.error("Error loading invoice:", error);
                    MessageToast.show("Error loading invoice data");
                });
        },

        _generateUBLXML: function (invoice) {
            // Helper to format date YYYY-MM-DD
            var formatDate = function (dateStr) {
                if (!dateStr) return "";
                return dateStr.split("T")[0];
            };

            // Helper to format number with 2 decimals
            var formatNumber = function (num) {
                return parseFloat(num).toFixed(2);
            };

            var sXML = '<?xml version="1.0" encoding="UTF-8"?>\n';
            sXML += '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" \n';
            sXML += 'xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" \n';
            sXML += 'xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">\n';

            sXML += '  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>\n';
            sXML += '  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>\n';
            sXML += '  <cbc:ID>' + invoice.numero + '</cbc:ID>\n';
            sXML += '  <cbc:IssueDate>' + formatDate(invoice.fecha_emision) + '</cbc:IssueDate>\n';
            sXML += '  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>\n';
            sXML += '  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>\n';

            // Supplier
            sXML += '  <cac:AccountingSupplierParty>\n';
            sXML += '    <cac:Party>\n';
            sXML += '      <cac:PartyName>\n';
            sXML += '        <cbc:Name>' + (invoice.emisor_nombre || "Unknown") + '</cbc:Name>\n';
            sXML += '      </cac:PartyName>\n';
            sXML += '      <cac:PartyTaxScheme>\n';
            sXML += '        <cbc:CompanyID>' + (invoice.emisor_nif || "UNKNOWN") + '</cbc:CompanyID>\n';
            sXML += '        <cac:TaxScheme>\n';
            sXML += '          <cbc:ID>VAT</cbc:ID>\n';
            sXML += '        </cac:TaxScheme>\n';
            sXML += '      </cac:PartyTaxScheme>\n';
            sXML += '    </cac:Party>\n';
            sXML += '  </cac:AccountingSupplierParty>\n';

            // Customer
            sXML += '  <cac:AccountingCustomerParty>\n';
            sXML += '    <cac:Party>\n';
            sXML += '      <cac:PartyName>\n';
            sXML += '        <cbc:Name>' + (invoice.receptor_nombre || "Unknown") + '</cbc:Name>\n';
            sXML += '      </cac:PartyName>\n';
            sXML += '      <cac:PartyTaxScheme>\n';
            sXML += '        <cbc:CompanyID>' + (invoice.receptor_nif || "UNKNOWN") + '</cbc:CompanyID>\n';
            sXML += '        <cac:TaxScheme>\n';
            sXML += '          <cbc:ID>VAT</cbc:ID>\n';
            sXML += '        </cac:TaxScheme>\n';
            sXML += '      </cac:PartyTaxScheme>\n';
            sXML += '    </cac:Party>\n';
            sXML += '  </cac:AccountingCustomerParty>\n';

            // Tax Total
            sXML += '  <cac:TaxTotal>\n';
            sXML += '    <cbc:TaxAmount currencyID="EUR">' + formatNumber(invoice.impuestos_totales) + '</cbc:TaxAmount>\n';
            sXML += '    <cac:TaxSubtotal>\n';
            sXML += '      <cbc:TaxableAmount currencyID="EUR">' + formatNumber(invoice.subtotal) + '</cbc:TaxableAmount>\n';
            sXML += '      <cbc:TaxAmount currencyID="EUR">' + formatNumber(invoice.impuestos_totales) + '</cbc:TaxAmount>\n';
            sXML += '      <cac:TaxCategory>\n';
            sXML += '        <cbc:ID>S</cbc:ID>\n';
            sXML += '        <cbc:Percent>21.00</cbc:Percent>\n';
            sXML += '        <cac:TaxScheme>\n';
            sXML += '          <cbc:ID>VAT</cbc:ID>\n';
            sXML += '        </cac:TaxScheme>\n';
            sXML += '      </cac:TaxCategory>\n';
            sXML += '    </cac:TaxSubtotal>\n';
            sXML += '  </cac:TaxTotal>\n';

            // Legal Monetary Total
            sXML += '  <cac:LegalMonetaryTotal>\n';
            sXML += '    <cbc:LineExtensionAmount currencyID="EUR">' + formatNumber(invoice.subtotal) + '</cbc:LineExtensionAmount>\n';
            sXML += '    <cbc:TaxExclusiveAmount currencyID="EUR">' + formatNumber(invoice.subtotal) + '</cbc:TaxExclusiveAmount>\n';
            sXML += '    <cbc:TaxInclusiveAmount currencyID="EUR">' + formatNumber(invoice.total) + '</cbc:TaxInclusiveAmount>\n';
            sXML += '    <cbc:PayableAmount currencyID="EUR">' + formatNumber(invoice.total) + '</cbc:PayableAmount>\n';
            sXML += '  </cac:LegalMonetaryTotal>\n';

            // Invoice Lines
            if (invoice.lineas) {
                invoice.lineas.forEach(function (line, index) {
                    sXML += '  <cac:InvoiceLine>\n';
                    sXML += '    <cbc:ID>' + (index + 1) + '</cbc:ID>\n';
                    sXML += '    <cbc:InvoicedQuantity unitCode="EA">' + formatNumber(line.cantidad) + '</cbc:InvoicedQuantity>\n';
                    sXML += '    <cbc:LineExtensionAmount currencyID="EUR">' + formatNumber(line.total_linea) + '</cbc:LineExtensionAmount>\n';
                    sXML += '    <cac:Item>\n';
                    sXML += '      <cbc:Name>' + line.descripcion + '</cbc:Name>\n';
                    sXML += '      <cac:ClassifiedTaxCategory>\n';
                    sXML += '        <cbc:ID>S</cbc:ID>\n';
                    sXML += '        <cbc:Percent>' + formatNumber(line.porcentaje_impuesto) + '</cbc:Percent>\n';
                    sXML += '        <cac:TaxScheme>\n';
                    sXML += '          <cbc:ID>VAT</cbc:ID>\n';
                    sXML += '        </cac:TaxScheme>\n';
                    sXML += '      </cac:ClassifiedTaxCategory>\n';
                    sXML += '    </cac:Item>\n';
                    sXML += '    <cac:Price>\n';
                    sXML += '      <cbc:PriceAmount currencyID="EUR">' + formatNumber(line.precio_unitario) + '</cbc:PriceAmount>\n';
                    sXML += '    </cac:Price>\n';
                    sXML += '  </cac:InvoiceLine>\n';
                });
            }

            sXML += '</Invoice>';

            return sXML;
        },

        onDownloadFile: function () {
            var oModel = this.getView().getModel("ubl");
            var sXML = oModel.getProperty("/xml");
            var oInvoice = oModel.getProperty("/invoice");
            if (!sXML) {
                MessageToast.show("XML not generated yet");
                return;
            }

            // Sanitize filename
            var sNum = oInvoice ? oInvoice.numero : "generated";
            sNum = sNum.replace(/[/\\?%*:|"<>]/g, '-');
            var sFileName = "ubl_" + sNum;

            File.save(sXML, sFileName, "xml", "application/xml");
            MessageToast.show("Descarga iniciada: " + sFileName + ".xml");
        },

        onCopyClipboard: function () {
            var sXML = this.getView().getModel("ubl").getProperty("/xml");
            navigator.clipboard.writeText(sXML).then(function () {
                MessageToast.show("XML copiado al portapapeles");
            }, function (err) {
                console.error("Could not copy text: ", err);
                MessageToast.show("Error al copiar al portapapeles");
            });
        },

        onValidateXML: function () {
            var sXML = this.getView().getModel("ubl").getProperty("/xml");
            var bValid = true;
            var aErrors = [];

            if (!sXML.includes("<Invoice")) aErrors.push("Falta etiqueta raíz Invoice");
            if (!sXML.includes("<cbc:UBLVersionID>2.1")) aErrors.push("Versión UBL incorrecta");

            if (aErrors.length === 0) {
                MessageBox.success("El XML tiene una estructura válida (UBL 2.1)");
            } else {
                MessageBox.error("Errores de validación:\n" + aErrors.join("\n"));
            }
        },

        onSendEmail: function () {
            var oInvoice = this.getView().getModel("ubl").getProperty("/invoice");
            var sSubject = "UBL Invoice: " + (oInvoice ? oInvoice.numero : "New Invoice");
            var sBody = "Attached is the UBL 2.1 XML invoice.\n\nRegards.";

            var sMailto = "mailto:?subject=" + encodeURIComponent(sSubject) + "&body=" + encodeURIComponent(sBody);
            window.location.href = sMailto;

            MessageToast.show("Opening email client...");
        },

        onGenerateFacturX: function () {
            var that = this;
            var oInvoice = this.getView().getModel("ubl").getProperty("/invoice");
            if (!oInvoice || !oInvoice.id_factura) {
                MessageToast.show("Invoice data not loaded");
                return;
            }

            var sToken = localStorage.getItem("auth_token");
            var sUrl = "/api/invoices/facturas/" + oInvoice.id_factura + "/factur-x";

            fetch(sUrl, {
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(function (response) {
                    if (!response.ok) throw new Error("Server error");
                    return response.blob();
                })
                .then(function (blob) {
                    var oInvoice = that.getView().getModel("ubl").getProperty("/invoice");
                    var sNum = oInvoice ? oInvoice.numero : "generated";
                    sNum = sNum.replace(/[/\\?%*:|"<>]/g, '-');
                    var sFileName = "factur-x_" + sNum;

                    // Use native anchor for reliable filename in Chrome
                    // Chrome requires the link to be in the DOM for the download attribute to work reliably
                    var sFullName = sFileName + ".pdf";
                    var tempLink = document.createElement('a');
                    // tempLink.style.display = 'none'; // Sometimes hidden elements are ignored
                    tempLink.style.visibility = 'hidden'; // Safer than display: none
                    tempLink.style.position = 'absolute';
                    tempLink.href = window.URL.createObjectURL(blob);
                    tempLink.setAttribute('download', sFullName);

                    document.body.appendChild(tempLink);
                    tempLink.click();

                    // Cleanup - Increase timeout to allow browser to register the download
                    setTimeout(function () {
                        document.body.removeChild(tempLink);
                        window.URL.revokeObjectURL(tempLink.href);
                    }, 2000);

                    MessageToast.show("Factur-X descargado: " + sFullName);
                })
                .catch(function (error) {
                    console.error("Error generating Factur-X:", error);
                    var sErrorMsg = "Error al generar FACTUR-X";
                    if (error.message) {
                        sErrorMsg += ": " + error.message;
                    }
                    MessageToast.show(sErrorMsg);
                });
        },

        onNavBack: function () {
            window.history.go(-1);
        }
    });
});
