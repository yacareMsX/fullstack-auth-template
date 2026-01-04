sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("user.management.controller.AuthObjects", {

        onInit: function () {
            var oModel = new JSONModel({
                authObjects: []
            });
            this.getView().setModel(oModel);
            this._loadAuthObjects();
        },

        _loadAuthObjects: function (sSearchQuery) {
            var sUrl = "/api/admin/auth-objects";
            if (sSearchQuery) {
                sUrl += "?search=" + encodeURIComponent(sSearchQuery);
            }

            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var that = this;
            this.getView().setBusy(true);

            fetch(sUrl, { headers: oHeaders })
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    if (data.error) throw new Error(data.error);
                    that.getView().getModel().setProperty("/authObjects", data);
                })
                .catch(function (error) {
                    MessageToast.show("Error loading auth objects: " + error.message);
                })
                .finally(function () {
                    that.getView().setBusy(false);
                });
        },

        onSearch: function () {
            var sQuery = this.byId("searchAuthObject").getValue();
            this._loadAuthObjects(sQuery);
        },

        onClearFilters: function () {
            this.byId("searchAuthObject").setValue("");
            this._loadAuthObjects();
        },

        onSelectionChange: function (oEvent) {
            var bSelected = oEvent.getParameter("listItem").getSelected();
            this.byId("btnModify").setEnabled(bSelected);
            this.byId("btnDelete").setEnabled(bSelected);
        },

        onCreate: function () {
            this._openDialog(false);
        },

        onModify: function () {
            this._openDialog(true);
        },

        _openDialog: function (bEditMode) {
            var oView = this.getView();
            var oResourceBundle = oView.getModel("i18n").getResourceBundle();

            var sTitle = bEditMode ? "Modificar Objeto" : "Crear Objeto"; // Simplify for now, verify i18n later
            var oData = { code: "", object_type: "", description: "" };

            if (bEditMode) {
                var oSelectedItem = this.byId("authObjectsTable").getSelectedItem();
                if (!oSelectedItem) return;
                oData = oSelectedItem.getBindingContext().getObject();
            }

            var oViewModel = new JSONModel({
                isEditMode: bEditMode,
                dialogTitle: sTitle,
                id: oData.id,
                code: oData.code,
                object_type: oData.object_type,
                description: oData.description
            });
            oView.setModel(oViewModel, "newAuthObject");

            if (!this._pDialog) {
                this._pDialog = sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "user.management.view.CreateAuthObjectDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }
            this._pDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        onCancelDialog: function () {
            this._pDialog.then(function (oDialog) { oDialog.close(); });
        },

        onSaveAuthObject: function () {
            var oModel = this.getView().getModel("newAuthObject");
            var oData = oModel.getData();

            if (!oData.code || !oData.object_type) {
                MessageBox.error("Code and Type are required");
                return;
            }

            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var sUrl = "/api/admin/auth-objects";
            var sMethod = "POST";
            if (oData.isEditMode) {
                sUrl += "/" + oData.id;
                sMethod = "PUT";
            }

            var that = this;
            this.getView().setBusy(true);

            fetch(sUrl, {
                method: sMethod,
                headers: oHeaders,
                body: JSON.stringify(oData)
            })
                .then(function (res) {
                    if (!res.ok) return res.json().then(function (e) { throw new Error(e.error) });
                    return res.json();
                })
                .then(function () {
                    MessageToast.show(oData.isEditMode ? "Object updated" : "Object created");
                    that._loadAuthObjects();
                    that.onCancelDialog();
                })
                .catch(function (err) {
                    MessageBox.error("Error saving object: " + err.message);
                })
                .finally(function () { that.getView().setBusy(false); });
        },

        onDelete: function () {
            var oSelectedItem = this.byId("authObjectsTable").getSelectedItem();
            if (!oSelectedItem) return;

            var oObject = oSelectedItem.getBindingContext().getObject();
            var that = this;

            MessageBox.confirm("Delete object '" + oObject.code + "'?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that._performDelete(oObject.id);
                    }
                }
            });
        },

        _performDelete: function (id) {
            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var that = this;
            this.getView().setBusy(true);

            fetch("/api/admin/auth-objects/" + id, {
                method: "DELETE",
                headers: oHeaders
            })
                .then(function (res) {
                    if (!res.ok) return res.json().then(function (e) { throw new Error(e.error) });
                    return res.json();
                })
                .then(function () {
                    MessageToast.show("Object deleted");
                    that._loadAuthObjects();
                })
                .catch(function (err) {
                    MessageBox.error("Error deleting object: " + err.message);
                })
                .finally(function () { that.getView().setBusy(false); });
        }
    });
});
