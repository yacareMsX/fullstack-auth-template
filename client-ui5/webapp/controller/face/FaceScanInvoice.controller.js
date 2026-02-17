sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, BusyIndicator, JSONModel) {
    "use strict";

    return Controller.extend("invoice.app.controller.face.FaceScanInvoice", {

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

            var domRef = oFileUploader.getDomRef("fu");
            var file = domRef && domRef.files && domRef.files[0];

            if (!file) {
                MessageToast.show("Por favor, selecciona un archivo primero.");
                return;
            }

            BusyIndicator.show(0);

            var formData = new FormData();
            formData.append("invoiceFile", file);

            var sToken = localStorage.getItem("auth_token");

            // Use isolated API endpoint
            fetch("/api/face/scan", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + sToken
                },
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

                    // Store data in global model (shared model, but used by isolated controller)
                    var oScannedModel = that.getOwnerComponent().getModel("scannedData");
                    console.log("DEBUG: FaceScanInvoice - Setting scannedData model");

                    oScannedModel.setData({
                        ...oData,
                        fileUrl: sFileUrl,
                        mimeType: sMimeType,
                        rawJson: oData, // Store raw response for "View JSON"
                        pendingProcess: true // Flag to trigger processing in target view
                    });

                    // Navigate to Face Invoice Form (Receipt mode)
                    console.log("DEBUG: Navigating to faceInvoiceNew (Model-based)");
                    that.getOwnerComponent().getRouter().navTo("faceInvoiceNew", {
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
