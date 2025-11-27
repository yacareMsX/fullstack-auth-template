sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "invoice/app/service/MockOCRService",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, BusyIndicator, MockOCRService, JSONModel) {
    "use strict";

    return Controller.extend("invoice.app.controller.ScanInvoice", {

        onInit: function () {
            // Initialize global model for scanned data if not exists
            if (!this.getOwnerComponent().getModel("scannedData")) {
                this.getOwnerComponent().setModel(new JSONModel({}), "scannedData");
            }
        },

        onFileChange: function (oEvent) {
            var oFileUploader = oEvent.getSource();
            var sFile = oFileUploader.getValue();
            this.byId("scanButton").setEnabled(!!sFile);
        },

        onScan: function () {
            var that = this;
            var oFileUploader = this.byId("fileUploader");

            // Get the file from the FileUploader
            // SAPUI5 FileUploader doesn't give direct access to the File object easily via getValue()
            // We need to access the internal DOM input or use the 'change' event to store the file.
            // However, since we are using a standard upload, let's use the FUE's native upload capabilities 
            // OR access the DOM ref if we want to use fetch manually.
            // A cleaner way in UI5 is to use the 'change' event to capture the file object if possible, 
            // or use the DOM reference.

            var domRef = oFileUploader.getDomRef("fu");
            var file = domRef && domRef.files && domRef.files[0];

            if (!file) {
                MessageToast.show("Por favor, selecciona un archivo primero.");
                return;
            }

            BusyIndicator.show(0);

            var formData = new FormData();
            formData.append("invoiceFile", file);

            fetch("/api/scan", {
                method: "POST",
                body: formData
            })
                .then(function (response) {
                    if (!response.ok) {
                        return response.text().then(function (text) {
                            console.error("Server Error Details:", text);
                            throw new Error("Error en el servidor: " + text);
                        });
                    }
                    return response.json();
                })
                .then(function (oData) {
                    BusyIndicator.hide();
                    MessageToast.show("Escaneo completado con éxito");

                    // Create Blob URL for the file
                    var sFileUrl = URL.createObjectURL(file);
                    var sMimeType = file.type;

                    // Store data in global model
                    var oScannedModel = that.getOwnerComponent().getModel("scannedData");
                    console.log("DEBUG: ScanInvoice - Setting scannedData model");
                    console.log("DEBUG: File URL:", sFileUrl);
                    console.log("DEBUG: Data:", oData);
                    oScannedModel.setData({
                        ...oData,
                        fileUrl: sFileUrl,
                        mimeType: sMimeType,
                        rawJson: oData, // Store raw response for "View JSON"
                        pendingProcess: true // Flag to trigger processing in target view
                    });

                    // Navigate to Invoice Form (Receipt mode)
                    console.log("DEBUG: Navigating to invoiceNew (Model-based)");
                    that.getOwnerComponent().getRouter().navTo("invoiceNew", {
                        tipo: "RECEIPT"
                    });
                })
                .catch(function (err) {
                    BusyIndicator.hide();
                    console.error("Scan error:", err);
                    MessageToast.show("Error al escanear: " + err.message);
                });
        }
    });
});
