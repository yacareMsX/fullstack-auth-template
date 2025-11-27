sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/VBox"
], function (Controller, JSONModel, MessageToast, MessageBox, Dialog, Button, Label, Input, VBox) {
    "use strict";

    return Controller.extend("invoice.app.controller.OriginList", {

        onInit: function () {
            var oModel = new JSONModel();
            this.getView().setModel(oModel, "origins");

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("originList").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._loadOrigins();
        },

        _loadOrigins: function () {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("/api/admin/origenes", {
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    that.getView().getModel("origins").setData(data);
                })
                .catch(function (err) {
                    console.error("Error loading origins:", err);
                });
        },

        onNavBack: function () {
            window.history.go(-1);
        },

        onCreateOrigin: function () {
            this._openOriginDialog(null);
        },

        onEditOrigin: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("origins");
            var oOrigin = oContext.getObject();
            this._openOriginDialog(oOrigin);
        },

        _openOriginDialog: function (oOrigin) {
            var that = this;
            var bEdit = !!oOrigin;
            var sTitle = bEdit ? "Edit Origin" : "New Origin"; // Should use i18n

            var oInput = new Input({
                value: bEdit ? oOrigin.descripcion : "",
                placeholder: "Description"
            });

            var oDialog = new Dialog({
                title: sTitle,
                content: [
                    new VBox({
                        items: [
                            new Label({ text: "Description", labelFor: oInput }),
                            oInput
                        ]
                    }).addStyleClass("sapUiSmallMargin")
                ],
                beginButton: new Button({
                    text: "Save",
                    type: "Emphasized",
                    press: function () {
                        var sDesc = oInput.getValue();
                        if (!sDesc) {
                            MessageToast.show("Description is required");
                            return;
                        }
                        that._saveOrigin(sDesc, bEdit ? oOrigin.id_origen : null, oDialog);
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

        _saveOrigin: function (sDescription, sId, oDialog) {
            var that = this;
            var sToken = localStorage.getItem("auth_token");
            var sUrl = "/api/admin/origenes";
            var sMethod = "POST";

            if (sId) {
                sUrl += "/" + sId;
                sMethod = "PUT";
            }

            fetch(sUrl, {
                method: sMethod,
                headers: {
                    "Authorization": "Bearer " + sToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ descripcion: sDescription })
            })
                .then(function (response) {
                    if (!response.ok) throw new Error("Error saving origin");
                    return response.json();
                })
                .then(function () {
                    MessageToast.show("Origin saved successfully");
                    oDialog.close();
                    that._loadOrigins();
                })
                .catch(function (err) {
                    console.error("Error saving origin:", err);
                    MessageBox.error("Error saving origin");
                });
        },

        onDeleteOrigin: function (oEvent) {
            var that = this;
            var oContext = oEvent.getSource().getBindingContext("origins");
            var oOrigin = oContext.getObject();
            var sToken = localStorage.getItem("auth_token");

            MessageBox.confirm("Are you sure you want to delete this origin?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        fetch("/api/admin/origenes/" + oOrigin.id_origen, {
                            method: "DELETE",
                            headers: { "Authorization": "Bearer " + sToken }
                        })
                            .then(function (response) {
                                if (!response.ok) {
                                    return response.json().then(err => { throw new Error(err.error || "Error deleting"); });
                                }
                                return response.json();
                            })
                            .then(function () {
                                MessageToast.show("Origin deleted");
                                that._loadOrigins();
                            })
                            .catch(function (err) {
                                MessageBox.error(err.message);
                            });
                    }
                }
            });
        }
    });
});
