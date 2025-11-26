sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, MessageToast, MessageBox, Fragment, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("invoice.app.controller.InvoiceForm", {

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("invoiceNew").attachPatternMatched(this._onNewInvoice, this);
            oRouter.getRoute("invoiceEdit").attachPatternMatched(this._onEditInvoice, this);

            this._initializeModel();
        },

        _initializeModel: function () {
            var oViewModel = new JSONModel({
                isEdit: false,
                numero: "",
                serie: "",
                fecha_emision: new Date().toISOString().split('T')[0],
                fecha_vencimiento: "",
                id_emisor: "",
                id_receptor: "",
                metodo_pago: "TRANSFERENCIA",
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
                impuestos: [],
                totals: {
                    subtotal: 0,
                    impuestos: 0,
                    total: 0
                }
            });
            this.getView().setModel(oViewModel, "form");

            this._loadFormData();
        },

        _loadFormData: function () {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            Promise.all([
                fetch("http://localhost:3000/api/invoices/emisores", {
                    headers: { "Authorization": "Bearer " + sToken }
                }).then(r => r.json()),
                fetch("http://localhost:3000/api/invoices/receptores", {
                    headers: { "Authorization": "Bearer " + sToken }
                }).then(r => r.json()),
                fetch("http://localhost:3000/api/invoices/impuestos?activo=true", {
                    headers: { "Authorization": "Bearer " + sToken }
                }).then(r => r.json())
            ]).then(function ([emisores, receptores, impuestos]) {
                console.log("Emisores loaded:", emisores);
                console.log("Receptores loaded:", receptores);
                var oModel = that.getView().getModel("form");
                oModel.setProperty("/emisores", emisores);
                oModel.setProperty("/receptores", receptores);
                oModel.setProperty("/impuestos", impuestos);
            }).catch(function (error) {
                console.error("Error loading form data:", error);
                MessageToast.show("Error loading form data");
            });
        },

        _onNewInvoice: function () {
            this._initializeModel();
        },

        _onEditInvoice: function (oEvent) {
            var sInvoiceId = oEvent.getParameter("arguments").invoiceId;
            this._loadInvoiceForEdit(sInvoiceId);
        },

        _loadInvoiceForEdit: function (sInvoiceId) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("http://localhost:3000/api/invoices/facturas/" + sInvoiceId, {
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
                    oModel.setProperty("/id_receptor", data.id_receptor);
                    oModel.setProperty("/metodo_pago", data.metodo_pago || "TRANSFERENCIA");
                    oModel.setProperty("/lineas", data.lineas || []);
                    that._calculateTotals();
                })
                .catch(function (error) {
                    console.error("Error loading invoice:", error);
                    MessageToast.show("Error loading invoice");
                });
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

                    var sToken = localStorage.getItem("auth_token");
                    fetch("http://localhost:3000/api/catalog/products", {
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

            // If the last line is empty, remove it (optional UX improvement)
            // For now, just append.

            aSelectedItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext("catalog");
                var oProduct = oContext.getObject();

                // Find translation
                var sCurrentLang = sap.ui.getCore().getConfiguration().getLanguage().split("-")[0]; // e.g. "en" or "es"
                var sDesc = oProduct.sku; // Fallback

                if (oProduct.translations && oProduct.translations.length > 0) {
                    // Try to find current lang, then EN, then first
                    var oTrans = oProduct.translations.find(t => t.codigo_idioma === sCurrentLang) ||
                        oProduct.translations.find(t => t.codigo_idioma === 'en') ||
                        oProduct.translations[0];
                    if (oTrans) sDesc = oTrans.nombre;
                }

                aLineas.push({
                    descripcion: sDesc,
                    cantidad: 1,
                    precio_unitario: parseFloat(oProduct.precio_base),
                    id_impuesto: oProduct.id_impuesto,
                    porcentaje_impuesto: parseFloat(oProduct.impuesto_porcentaje) || 0,
                    importe_impuesto: 0, // Will be calculated
                    total_linea: 0 // Will be calculated
                });
            });

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

        _calculateLineTotals: function () {
            var oModel = this.getView().getModel("form");
            var aLineas = oModel.getProperty("/lineas");

            aLineas.forEach(function (linea, index) {
                var fCantidad = parseFloat(linea.cantidad) || 0;
                var fPrecio = parseFloat(linea.precio_unitario) || 0;
                var fPorcentaje = parseFloat(linea.porcentaje_impuesto) || 0;

                var fSubtotal = fCantidad * fPrecio;
                var fImpuesto = fSubtotal * (fPorcentaje / 100);
                var fTotal = fSubtotal + fImpuesto;

                oModel.setProperty("/lineas/" + index + "/importe_impuesto", fImpuesto.toFixed(2));
                oModel.setProperty("/lineas/" + index + "/total_linea", fTotal.toFixed(2));
            });
        },

        _calculateTotals: function () {
            var oModel = this.getView().getModel("form");
            var aLineas = oModel.getProperty("/lineas");

            var fSubtotal = 0;
            var fImpuestos = 0;

            aLineas.forEach(function (linea) {
                var fCantidad = parseFloat(linea.cantidad) || 0;
                var fPrecio = parseFloat(linea.precio_unitario) || 0;
                fSubtotal += fCantidad * fPrecio;
                fImpuestos += parseFloat(linea.importe_impuesto) || 0;
            });

            var fTotal = fSubtotal + fImpuestos;

            oModel.setProperty("/totals", {
                subtotal: fSubtotal.toFixed(2),
                impuestos: fImpuestos.toFixed(2),
                total: fTotal.toFixed(2)
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
                ? "http://localhost:3000/api/invoices/facturas/" + oData.id_factura
                : "http://localhost:3000/api/invoices/facturas";
            var sMethod = oData.isEdit ? "PUT" : "POST";

            var oPayload = {
                numero: oData.numero,
                serie: oData.serie,
                fecha_emision: oData.fecha_emision,
                fecha_vencimiento: oData.fecha_vencimiento,
                id_emisor: oData.id_emisor,
                id_receptor: oData.id_receptor,
                metodo_pago: oData.metodo_pago,
                lineas: oData.lineas
            };

            fetch(sUrl, {
                method: sMethod,
                headers: {
                    "Authorization": "Bearer " + sToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oPayload)
            })
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    MessageToast.show(oData.isEdit ? "Invoice updated successfully" : "Invoice created successfully");
                    that.getOwnerComponent().getRouter().navTo("invoiceDetail", {
                        invoiceId: data.id_factura
                    });
                })
                .catch(function (error) {
                    console.error("Error saving invoice:", error);
                    MessageBox.error("Error saving invoice");
                });
        },

        onCancel: function () {
            this.getOwnerComponent().getRouter().navTo("invoiceList");
        },

        onNavBack: function () {
            window.history.go(-1);
        }
    });
});
