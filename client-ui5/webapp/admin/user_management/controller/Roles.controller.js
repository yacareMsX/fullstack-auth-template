sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, MessageToast, MessageBox, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("user.management.controller.Roles", {

        onInit: function () {
            var oModel = new JSONModel({
                roles: []
            });
            this.getView().setModel(oModel);
            this._loadRoles();
        },

        _loadRoles: function (sSearchQuery) {
            var sUrl = "/api/admin/roles";
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
                    that.getView().getModel().setProperty("/roles", data);
                })
                .catch(function (error) {
                    MessageToast.show("Error loading roles: " + error.message);
                })
                .finally(function () { that.getView().setBusy(false); });
        },

        onSearch: function () {
            var sQuery = this.byId("searchField").getValue();
            this._loadRoles(sQuery);
        },

        onClearFilters: function () {
            this.byId("searchField").setValue("");
            this._loadRoles();
        },

        onSelectionChange: function (oEvent) {
            var bSelected = oEvent.getParameter("listItem").getSelected();
            this.byId("btnModify").setEnabled(bSelected);
            this.byId("btnDelete").setEnabled(bSelected);
        },

        onItemPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oContext = oItem.getBindingContext();
            var oRole = oContext.getObject();

            var oSplitApp = this._getSplitApp();
            if (!oSplitApp) {
                MessageToast.show("Error: Navigation container not found.");
                return;
            }

            // Find RoleDetail view by ID suffix
            var aDetails = oSplitApp.getDetailPages();
            var oDetailView = aDetails.find(function (v) {
                return v.getId().indexOf("roleDetailInfo") > -1;
            });

            if (oDetailView) {
                oSplitApp.toDetail(oDetailView);
                // Load data in detail view
                if (oDetailView.getController() && oDetailView.getController().loadUsers) {
                    oDetailView.getController().loadUsers(oRole.id, oRole.name);
                }
            }
        },

        _getSplitApp: function () {
            var oControl = this.getView();
            while (oControl && oControl.getMetadata().getName() !== "sap.m.SplitApp") {
                oControl = oControl.getParent();
            }
            return oControl;
        },

        onCreate: function () {
            this._openRoleDialog(false, false);
        },

        onModify: function () {
            this._openRoleDialog(true, false);
        },



        _openRoleDialog: function (bEditMode, bViewMode) {
            var oView = this.getView();
            var oResourceBundle = oView.getModel("i18n").getResourceBundle();

            var sTitle = oResourceBundle.getText("createRoleTitle");
            var oRoleData = { name: "", description: "" };

            if (bEditMode || bViewMode) {
                var oSelectedItem = this.byId("rolesTable").getSelectedItem();
                if (!oSelectedItem) return;
                oRoleData = oSelectedItem.getBindingContext().getObject();
                sTitle = bViewMode ? oResourceBundle.getText("viewRoleTitle") : oResourceBundle.getText("modifyRoleTitle");
            }

            var oNewRoleModel = new JSONModel({
                isEditMode: bEditMode,
                isViewMode: bViewMode,
                dialogTitle: sTitle,
                id: oRoleData.id,
                name: oRoleData.name,
                description: oRoleData.description
            });
            oView.setModel(oNewRoleModel, "newRole");

            if (!this._pDialog) {
                this._pDialog = sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "user.management.view.CreateRoleDialog",
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

        onCancelRole: function () {
            this._pDialog.then(function (oDialog) { oDialog.close(); });
        },

        onSaveRole: function () {
            var oModel = this.getView().getModel("newRole");
            var oData = oModel.getData();

            if (!oData.name) {
                MessageBox.error("Name is required");
                return;
            }

            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var sUrl = "/api/admin/roles";
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
                    MessageToast.show(oData.isEditMode ? "Role updated" : "Role created");
                    that._loadRoles();
                    that.onCancelRole();
                })
                .catch(function (err) {
                    MessageBox.error("Error saving role: " + err.message);
                })
                .finally(function () { that.getView().setBusy(false); });
        },

        onDelete: function () {
            var oSelectedItem = this.byId("rolesTable").getSelectedItem();
            if (!oSelectedItem) return;

            var oRole = oSelectedItem.getBindingContext().getObject();
            var that = this;

            MessageBox.confirm("Delete role '" + oRole.name + "'?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that._performDelete(oRole.id);
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

            fetch("/api/admin/roles/" + id, {
                method: "DELETE",
                headers: oHeaders
            })
                .then(function (res) {
                    if (!res.ok) return res.json().then(function (e) { throw new Error(e.error) });
                    return res.json();
                })
                .then(function () {
                    MessageToast.show("Role deleted");
                    that._loadRoles();
                })
                .catch(function (err) {
                    MessageBox.error("Error deleting role: " + err.message);
                })
                .finally(function () { that.getView().setBusy(false); });
        }

    });
});
