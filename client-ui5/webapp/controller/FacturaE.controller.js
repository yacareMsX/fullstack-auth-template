sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "invoice/app/service/AutoFirmaService" // Assuming this path for AutoFirmaService
], function (Controller, JSONModel, MessageToast, MessageBox, AutoFirmaService) {
    "use strict";

    return Controller.extend("invoice.app.controller.FacturaE", {

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("facturaE").attachPatternMatched(this._onObjectMatched, this);

            var oViewModel = new JSONModel({
                xml: "",
                isSigned: false
            });
            this.getView().setModel(oViewModel, "facturae");
        },

        _onObjectMatched: function (oEvent) {
            var sInvoiceId = oEvent.getParameter("arguments").invoiceId;
            this._loadInvoiceAndGenerateXML(sInvoiceId);
        },

        _loadInvoiceAndGenerateXML: function (sInvoiceId) {
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
                    var sXML = that._generateFacturaEXML(data);
                    that.getView().getModel("facturae").setProperty("/xml", sXML);
                    that.getView().getModel("facturae").setProperty("/invoice", data);
                })
                .catch(function (error) {
                    console.error("Error loading invoice:", error);
                    MessageToast.show("Error loading invoice data");
                });
        },

        _generateFacturaEXML: function (invoice) {
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
            sXML += '<fe:Facturae xmlns:fe="http://www.facturae.es/Facturae/2014/v3.2.1/Facturae" xmlns:ds="http://www.w3.org/2000/09/xmldsig#">\n';

            // File Header
            sXML += '  <FileHeader>\n';
            sXML += '    <SchemaVersion>3.2.1</SchemaVersion>\n';
            sXML += '    <Modality>I</Modality>\n';
            sXML += '    <InvoiceIssuerType>EM</InvoiceIssuerType>\n';
            sXML += '    <Batch>\n';
            sXML += '      <BatchIdentifier>' + invoice.numero + '</BatchIdentifier>\n';
            sXML += '      <InvoicesCount>1</InvoicesCount>\n';
            sXML += '      <TotalInvoicesAmount>\n';
            sXML += '        <TotalAmount>' + formatNumber(invoice.total) + '</TotalAmount>\n';
            sXML += '      </TotalInvoicesAmount>\n';
            sXML += '      <TotalOutstandingAmount>\n';
            sXML += '        <TotalAmount>' + formatNumber(invoice.total) + '</TotalAmount>\n';
            sXML += '      </TotalOutstandingAmount>\n';
            sXML += '      <TotalExecutableAmount>\n';
            sXML += '        <TotalAmount>' + formatNumber(invoice.total) + '</TotalAmount>\n';
            sXML += '      </TotalExecutableAmount>\n';
            sXML += '      <InvoiceCurrencyCode>EUR</InvoiceCurrencyCode>\n';
            sXML += '    </Batch>\n';
            sXML += '  </FileHeader>\n';

            // Parties
            sXML += '  <Parties>\n';
            // Seller (Emisor)
            sXML += '    <SellerParty>\n';
            sXML += '      <TaxIdentification>\n';
            sXML += '        <PersonTypeCode>J</PersonTypeCode>\n';
            sXML += '        <ResidenceTypeCode>R</ResidenceTypeCode>\n';
            sXML += '        <TaxIdentificationNumber>' + (invoice.emisor_nif || "UNKNOWN") + '</TaxIdentificationNumber>\n';
            sXML += '      </TaxIdentification>\n';
            sXML += '      <LegalEntity>\n';
            sXML += '        <CorporateName>' + (invoice.emisor_nombre || "Unknown Issuer") + '</CorporateName>\n';
            sXML += '        <AddressInSpain>\n';
            sXML += '          <Address>' + (invoice.emisor_direccion || "") + '</Address>\n';
            sXML += '          <PostCode>00000</PostCode>\n'; // Placeholder
            sXML += '          <Town>Madrid</Town>\n'; // Placeholder
            sXML += '          <Province>Madrid</Province>\n'; // Placeholder
            sXML += '          <CountryCode>ESP</CountryCode>\n';
            sXML += '        </AddressInSpain>\n';
            sXML += '      </LegalEntity>\n';
            sXML += '    </SellerParty>\n';

            // Buyer (Receptor)
            sXML += '    <BuyerParty>\n';
            sXML += '      <TaxIdentification>\n';
            sXML += '        <PersonTypeCode>J</PersonTypeCode>\n';
            sXML += '        <ResidenceTypeCode>R</ResidenceTypeCode>\n';
            sXML += '        <TaxIdentificationNumber>' + (invoice.receptor_nif || "UNKNOWN") + '</TaxIdentificationNumber>\n';
            sXML += '      </TaxIdentification>\n';
            sXML += '      <LegalEntity>\n';
            sXML += '        <CorporateName>' + (invoice.receptor_nombre || "Unknown Receiver") + '</CorporateName>\n';
            sXML += '        <AddressInSpain>\n';
            sXML += '          <Address>' + (invoice.receptor_direccion || "") + '</Address>\n';
            sXML += '          <PostCode>00000</PostCode>\n'; // Placeholder
            sXML += '          <Town>Madrid</Town>\n'; // Placeholder
            sXML += '          <Province>Madrid</Province>\n'; // Placeholder
            sXML += '          <CountryCode>ESP</CountryCode>\n';
            sXML += '        </AddressInSpain>\n';
            sXML += '      </LegalEntity>\n';
            sXML += '    </BuyerParty>\n';
            sXML += '  </Parties>\n';

            // Invoices
            sXML += '  <Invoices>\n';
            sXML += '    <Invoice>\n';
            sXML += '      <InvoiceHeader>\n';
            sXML += '        <InvoiceNumber>' + invoice.numero + '</InvoiceNumber>\n';
            sXML += '        <InvoiceSeriesCode>A</InvoiceSeriesCode>\n'; // Placeholder
            sXML += '        <InvoiceDocumentType>FC</InvoiceDocumentType>\n';
            sXML += '        <InvoiceClass>OO</InvoiceClass>\n';
            sXML += '      </InvoiceHeader>\n';
            sXML += '      <InvoiceIssueData>\n';
            sXML += '        <IssueDate>' + formatDate(invoice.fecha_emision) + '</IssueDate>\n';
            sXML += '        <InvoiceCurrencyCode>EUR</InvoiceCurrencyCode>\n';
            sXML += '        <TaxCurrencyCode>EUR</TaxCurrencyCode>\n';
            sXML += '        <LanguageName>es</LanguageName>\n';
            sXML += '      </InvoiceIssueData>\n';

            // Taxes
            sXML += '      <TaxesOutputs>\n';
            sXML += '        <Tax>\n';
            sXML += '          <TaxTypeCode>01</TaxTypeCode>\n'; // IVA
            sXML += '          <TaxRate>21.00</TaxRate>\n'; // Assuming 21% for simplicity or calculate from lines
            sXML += '          <TaxableBase>\n';
            sXML += '            <TotalAmount>' + formatNumber(invoice.subtotal) + '</TotalAmount>\n';
            sXML += '          </TaxableBase>\n';
            sXML += '          <TaxAmount>\n';
            sXML += '            <TotalAmount>' + formatNumber(invoice.impuestos_totales) + '</TotalAmount>\n';
            sXML += '          </TaxAmount>\n';
            sXML += '        </Tax>\n';
            sXML += '      </TaxesOutputs>\n';

            // Invoice Totals
            sXML += '      <InvoiceTotals>\n';
            sXML += '        <TotalGrossAmount>' + formatNumber(invoice.subtotal) + '</TotalGrossAmount>\n';
            sXML += '        <TotalGeneralDiscounts>0.00</TotalGeneralDiscounts>\n';
            sXML += '        <TotalGeneralSurcharges>0.00</TotalGeneralSurcharges>\n';
            sXML += '        <TotalGrossAmountBeforeTaxes>' + formatNumber(invoice.subtotal) + '</TotalGrossAmountBeforeTaxes>\n';
            sXML += '        <TotalTaxOutputs>' + formatNumber(invoice.impuestos_totales) + '</TotalTaxOutputs>\n';
            sXML += '        <TotalTaxesWithheld>0.00</TotalTaxesWithheld>\n';
            sXML += '        <InvoiceTotal>' + formatNumber(invoice.total) + '</InvoiceTotal>\n';
            sXML += '        <TotalOutstandingAmount>' + formatNumber(invoice.total) + '</TotalOutstandingAmount>\n';
            sXML += '        <TotalExecutableAmount>' + formatNumber(invoice.total) + '</TotalExecutableAmount>\n';
            sXML += '      </InvoiceTotals>\n';

            // Items
            sXML += '      <Items>\n';
            if (invoice.lineas) {
                invoice.lineas.forEach(function (line) {
                    sXML += '        <InvoiceLine>\n';
                    sXML += '          <ItemDescription>' + line.descripcion + '</ItemDescription>\n';
                    sXML += '          <Quantity>' + formatNumber(line.cantidad) + '</Quantity>\n';
                    sXML += '          <UnitOfMeasure>01</UnitOfMeasure>\n';
                    sXML += '          <UnitPriceWithoutTax>' + formatNumber(line.precio_unitario) + '</UnitPriceWithoutTax>\n';
                    sXML += '          <TotalCost>' + formatNumber(line.total_linea) + '</TotalCost>\n';
                    sXML += '          <GrossAmount>' + formatNumber(line.total_linea) + '</GrossAmount>\n';
                    sXML += '          <TaxesOutputs>\n';
                    sXML += '            <Tax>\n';
                    sXML += '              <TaxTypeCode>01</TaxTypeCode>\n';
                    sXML += '              <TaxRate>' + formatNumber(line.porcentaje_impuesto) + '</TaxRate>\n';
                    sXML += '              <TaxableBase>\n';
                    sXML += '                <TotalAmount>' + formatNumber(line.total_linea) + '</TotalAmount>\n'; // Simplified
                    sXML += '              </TaxableBase>\n';
                    sXML += '              <TaxAmount>\n';
                    sXML += '                <TotalAmount>' + formatNumber(line.total_linea * (line.porcentaje_impuesto / 100)) + '</TotalAmount>\n';
                    sXML += '              </TaxAmount>\n';
                    sXML += '            </Tax>\n';
                    sXML += '          </TaxesOutputs>\n';
                    sXML += '        </InvoiceLine>\n';
                });
            }
            sXML += '      </Items>\n';

            sXML += '    </Invoice>\n';
            sXML += '  </Invoices>\n';
            sXML += '</fe:Facturae>';

            return sXML;
        },

        onSignXML: function () {
            var sXML = this.getView().getModel("facturae").getProperty("/xml");

            try {
                var sUrl = AutoFirmaService.getSignUrl(sXML);

                // Inform user
                MessageBox.information(
                    "Se va a abrir AutoFirma. Por favor, siga las instrucciones en la aplicación.\n\n" +
                    "El fichero firmado se guardará en su ordenador.",
                    {
                        title: "Lanzando AutoFirma",
                        actions: [MessageBox.Action.OK],
                        onClose: function () {
                            // Launch AutoFirma
                            window.location.href = sUrl;
                        }
                    }
                );
            } catch (e) {
                console.error("Error launching AutoFirma", e);
                MessageBox.error("Error al preparar la firma: " + e.message);
            }
        },

        onSendAEAT: function () {
            MessageToast.show("Funcionalidad no disponible en esta versión (Requiere certificado real)");
        },

        onDownloadFile: function () {
            var sXML = this.getView().getModel("facturae").getProperty("/xml");
            var oInvoice = this.getView().getModel("facturae").getProperty("/invoice");
            var sFileName = "facturae_" + (oInvoice ? oInvoice.numero : "generated") + ".xml";

            var blob = new Blob([sXML], { type: "application/xml" });
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = sFileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            MessageToast.show("Fichero descargado: " + sFileName);
        },

        onCopyClipboard: function () {
            var sXML = this.getView().getModel("facturae").getProperty("/xml");
            navigator.clipboard.writeText(sXML).then(function () {
                MessageToast.show("XML copiado al portapapeles");
            }, function (err) {
                console.error("Could not copy text: ", err);
                MessageToast.show("Error al copiar al portapapeles");
            });
        },

        onValidateXML: function () {
            var sXML = this.getView().getModel("facturae").getProperty("/xml");
            // Basic validation: check for key tags and non-empty values
            var bValid = true;
            var aErrors = [];

            if (!sXML.includes("<fe:Facturae")) aErrors.push("Falta etiqueta raíz Facturae");
            if (!sXML.includes("<BatchIdentifier>")) aErrors.push("Falta identificador de lote");
            if (!sXML.includes("<TotalAmount>")) aErrors.push("Faltan importes totales");

            if (aErrors.length === 0) {
                MessageBox.success("El XML tiene una estructura válida (FacturaE 3.2.1)");
            } else {
                MessageBox.error("Errores de validación:\n" + aErrors.join("\n"));
            }
        },

        onSendEmail: function () {
            var oInvoice = this.getView().getModel("facturae").getProperty("/invoice");
            var sSubject = "FacturaE: " + (oInvoice ? oInvoice.numero : "Nueva Factura");
            var sBody = "Adjunto encontrará el XML de la factura.\n\nSaludos.";

            // Mailto link (cannot attach file directly via mailto, but can open client)
            var sMailto = "mailto:?subject=" + encodeURIComponent(sSubject) + "&body=" + encodeURIComponent(sBody);
            window.location.href = sMailto;

            MessageToast.show("Abriendo cliente de correo...");
        },

        onNavBack: function () {
            window.history.go(-1);
        }
    });
});
