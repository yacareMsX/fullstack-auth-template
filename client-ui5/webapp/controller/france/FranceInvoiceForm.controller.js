sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Dialog",
    "sap/m/TextArea",
    "sap/m/Button",
    "invoice/app/model/formatter"
], function (Controller, JSONModel, MessageToast, MessageBox, Fragment, Filter, FilterOperator, Dialog, TextArea, Button, formatter) {
    "use strict";

    return Controller.extend("invoice.app.controller.france.FranceInvoiceForm", {
        formatter: formatter,

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("franceIssueNew").attachPatternMatched(this._onRouteMatched, this);
            oRouter.getRoute("franceReceiptNew").attachPatternMatched(this._onRouteMatched, this);
            oRouter.getRoute("franceInvoiceEdit").attachPatternMatched(this._onEditInvoice, this);

            this._initializeModel();
        },

        _onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            var oArgs = oEvent.getParameter("arguments");

            // If it's the new invoice route
            if (sRouteName === "franceIssueNew" || sRouteName === "franceReceiptNew") {
                console.log("DEBUG: FranceInvoiceForm - Route matched:", sRouteName);

                this._onNewInvoice(oEvent).then(function () {
                    // Determine type based on route argument 'tipo'
                    if (oArgs.tipo === "RECEIPT" || sRouteName === "franceReceiptNew") {
                        this.getView().getModel("form").setProperty("/codigo_tipo", "02");
                    } else {
                        this.getView().getModel("form").setProperty("/codigo_tipo", "01");
                    }
                    this.getView().getModel("form").setProperty("/invoice_country_id", 3);

                    // Check for pending scan data in global model
                    var oScannedModel = this.getOwnerComponent().getModel("scannedData");
                    var bPendingProcess = oScannedModel && oScannedModel.getProperty("/pendingProcess");

                    console.log("DEBUG: pendingProcess flag:", bPendingProcess);

                    if (bPendingProcess) {
                        console.log("DEBUG: Processing scanned data...");

                        // Clear the flag to prevent re-processing on reload (optional, but good practice)
                        oScannedModel.setProperty("/pendingProcess", false);

                        var oScannedData = oScannedModel.getData();
                        console.log("DEBUG: scannedData content:", oScannedData);

                        var oModel = this.getView().getModel("form"); // Use 'form' model consistently
                        console.log("DEBUG: form model:", oModel);

                        if (oModel) {
                            var oData = oModel.getData();
                            // Merge scanned data
                            // We map fields carefully
                            oModel.setProperty("/codigo_tipo", "02"); // Force Receipt type for scanned invoices
                            oModel.setProperty("/id_origen", 3); // Set Origin to Scanner (3)
                            if (oScannedData.numero) oModel.setProperty("/numero", oScannedData.numero);
                            if (oScannedData.fecha_emision) oModel.setProperty("/fecha_emision", oScannedData.fecha_emision);

                            // --- SMART MAPPING START ---

                            // 1. Map Issuer (Emisor)
                            var aEmisores = oModel.getProperty("/emisores") || [];
                            var sEmisorNif = oScannedData.emisor_nif;
                            var sEmisorName = oScannedData.emisor_nombre;

                            console.log("DEBUG: Smart Mapping Emisor - Input:", { nif: sEmisorNif, name: sEmisorName });
                            console.log("DEBUG: Available Emisores:", aEmisores.length);

                            var oFoundEmisor = aEmisores.find(e =>
                                (sEmisorNif && e.nif && e.nif.toUpperCase() === sEmisorNif.toUpperCase()) ||
                                (sEmisorName && e.nombre && e.nombre.toUpperCase().includes(sEmisorName.toUpperCase()))
                            );
                            if (oFoundEmisor) {
                                oModel.setProperty("/id_emisor", oFoundEmisor.id_emisor);
                                console.log("DEBUG: Matched Emisor ID:", oFoundEmisor.id_emisor, "Name:", oFoundEmisor.nombre);
                            } else {
                                console.warn("DEBUG: Could not match Emisor. User must select manually.");
                            }

                            // 2. Map Receiver (Receptor)
                            var aReceptores = oModel.getProperty("/receptores") || [];
                            var sReceptorNif = oScannedData.receptor_nif;
                            var sReceptorName = oScannedData.receptor_nombre;

                            console.log("DEBUG: Smart Mapping Receptor - Input:", { nif: sReceptorNif, name: sReceptorName });
                            console.log("DEBUG: Available Receptores:", aReceptores.length);

                            var oFoundReceptor = aReceptores.find(r =>
                                (sReceptorNif && r.nif && r.nif.toUpperCase() === sReceptorNif.toUpperCase()) ||
                                (sReceptorName && r.nombre && r.nombre.toUpperCase().includes(sReceptorName.toUpperCase()))
                            );
                            if (oFoundReceptor) {
                                oModel.setProperty("/id_receptor", oFoundReceptor.id_receptor);
                                console.log("DEBUG: Matched Receptor ID:", oFoundReceptor.id_receptor, "Name:", oFoundReceptor.nombre);
                            } else {
                                console.warn("DEBUG: Could not match Receptor. User must select manually.");
                                // Fallback: If it's a Receipt (02) and we have receivers, default to the first one
                                // This assumes the user is scanning for their primary company
                                if (oModel.getProperty("/codigo_tipo") === "02" && aReceptores.length > 0) {
                                    oModel.setProperty("/id_receptor", aReceptores[0].id_receptor);
                                    console.log("DEBUG: Auto-selected default Receptor:", aReceptores[0].nombre);
                                    sap.m.MessageToast.show("Auto-selected receiver: " + aReceptores[0].nombre);
                                }
                            }

                            // 3. Map Lines and Taxes
                            if (oScannedData.lineas && Array.isArray(oScannedData.lineas)) {
                                var aImpuestos = oModel.getProperty("/impuestos") || [];
                                // Default to 21% (IVA General) if we can't guess, or try to infer
                                var oDefaultTax = aImpuestos.find(t => t.porcentaje === 21) || aImpuestos[0];

                                var aMappedLines = oScannedData.lineas.map(function (line) {
                                    // Try to find a matching tax if the scan provided a rate
                                    var fScanRate = parseFloat(line.porcentaje_impuesto);
                                    var oTax = null;
                                    if (!isNaN(fScanRate)) {
                                        oTax = aImpuestos.find(t => Math.abs(t.porcentaje - fScanRate) < 0.1);
                                    }
                                    if (!oTax) oTax = oDefaultTax;

                                    return {
                                        descripcion: line.descripcion || "Item",
                                        cantidad: parseFloat(line.cantidad) || 1,
                                        precio_unitario: parseFloat(line.precio_unitario) || 0,
                                        id_impuesto: oTax ? oTax.id_impuesto : "",
                                        porcentaje_impuesto: oTax ? oTax.porcentaje : 0,
                                        importe_impuesto: 0, // Will be calculated
                                        total_linea: 0 // Will be calculated
                                    };
                                });
                                oModel.setProperty("/lineas", aMappedLines);

                                // Trigger calculation for each line to update totals
                                this._calculateLineTotals();
                            }
                            // --- SMART MAPPING END ---

                            // Set file data for viewer
                            if (oScannedData.fileUrl) {
                                oModel.setProperty("/fileUrl", oScannedData.fileUrl);
                                oModel.setProperty("/mimeType", oScannedData.mimeType);
                                oModel.setProperty("/rawJson", oScannedData.rawJson);
                                oModel.setProperty("/pdfPanelSize", "40%");
                            }

                            this._calculateTotals();
                            sap.m.MessageToast.show("Datos cargados del escaneo");
                        }
                    }
                }.bind(this));
            }
        }
        ,



        onViewJson: function () {
            var oModel = this.getView().getModel("form");
            var oJson = oModel.getProperty("/rawJson");

            console.log("DEBUG: onViewJson called");

            if (!oJson) {
                MessageToast.show("No JSON data available");
                return;
            }

            var sJsonString = JSON.stringify(oJson, null, 2);

            // Create a dedicated model for the viewer
            var oViewerModel = new JSONModel({
                jsonContent: sJsonString
            });

            if (!this._pJsonDialog) {
                this._pJsonDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "invoice.app.view.JsonViewerDialog",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }

            this._pJsonDialog.then(function (oDialog) {
                oDialog.setModel(oViewerModel, "jsonViewer");
                oDialog.open();
            });
        },

        onCloseJsonViewer: function () {
            this._pJsonDialog.then(function (oDialog) {
                oDialog.close();
            });
        },

        onCancel: function () {
            if (this._bFromScan) {
                this.getOwnerComponent().getRouter().navTo("scanInvoice");
            } else {
                this.onNavBack();
            }
        },

        _initializeModel: function () {
            var oViewModel = new JSONModel({
                isEdit: false,
                numero: "",
                serie: "",
                fecha_emision: new Date(),
                fecha_vencimiento: new Date(),
                fecha_pago: new Date(),
                id_emisor: "",
                id_receptor: "",

                condiciones_pago: "Net 30",
                moneda: "EUR",
                estado: "BORRADOR",
                tipo_factura: "F1",

                // Fields for display binding
                emisor_nombre: "",
                emisor_direccion: "",
                receptor_nombre: "",
                receptor_direccion: "",

                // Tax Info
                id_impuesto_global: "",
                retencion: "0",

                lineas: [{
                    descripcion: "",
                    cantidad: 1,
                    precio_unitario: 0,
                    id_impuesto: "",
                    porcentaje_impuesto: 0,
                    importe_impuesto: 0,
                    total_linea: 0
                }],
                emisores: [],
                receptores: [],
                origenes: [],
                impuestos: [],
                totals: {
                    subtotal: 0,
                    impuestos: 0,
                    total: 0
                },
                pdfPanelSize: "0%",
                invoice_country_id: 3
            });
            this.getView().setModel(oViewModel, "form");

            return this._loadFormData();
        },

        onClientSelect: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) {
                // User might have cleared selection or typed something custom
                return;
            }
            var sClientId = oSelectedItem.getKey();

            // Since 'receptores' is already loaded in the model via _loadFormData
            // We just look it up.
            // Note: In _loadFormData we perform fetch("/api/invoices/receptores"), so 'receptores' is available.
            // The backend response for receptores is array of { id_receptor, nombre, nif, direccion... } 

            var oModel = this.getView().getModel("form");
            var aReceptores = oModel.getProperty("/receptores");

            // ID might be number or string, handle loose equality just in case
            var oClient = aReceptores.find(function (c) { return c.id_receptor == sClientId; });

            if (oClient) {
                oModel.setProperty("/receptor_nombre", oClient.nombre);
                oModel.setProperty("/receptor_direccion", oClient.direccion);
                oModel.setProperty("/receptor_nif", oClient.nif);
                // Emails/phones if available
            }
        },

        onGenerateNumber: function () {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("/api/invoices/facturas/next-number?invoice_country_id=3", {
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.nextNumber) {
                        that.getView().getModel("form").setProperty("/numero", data.nextNumber);
                    }
                })
                .catch(err => {
                    console.error("Error generating number", err);
                    sap.m.MessageToast.show("Error generating invoice number");
                });
        },

        onIssuerSelect: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) {
                return;
            }
            var sIssuerId = oSelectedItem.getKey();

            var oModel = this.getView().getModel("form");
            var aEmisores = oModel.getProperty("/emisores");

            var oIssuer = aEmisores.find(function (e) { return e.id_emisor == sIssuerId; });

            if (oIssuer) {
                oModel.setProperty("/emisor_nombre", oIssuer.nombre);
                oModel.setProperty("/emisor_direccion", oIssuer.direccion);
                oModel.setProperty("/emisor_nif", oIssuer.nif);
            }
        },

        _loadFormData: function () {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            return Promise.all([
                fetch("/api/invoices/emisores", {
                    headers: { "Authorization": "Bearer " + sToken }
                }).then(r => r.json()),
                fetch("/api/invoices/receptores", {
                    headers: { "Authorization": "Bearer " + sToken }
                }).then(r => r.json()),
                fetch("/api/invoices/impuestos?activo=true", {
                    headers: { "Authorization": "Bearer " + sToken }
                }).then(r => r.json()),
                fetch("/api/admin/origenes", {
                    headers: { "Authorization": "Bearer " + sToken }
                }).then(r => r.json())
            ]).then(function ([emisores, receptores, impuestos, origenes]) {
                console.log("Emisores loaded:", emisores);
                console.log("Receptores loaded:", receptores);
                var oModel = that.getView().getModel("form");
                oModel.setProperty("/emisores", emisores);
                oModel.setProperty("/receptores", receptores);
                oModel.setProperty("/impuestos", impuestos);
                oModel.setProperty("/origenes", origenes);

                // Set default VAT to 21% if found
                if (impuestos && impuestos.length > 0) {
                    // Fix: Use fuzzy comparison for percentage as it might be string from DB
                    var oDefaultVat = impuestos.find(function (t) {
                        return Math.abs(parseFloat(t.porcentaje) - 21.0) < 0.1;
                    });

                    if (oDefaultVat) {
                        oModel.setProperty("/id_impuesto_global", oDefaultVat.id_impuesto);
                    } else {
                        // Fallback to first if 21% not found
                        oModel.setProperty("/id_impuesto_global", impuestos[0].id_impuesto);
                    }

                    // Trigger calculation to update any existing lines with the default tax
                    // Use setTimeout to ensure model update is processed
                    setTimeout(function () {
                        that._calculateLineTotals();
                        that._calculateTotals();
                    }, 0);
                }
            }).catch(function (error) {
                console.error("Error loading form data:", error);
                MessageToast.show("Error loading form data");
            });
        },

        _onNewInvoice: function () {
            return this._initializeModel();
        },

        _onEditInvoice: function (oEvent) {
            var sInvoiceId = oEvent.getParameter("arguments").invoiceId;
            this._loadInvoiceForEdit(sInvoiceId);
        },

        _loadInvoiceForEdit: function (sInvoiceId) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("/api/invoices/facturas/" + sInvoiceId, {
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    var oModel = that.getView().getModel("form");
                    oModel.setProperty("/isEdit", true);
                    oModel.setProperty("/id_factura", data.id_factura);
                    oModel.setProperty("/numero", data.numero);
                    oModel.setProperty("/serie", data.serie || "");
                    oModel.setProperty("/fecha_emision", data.fecha_emision);
                    oModel.setProperty("/fecha_vencimiento", data.fecha_vencimiento || "");
                    oModel.setProperty("/id_emisor", data.id_emisor);
                    oModel.setProperty("/emisor_nombre", data.emisor_nombre);
                    oModel.setProperty("/emisor_direccion", data.emisor_direccion);

                    oModel.setProperty("/id_receptor", data.id_receptor);
                    oModel.setProperty("/receptor_nombre", data.receptor_nombre);
                    oModel.setProperty("/receptor_direccion", data.receptor_direccion);
                    oModel.setProperty("/metodo_pago", data.metodo_pago || "TRANSFERENCIA");
                    oModel.setProperty("/codigo_tipo", data.codigo_tipo || "01");
                    oModel.setProperty("/id_origen", data.id_origen || 3);
                    oModel.setProperty("/invoice_country_id", data.invoice_country_id || 3);
                    oModel.setProperty("/lineas", data.lineas || []);
                    that._calculateTotals();
                })
                .catch(function (error) {
                    console.error("Error loading invoice:", error);
                    MessageToast.show("Error loading invoice");
                });
        },

        onProductValueHelp: function (oEvent) {
            var oSource = oEvent.getSource();
            this._sCurrentLinePath = oSource.getBindingContext("form").getPath();

            this.onAddFromCatalog(); // Reuse the dialog opener
        },

        onAddFromCatalog: function () {
            var oView = this.getView();

            if (!this._pCatalogDialog) {
                this._pCatalogDialog = Fragment.load({
                    id: oView.getId(),
                    name: "invoice.app.view.CatalogSelectDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this._pCatalogDialog.then(function (oDialog) {
                // Load products if not loaded
                var oCatalogModel = oView.getModel("catalog");
                if (!oCatalogModel) {
                    oCatalogModel = new JSONModel();
                    oView.setModel(oCatalogModel, "catalog");

                    var sCurrentLang = sap.ui.getCore().getConfiguration().getLanguage().split("-")[0];
                    var sToken = localStorage.getItem("auth_token");
                    fetch("/api/catalog/products?lang=" + sCurrentLang, {
                        headers: { "Authorization": "Bearer " + sToken }
                    })
                        .then(res => res.json())
                        .then(data => oCatalogModel.setData({ products: data }))
                        .catch(err => console.error("Error loading products", err));
                }

                oDialog.open();
            });
        },

        onCatalogSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("sku", FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },

        onCatalogConfirm: function (oEvent) {
            var aSelectedItems = oEvent.getParameter("selectedItems");
            var oModel = this.getView().getModel("form");
            var aLineas = oModel.getProperty("/lineas");

            if (!aSelectedItems || aSelectedItems.length === 0) {
                return;
            }

            // Helper to create a line item object from product
            var fnCreateLine = function (oProduct) {
                var sDesc = oProduct.nombre || oProduct.sku;
                return {
                    descripcion: sDesc,
                    cantidad: 1,
                    precio_unitario: parseFloat(oProduct.precio_base),
                    id_impuesto: oProduct.id_impuesto,
                    porcentaje_impuesto: parseFloat(oProduct.impuesto_porcentaje) || 0,
                    importe_impuesto: 0,
                    total_linea: 0
                };
            };

            // If triggered from Value Help on a specific line
            if (this._sCurrentLinePath) {
                var oFirstItem = aSelectedItems[0];
                var oContext = oFirstItem.getBindingContext("catalog");
                var oProduct = oContext.getObject();

                // Overwrite current line
                var oNewLineData = fnCreateLine(oProduct);
                oModel.setProperty(this._sCurrentLinePath, oNewLineData);

                // If more items were selected, append them
                for (var i = 1; i < aSelectedItems.length; i++) {
                    var oItem = aSelectedItems[i];
                    var oCtx = oItem.getBindingContext("catalog");
                    aLineas.push(fnCreateLine(oCtx.getObject()));
                }

                this._sCurrentLinePath = null; // Reset
            } else {
                // Fallback (shouldn't happen with button removed, but good for robustness)
                aSelectedItems.forEach(function (oItem) {
                    var oContext = oItem.getBindingContext("catalog");
                    aLineas.push(fnCreateLine(oContext.getObject()));
                });
            }

            oModel.setProperty("/lineas", aLineas);
            this._calculateLineTotals();
            this._calculateTotals();
        },

        onAddLine: function () {
            var oModel = this.getView().getModel("form");
            var aLineas = oModel.getProperty("/lineas");
            aLineas.push({
                descripcion: "",
                cantidad: 1,
                precio_unitario: 0,
                id_impuesto: "",
                porcentaje_impuesto: 0,
                importe_impuesto: 0,
                total_linea: 0
            });
            oModel.setProperty("/lineas", aLineas);
        },

        onDeleteLine: function (oEvent) {
            var oModel = this.getView().getModel("form");
            var aLineas = oModel.getProperty("/lineas");
            var oItem = oEvent.getParameter("listItem");
            var sPath = oItem.getBindingContext("form").getPath();
            var iIndex = parseInt(sPath.split("/").pop());

            if (aLineas.length > 1) {
                aLineas.splice(iIndex, 1);
                oModel.setProperty("/lineas", aLineas);
                this._calculateTotals();
            } else {
                MessageToast.show("At least one line item is required");
            }
        },

        onLineChange: function () {
            this._calculateLineTotals();
            this._calculateTotals();
        },

        onTaxChange: function (oEvent) {
            var oModel = this.getView().getModel("form");
            var sPath = oEvent.getSource().getBindingContext("form").getPath();
            var sSelectedKey = oEvent.getParameter("selectedItem").getKey();

            var aImpuestos = oModel.getProperty("/impuestos");
            var oImpuesto = aImpuestos.find(function (imp) {
                return imp.id_impuesto === sSelectedKey;
            });

            if (oImpuesto) {
                oModel.setProperty(sPath + "/porcentaje_impuesto", oImpuesto.porcentaje);
            }

            this._calculateLineTotals();
            this._calculateTotals();
        },

        _parseNumber: function (vValue) {
            if (!vValue) return 0;
            if (typeof vValue === 'number') return vValue;

            // If it's a string
            var sValue = vValue.toString();

            // Check if it looks like Spanish format (has dots as thousands separator or comma as decimal)
            // Example: "5.000" -> 5000, "5.000,00" -> 5000.00, "5,50" -> 5.50
            if (sValue.includes('.') && sValue.includes(',')) {
                // "5.000,00" -> remove dots, replace comma with dot
                sValue = sValue.replace(/\./g, '').replace(',', '.');
            } else if (sValue.includes(',') && !sValue.includes('.')) {
                // "5,50" -> replace comma with dot
                sValue = sValue.replace(',', '.');
            } else if (sValue.includes('.') && sValue.indexOf('.') === sValue.lastIndexOf('.') && sValue.length - sValue.indexOf('.') === 4) {
                // "5.000" -> remove dot (thousands separator)
                // Heuristic: if only one dot and 3 digits after it, assume thousands separator
                sValue = sValue.replace(/\./g, '');
            }

            return parseFloat(sValue) || 0;
        },

        onGlobalTaxChange: function () {
            this._calculateLineTotals();
            this._calculateTotals();
        },

        onRetentionChange: function () {
            this._calculateTotals();
        },

        _calculateLineTotals: function () {
            var oModel = this.getView().getModel("form");
            var aLineas = oModel.getProperty("/lineas");
            var aImpuestos = oModel.getProperty("/impuestos") || [];

            aLineas.forEach(function (oLinea) {
                var nCantidad = parseFloat(oLinea.cantidad) || 0;
                var nPrecio = parseFloat(oLinea.precio_unitario) || 0;

                // Find tax rate for this line
                var nTaxRate = 0;
                if (oLinea.id_impuesto) {
                    var oTax = aImpuestos.find(function (t) { return t.id_impuesto == oLinea.id_impuesto; });
                    if (oTax) {
                        nTaxRate = parseFloat(oTax.porcentaje);
                        oLinea.porcentaje_impuesto = nTaxRate; // Ensure rate is stored
                    }
                }

                // Calculate
                var nSubtotal = nCantidad * nPrecio;
                var nTaxAmount = nSubtotal * (nTaxRate / 100);

                // Round to 2 decimals
                oLinea.importe_impuesto = parseFloat(nTaxAmount.toFixed(2));
                oLinea.total_linea = parseFloat((nSubtotal + nTaxAmount).toFixed(2));
            });

            oModel.setProperty("/lineas", aLineas);
        },

        _calculateTotals: function () {
            var oModel = this.getView().getModel("form");
            var aLineas = oModel.getProperty("/lineas");
            var nRetentionRate = parseFloat(oModel.getProperty("/retencion") || 0);

            var nSubtotal = 0;
            var oTaxMap = {};

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

            // Build tax breakdown
            var aTaxBreakdown = [];
            var nTotalTax = 0;
            for (var sRate in oTaxMap) {
                if (oTaxMap.hasOwnProperty(sRate)) {
                    var nAmt = oTaxMap[sRate];
                    aTaxBreakdown.push({
                        rate: sRate,
                        showRate: parseFloat(sRate),
                        amount: nAmt.toFixed(2)
                    });
                    nTotalTax += nAmt;
                }
            }
            // Sort desc
            aTaxBreakdown.sort(function (a, b) { return b.showRate - a.showRate; });

            var nRetentionAmount = nSubtotal * (nRetentionRate / 100);
            var nTotal = nSubtotal + nTotalTax - nRetentionAmount;

            oModel.setProperty("/totals", {
                subtotal: nSubtotal.toFixed(2),
                impuestos: nTotalTax.toFixed(2),
                taxBreakdown: aTaxBreakdown,
                retention: nRetentionAmount.toFixed(2),
                total: nTotal.toFixed(2)
            });
        },

        onSave: function () {
            var oModel = this.getView().getModel("form");
            var oData = oModel.getData();

            // Validation
            var missingFields = [];

            // Verificar número
            if (!oData.numero || (typeof oData.numero === 'string' && oData.numero.trim() === "")) {
                missingFields.push("Number");
            }

            // Verificar fecha de emisión
            if (!oData.fecha_emision) {
                missingFields.push("Issue Date");
            }

            // Verificar emisor - puede ser string o number
            if (!oData.id_emisor || oData.id_emisor === "" || oData.id_emisor === 0) {
                missingFields.push("Issuer");
            }

            // Verificar receptor - puede ser string o number
            if (!oData.id_receptor || oData.id_receptor === "" || oData.id_receptor === 0) {
                missingFields.push("Receiver");
            }

            if (missingFields.length > 0) {
                console.log("Validation failed. Missing fields:", missingFields);
                console.log("Form data:", {
                    numero: oData.numero,
                    fecha_emision: oData.fecha_emision,
                    id_emisor: oData.id_emisor,
                    id_receptor: oData.id_receptor
                });
                MessageBox.error("Please fill all required fields: " + missingFields.join(", "));
                return;
            }

            if (oData.lineas.length === 0) {
                MessageBox.error("At least one line item is required");
                return;
            }

            var that = this;
            var sToken = localStorage.getItem("auth_token");
            var sUrl = oData.isEdit
                ? "/api/invoices/facturas/" + oData.id_factura
                : "/api/invoices/facturas";
            var sMethod = oData.isEdit ? "PUT" : "POST";

            // Client-side validation
            if (!oData.id_emisor || oData.id_emisor === "") {
                MessageBox.error("Issuer (Emisor) is missing. Please select one from the dropdown list.");
                return;
            }
            if (!oData.id_receptor || oData.id_receptor === "") {
                MessageBox.error("Receiver (Receptor) is missing. Please select one from the dropdown list.");
                return;
            }

            var oPayload = {
                numero: oData.numero,
                serie: oData.serie,
                fecha_emision: oData.fecha_emision,
                fecha_vencimiento: oData.fecha_vencimiento,
                fecha_operacion: oData.fecha_operacion, // Added Operation Date
                id_emisor: oData.id_emisor,
                id_receptor: oData.id_receptor,
                metodo_pago: oData.metodo_pago,
                codigo_tipo: oData.codigo_tipo || "01",
                id_origen: oData.id_origen,
                lineas: oData.lineas,
                invoice_country_id: 3,
                estado: oData.estado, // Include status in payload
                subtotal: parseFloat(oData.totals.subtotal),
                impuestos_totales: parseFloat(oData.totals.impuestos),
                total: parseFloat(oData.totals.total)
            };

            console.log("DEBUG: Saving invoice payload:", oPayload);

            fetch(sUrl, {
                method: sMethod,
                headers: {
                    "Authorization": "Bearer " + sToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oPayload)
            })
                .then(async function (response) {
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.details || data.error || "Unknown error");
                    }
                    return data;
                })
                .then(function (data) {
                    MessageToast.show(oData.isEdit ? "Invoice updated successfully" : "Invoice created successfully");
                    that.getOwnerComponent().getRouter().navTo("franceInvoiceDetail", {
                        invoiceId: data.id_factura
                    });
                })
                .catch(function (error) {
                    console.error("Error saving invoice:", error);
                    MessageBox.error("Error saving invoice: " + error.message);
                });
        },

        onCancel: function () {
            if (this._bFromScan) {
                this.getOwnerComponent().getRouter().navTo("franceScanInvoice");
            } else {
                var sTipo = this.getView().getModel("form").getProperty("/codigo_tipo");
                if (sTipo === "02") {
                    this.getOwnerComponent().getRouter().navTo("franceReceiptList", { tipo: "RECEIPT" });
                } else {
                    this.getOwnerComponent().getRouter().navTo("franceIssueList", { tipo: "ISSUE" });
                }
            }
        },

        onNavBack: function () {
            window.history.go(-1);
        }
    });
});
