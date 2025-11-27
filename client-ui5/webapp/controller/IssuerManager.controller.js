sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Input",
    "sap/ui/layout/form/SimpleForm"
], function (Controller, JSONModel, MessageToast, MessageBox, Dialog, Button, Label, Input, SimpleForm) {
    "use strict";

    return Controller.extend("invoice.app.controller.IssuerManager", {

        onInit: function () {
            var oViewModel = new JSONModel({ issuers: [] });
            this.getView().setModel(oViewModel, "issuer");
            this._loadIssuers();
        },

        _loadIssuers: function () {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("/api/invoices/emisores", {
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    that.getView().getModel("issuer").setProperty("/issuers", data);
                })
                .catch(function (error) {
                    console.error("Error loading issuers:", error);
                    MessageToast.show("Error loading issuers");
                });
        },

        onCreateIssuer: function () {
            this._showIssuerDialog(null);
        },

        onEditIssuer: function (oEvent) {
            var oItem = oEvent.getSource().getParent().getParent();
            var oContext = oItem.getBindingContext("issuer");
            var oIssuer = oContext.getObject();
            this._showIssuerDialog(oIssuer);
        },

        _showIssuerDialog: function (oIssuer) {
            var that = this;
            var bEdit = !!oIssuer;

            var oDialog = new Dialog({
                title: bEdit ? "Edit Issuer" : "New Issuer",
                content: new SimpleForm({
                    content: [
                        new Label({ text: "Name", required: true }),
                        new Input({ id: "nameInput", value: oIssuer ? oIssuer.nombre : "", required: true }),
                        new Label({ text: "NIF", required: true }),
                        new Input({ id: "nifInput", value: oIssuer ? oIssuer.nif : "", required: true }),
                        new Label({ text: "Address" }),
                        new Input({ id: "addressInput", value: oIssuer ? oIssuer.direccion : "" }),
                        new Label({ text: "Email" }),
                        new Input({ id: "emailInput", value: oIssuer ? oIssuer.email : "", type: "Email" }),
                        new Label({ text: "Phone" }),
                        new Input({ id: "phoneInput", value: oIssuer ? oIssuer.telefono : "", type: "Tel" })
                    ]
                }),
                beginButton: new Button({
                    text: bEdit ? "Update" : "Create",
                    type: "Emphasized",
                    press: function () {
                        var oData = {
                            nombre: sap.ui.getCore().byId("nameInput").getValue(),
                            nif: sap.ui.getCore().byId("nifInput").getValue(),
                            direccion: sap.ui.getCore().byId("addressInput").getValue(),
                            email: sap.ui.getCore().byId("emailInput").getValue(),
                            telefono: sap.ui.getCore().byId("phoneInput").getValue()
                        };

                        if (!oData.nombre || !oData.nif) {
                            MessageBox.error("Name and NIF are required");
                            return;
                        }

                        that._saveIssuer(oData, bEdit ? oIssuer.id_emisor : null);
                        oDialog.close();
                    }
                }),
                endButton: new Button({
                    text: "Cancel",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.open();
        },

        _saveIssuer: function (oData, sId) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            if (!sToken) {
                MessageBox.error("No authentication token found. Please login again.");
                return;
            }

            var sUrl = sId
                ? "/api/invoices/emisores/" + sId
                : "/api/invoices/emisores";
            var sMethod = sId ? "PUT" : "POST";

            console.log("Saving issuer:", sMethod, sUrl, oData);

            fetch(sUrl, {
                method: sMethod,
                headers: {
                    "Authorization": "Bearer " + sToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oData)
            })
                .then(function (response) {
                    console.log("Response status:", response.status);
                    if (!response.ok) {
                        throw new Error("HTTP error " + response.status);
                    }
                    return response.json();
                })
                .then(function (data) {
                    console.log("Issuer saved successfully:", data);
                    MessageToast.show(sId ? "Issuer updated" : "Issuer created");
                    that._loadIssuers();
                })
                .catch(function (error) {
                    console.error("Error saving issuer:", error);
                    MessageBox.error("Error saving issuer: " + error.message + ". Check console for details.");
                });
        },

        onDeleteIssuer: function (oEvent) {
            var that = this;
            var oItem = oEvent.getSource().getParent().getParent();
            var oContext = oItem.getBindingContext("issuer");
            var oIssuer = oContext.getObject();

            MessageBox.confirm("Delete issuer '" + oIssuer.nombre + "'?", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        that._deleteIssuer(oIssuer.id_emisor);
                    }
                }
            });
        },

        _deleteIssuer: function (sId) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("/api/invoices/emisores/" + sId, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(function () {
                    MessageToast.show("Issuer deleted");
                    that._loadIssuers();
                })
                .catch(function (error) {
                    console.error("Error deleting issuer:", error);
                    MessageBox.error("Cannot delete issuer with existing invoices");
                });
        },

        onNavBack: function () {
            window.history.go(-1);
        }
    });
});
