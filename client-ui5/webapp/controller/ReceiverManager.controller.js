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

    return Controller.extend("invoice.app.controller.ReceiverManager", {

        onInit: function () {
            var oViewModel = new JSONModel({ receivers: [] });
            this.getView().setModel(oViewModel, "receiver");
            this._loadReceivers();
        },

        _loadReceivers: function () {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("http://localhost:3000/api/invoices/receptores", {
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    that.getView().getModel("receiver").setProperty("/receivers", data);
                })
                .catch(function (error) {
                    console.error("Error loading receivers:", error);
                    MessageToast.show("Error loading receivers");
                });
        },

        onCreateReceiver: function () {
            this._showReceiverDialog(null);
        },

        onEditReceiver: function (oEvent) {
            var oItem = oEvent.getSource().getParent().getParent();
            var oContext = oItem.getBindingContext("receiver");
            var oReceiver = oContext.getObject();
            this._showReceiverDialog(oReceiver);
        },

        _showReceiverDialog: function (oReceiver) {
            var that = this;
            var bEdit = !!oReceiver;

            var oDialog = new Dialog({
                title: bEdit ? "Edit Receiver" : "New Receiver",
                content: new SimpleForm({
                    content: [
                        new Label({ text: "Name", required: true }),
                        new Input({ id: "nameInput", value: oReceiver ? oReceiver.nombre : "", required: true }),
                        new Label({ text: "NIF", required: true }),
                        new Input({ id: "nifInput", value: oReceiver ? oReceiver.nif : "", required: true }),
                        new Label({ text: "Address" }),
                        new Input({ id: "addressInput", value: oReceiver ? oReceiver.direccion : "" }),
                        new Label({ text: "Email" }),
                        new Input({ id: "emailInput", value: oReceiver ? oReceiver.email : "", type: "Email" }),
                        new Label({ text: "Phone" }),
                        new Input({ id: "phoneInput", value: oReceiver ? oReceiver.telefono : "", type: "Tel" })
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

                        that._saveReceiver(oData, bEdit ? oReceiver.id_receptor : null);
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

        _saveReceiver: function (oData, sId) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");
            var sUrl = sId
                ? "http://localhost:3000/api/invoices/receptores/" + sId
                : "http://localhost:3000/api/invoices/receptores";
            var sMethod = sId ? "PUT" : "POST";

            fetch(sUrl, {
                method: sMethod,
                headers: {
                    "Authorization": "Bearer " + sToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oData)
            })
                .then(function (response) { return response.json(); })
                .then(function () {
                    MessageToast.show(sId ? "Receiver updated" : "Receiver created");
                    that._loadReceivers();
                })
                .catch(function (error) {
                    console.error("Error saving receiver:", error);
                    MessageBox.error("Error saving receiver");
                });
        },

        onDeleteReceiver: function (oEvent) {
            var that = this;
            var oItem = oEvent.getSource().getParent().getParent();
            var oContext = oItem.getBindingContext("receiver");
            var oReceiver = oContext.getObject();

            MessageBox.confirm("Delete receiver '" + oReceiver.nombre + "'?", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        that._deleteReceiver(oReceiver.id_receptor);
                    }
                }
            });
        },

        _deleteReceiver: function (sId) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("http://localhost:3000/api/invoices/receptores/" + sId, {
                method: "DELETE",
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(function () {
                    MessageToast.show("Receiver deleted");
                    that._loadReceivers();
                })
                .catch(function (error) {
                    console.error("Error deleting receiver:", error);
                    MessageBox.error("Cannot delete receiver with existing invoices");
                });
        },

        onNavBack: function () {
            window.history.go(-1);
        }
    });
});
