sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History"
], function (Controller, MessageToast, JSONModel, History) {
    "use strict";

    return Controller.extend("invoice.app.controller.certificates.CertificateDetail", {

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("certificateDetail").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sId = oEvent.getParameter("arguments").id;

            if (sId === "new") {
                this._createModel({
                    active: true,
                    acronimo: "",
                    password: "", // Not stored, just for immediate upload
                    created_date: null,
                    expiry_date: null
                });
            } else {
                this._loadCertificate(sId);
            }
        },

        _createModel: function (oData) {
            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel, "certificate");
        },

        _loadCertificate: function (sId) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("/api/certificates/" + sId, {
                headers: {
                    "Authorization": "Bearer " + sToken
                }
            })
                .then(function (response) {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error("Failed to fetch certificate");
                    }
                })
                .then(function (data) {
                    that._createModel(data);
                })
                .catch(function (error) {
                    MessageToast.show("Error loading certificate: " + error.message);
                    that.onNavBack();
                });
        },

        onSave: function () {
            var oModel = this.getView().getModel("certificate");
            var oData = oModel.getData();

            if (oData.id) {
                this._update(oData);
            } else {
                this._create(oData);
            }
        },

        _create: function (oData) {
            var oFileUploader = this.byId("fileUploader");
            // Check if file is selected (for native FileUploader, utilize Fiori unified FileUploader DOM reference or internal checks)
            // The unified.FileUploader doesn't expose file object easily via public API unless we use 'upload' method or access internal reference.
            // Better approach for Ajax upload with UI5 FileUploader: check 'oFileUploader.oFileUpload.files[0]'

            var oDomRef = oFileUploader.getDomRef("fu");
            var file = oDomRef && oDomRef.files && oDomRef.files[0];

            if (!file) {
                MessageToast.show("Por favor, seleccione un fichero P12");
                return;
            }
            if (!oData.acronimo) {
                MessageToast.show("El acrónimo es obligatorio");
                return;
            }

            var formData = new FormData();
            formData.append("p12File", file);
            formData.append("acronimo", oData.acronimo);
            if (oData.password) {
                formData.append("password", oData.password);
            }
            formData.append("active", oData.active);

            var sToken = localStorage.getItem("auth_token");
            var that = this;

            // Blocking UI? 
            MessageToast.show("Subiendo y procesando...");

            fetch("/api/certificates", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + sToken
                    // Content-Type not set, browser sets it with boundary for FormData
                },
                body: formData
            })
                .then(function (response) {
                    if (!response.ok) {
                        return response.json().then(function (err) { throw new Error(err.error || "Upload failed"); });
                    }
                    return response.json();
                })
                .then(function (savedData) {
                    MessageToast.show("Certificado subido y guardado correctamente");
                    that.onNavBack();
                })
                .catch(function (error) {
                    MessageToast.show("Error: " + error.message);
                });
        },

        _update: function (oData) {
            var sToken = localStorage.getItem("auth_token");
            var that = this;

            fetch("/api/certificates/" + oData.id, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + sToken
                },
                body: JSON.stringify({
                    acronimo: oData.acronimo,
                    active: oData.active
                })
            })
                .then(function (response) {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error("Failed to update certificate");
                    }
                })
                .then(function (savedData) {
                    MessageToast.show("Certificado actualizado");
                    that.onNavBack();
                })
                .catch(function (error) {
                    MessageToast.show("Error al actualizar: " + error.message);
                });
        },

        onCancel: function () {
            this.onNavBack();
        },

        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo("certificateList", {}, true);
            }
        }
    });
});
