sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("user.management.controller.RolProfiles", {

        onInit: function () {
            var oModel = new JSONModel({
                profiles: [],
                allAuthObjects: [] // For the dialog Selection
            });
            this.getView().setModel(oModel);
            this._loadProfiles();
            this._loadAllAuthObjects();
        },

        _loadProfiles: function (sSearchQuery) {
            var sUrl = "/api/admin/rol-profiles";
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
                    that.getView().getModel().setProperty("/profiles", data);
                })
                .catch(function (error) {
                    MessageToast.show("Error loading profiles: " + error.message);
                })
                .finally(function () {
                    that.getView().setBusy(false);
                });
        },

        _loadAllAuthObjects: function () {
            // Load all auth objects for the dialog selector
            var sUrl = "/api/admin/auth-objects"; // Reusing existing endpoint
            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var that = this;
            fetch(sUrl, { headers: oHeaders })
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    if (!data.error) {
                        that.getView().getModel().setProperty("/allAuthObjects", data);
                    }
                })
                .catch(function (e) {
                    console.error("Failed to load auth objects for selector", e);
                });
        },

        onSearch: function () {
            var sQuery = this.byId("searchProfile").getValue();
            this._loadProfiles(sQuery);
        },

        onClearFilters: function () {
            this.byId("searchProfile").setValue("");
            this._loadProfiles();
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
            var that = this;

            var sTitle = bEditMode ? "Modificar Perfil" : "Crear Perfil";
            var oData = { name: "", description: "", auth_object_ids: [] };

            if (bEditMode) {
                var oSelectedItem = this.byId("profilesTable").getSelectedItem();
                if (!oSelectedItem) return;
                var oSimpleData = oSelectedItem.getBindingContext().getObject();

                // We need to fetch details to get assigned auth_object_ids
                this._fetchProfileDetails(oSimpleData.id).then(function (fullData) {
                    that._showDialog(bEditMode, sTitle, fullData);
                });
            } else {
                this._showDialog(bEditMode, sTitle, oData);
            }
        },

        _fetchProfileDetails: function (id) {
            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            return fetch("/api/admin/rol-profiles/" + id, { headers: oHeaders })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (data.error) throw new Error(data.error);
                    return data;
                })
                .catch(function (e) {
                    MessageToast.show("Error fetching details: " + e.message);
                    return { name: "", description: "", auth_object_ids: [] };
                });
        },

        _showDialog: function (bEditMode, sTitle, oData) {
            var oView = this.getView();

            // Ensure auth_object_ids is array of strings (MultiComboBox expects keys as strings often, but check model)
            // Actually, if we bind SelectedKeys, they should match the item key type.
            // Our IDs are integers. UI5 MultiComboBox selectedKeys expects array of strings.
            var aSelectedKeys = (oData.auth_object_ids || []).map(function (id) { return String(id); });

            var oViewModel = new JSONModel({
                isEditMode: bEditMode,
                dialogTitle: sTitle,
                id: oData.id,
                name: oData.name,
                description: oData.description,
                selectedAuthObjects: aSelectedKeys
            });
            oView.setModel(oViewModel, "newProfile");

            if (!this._pDialog) {
                this._pDialog = sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "user.management.view.CreateRolProfileDialog",
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

        onSaveProfile: function () {
            var oModel = this.getView().getModel("newProfile");
            var oData = oModel.getData();

            if (!oData.name) {
                MessageBox.error("Name is required");
                return;
            }

            // Convert selected keys back to integers
            var aAuthIds = (oData.selectedAuthObjects || []).map(function (k) { return parseInt(k, 10); });

            var oPayload = {
                name: oData.name,
                description: oData.description,
                auth_object_ids: aAuthIds
            };

            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var sUrl = "/api/admin/rol-profiles";
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
                body: JSON.stringify(oPayload)
            })
                .then(function (res) {
                    if (!res.ok) return res.json().then(function (e) { throw new Error(e.error) });
                    return res.json();
                })
                .then(function () {
                    MessageToast.show(oData.isEditMode ? "Profile updated" : "Profile created");
                    that._loadProfiles();
                    that.onCancelDialog();
                })
                .catch(function (err) {
                    MessageBox.error("Error saving profile: " + err.message);
                })
                .finally(function () { that.getView().setBusy(false); });
        },

        onDelete: function () {
            var oSelectedItem = this.byId("profilesTable").getSelectedItem();
            if (!oSelectedItem) return;

            var oProfile = oSelectedItem.getBindingContext().getObject();
            var that = this;

            MessageBox.confirm("Delete profile '" + oProfile.name + "'?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that._performDelete(oProfile.id);
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

            fetch("/api/admin/rol-profiles/" + id, {
                method: "DELETE",
                headers: oHeaders
            })
                .then(function (res) {
                    if (!res.ok) return res.json().then(function (e) { throw new Error(e.error) });
                    return res.json();
                })
                .then(function () {
                    MessageToast.show("Profile deleted");
                    that._loadProfiles();
                })
                .catch(function (err) {
                    MessageBox.error("Error deleting profile: " + err.message);
                })
                .finally(function () { that.getView().setBusy(false); });
        }
    });
});
