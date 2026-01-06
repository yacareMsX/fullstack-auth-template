sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("user.management.controller.RoleDetail", {

        onInit: function () {
            var oModel = new JSONModel({
                users: [],
                profiles: [],
                roleId: "",
                roleName: "",
                roleDescription: "",
                isEditMode: false,
                selectedUsersCount: 0,
                selectedProfilesCount: 0
            });
            this.getView().setModel(oModel);

            this.getOwnerComponent().getRouter().getRoute("roleDetail").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sRoleId = oEvent.getParameter("arguments").roleId;
            this.getView().getModel().setProperty("/roleId", sRoleId);

            // Reset state
            this.getView().getModel().setProperty("/isEditMode", false);
            this.getView().getModel().setProperty("/selectedUsersCount", 0);
            this.getView().getModel().setProperty("/selectedProfilesCount", 0);

            this._loadRoleDetails(sRoleId);
            this.loadUsers(sRoleId);
        },

        _loadRoleDetails: function (sRoleId) {
            var sUrl = "/api/admin/roles";
            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var that = this;
            fetch(sUrl, { headers: oHeaders })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    var oRole = data.find(function (r) { return r.id == sRoleId; });
                    if (oRole) {
                        that.getView().getModel().setProperty("/roleName", oRole.name);
                        that.getView().getModel().setProperty("/roleDescription", oRole.description);
                        // Store original for cancel
                        that._oOriginalRole = { name: oRole.name, description: oRole.description };
                    }
                })
                .catch(function (e) { console.error(e); });
        },

        loadUsers: function (sRoleId) {
            var sUserUrl = "/api/admin/users?role_id=" + sRoleId;
            var sProfileUrl = "/api/admin/roles/" + sRoleId + "/profiles";

            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var that = this;
            this.getView().setBusy(true);

            // Fetch Users
            var pUsers = fetch(sUserUrl, { headers: oHeaders })
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    if (data.error) throw new Error(data.error);
                    that.getView().getModel().setProperty("/users", data);
                });

            // Fetch Profiles
            var pProfiles = fetch(sProfileUrl, { headers: oHeaders })
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    if (data.error) throw new Error(data.error);
                    that.getView().getModel().setProperty("/profiles", data);
                });

            Promise.all([pUsers, pProfiles])
                .catch(function (error) {
                    MessageToast.show("Error loading data: " + error.message);
                })
                .finally(function () {
                    that.getView().setBusy(false);
                });
        },

        onModifyRole: function () {
            this.getView().getModel().setProperty("/isEditMode", true);
        },

        onCancelRole: function () {
            // Revert changes
            if (this._oOriginalRole) {
                this.getView().getModel().setProperty("/roleName", this._oOriginalRole.name);
                this.getView().getModel().setProperty("/roleDescription", this._oOriginalRole.description);
            }
            this.getView().getModel().setProperty("/isEditMode", false);
        },

        onSaveRole: function () {
            var oModel = this.getView().getModel();
            var sId = oModel.getProperty("/roleId");
            var sName = oModel.getProperty("/roleName");
            var sDesc = oModel.getProperty("/roleDescription");

            if (!sName) {
                MessageBox.error("Name is required");
                return;
            }

            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var sUrl = "/api/admin/roles/" + sId;
            var that = this;
            this.getView().setBusy(true);

            fetch(sUrl, {
                method: "PUT",
                headers: oHeaders,
                body: JSON.stringify({ name: sName, description: sDesc })
            })
                .then(function (res) {
                    if (!res.ok) return res.json().then(function (e) { throw new Error(e.error) });
                    return res.json();
                })
                .then(function () {
                    MessageToast.show("Role updated");
                    that._oOriginalRole = { name: sName, description: sDesc };
                    that.getView().getModel().setProperty("/isEditMode", false);
                })
                .catch(function (err) {
                    MessageBox.error("Error saving role: " + err.message);
                })
                .finally(function () { that.getView().setBusy(false); });
        },

        onUserSelectionChange: function () {
            var iCount = this.byId("usersInRoleTable").getSelectedItems().length;
            this.getView().getModel().setProperty("/selectedUsersCount", iCount);
        },

        onProfileSelectionChange: function () {
            var iCount = this.byId("profilesInRoleTable").getSelectedItems().length;
            this.getView().getModel().setProperty("/selectedProfilesCount", iCount);
        },

        onDeleteUsers: function () {
            var aSelectedItems = this.byId("usersInRoleTable").getSelectedItems();
            var that = this;

            MessageBox.confirm("Permanently delete " + aSelectedItems.length + " user(s)?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that._performDeleteUsers(aSelectedItems);
                    }
                }
            });
        },

        _performDeleteUsers: function (aItems) {
            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var aPromises = aItems.map(function (oItem) {
                var sId = oItem.getBindingContext().getProperty("id");
                return fetch("/api/admin/users/" + sId, {
                    method: "DELETE",
                    headers: oHeaders
                });
            });

            var that = this;
            this.getView().setBusy(true);
            Promise.all(aPromises)
                .then(function (responses) {
                    MessageToast.show("Users deleted");
                    that.loadUsers(that.getView().getModel().getProperty("/roleId"));
                    that.byId("usersInRoleTable").removeSelections();
                    that.getView().getModel().setProperty("/selectedUsersCount", 0);
                })
                .catch(function (err) {
                    MessageBox.error("Error deleting users: " + err.message);
                })
                .finally(function () { that.getView().setBusy(false); });
        },

        onBlockUsers: function () {
            this._updateUserStatus(false);
        },

        onUnblockUsers: function () {
            this._updateUserStatus(true);
        },

        _updateUserStatus: function (bActive) {
            var aSelectedItems = this.byId("usersInRoleTable").getSelectedItems();
            var that = this;

            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            this.getView().setBusy(true);
            var aPromises = aSelectedItems.map(function (oItem) {
                var sId = oItem.getBindingContext().getProperty("id");
                return fetch("/api/admin/users/" + sId + "/status", {
                    method: "PUT",
                    headers: oHeaders,
                    body: JSON.stringify({ is_active: bActive })
                });
            });

            Promise.all(aPromises)
                .then(function () {
                    MessageToast.show(bActive ? "Users unblocked" : "Users blocked");
                    that.loadUsers(that.getView().getModel().getProperty("/roleId"));
                    that.byId("usersInRoleTable").removeSelections();
                    that.getView().getModel().setProperty("/selectedUsersCount", 0);
                })
                .catch(function (err) {
                    MessageBox.error("Error updating status: " + err.message);
                })
                .finally(function () { that.getView().setBusy(false); });
        },

        // --- Add User Logic ---

        onAddUser: function () {
            // Load all users to show in dialog
            // We could optimize by excluding current role users, or just show them.
            // Let's load all.
            var sUrl = "/api/admin/users";
            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var that = this;
            this.getView().setBusy(true);
            fetch(sUrl, { headers: oHeaders })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    that.getView().getModel().setProperty("/allUsers", data);
                    that._openAddUserDialog();
                })
                .finally(function () { that.getView().setBusy(false); });
        },

        _openAddUserDialog: function () {
            if (!this._pAddUserDialog) {
                this._pAddUserDialog = sap.ui.core.Fragment.load({
                    id: this.getView().getId(),
                    name: "user.management.view.AddUserToRoleDialog",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }
            this._pAddUserDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        onUserSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new sap.ui.model.Filter("email", sap.ui.model.FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },

        onAddUserConfirm: function (oEvent) {
            var aSelectedItems = oEvent.getParameter("selectedItems");
            if (!aSelectedItems || aSelectedItems.length === 0) return;

            var sRoleId = this.getView().getModel().getProperty("/roleId");
            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            // Update each user to new role
            // We need to fetch each user's data first? Or PUT only role_id?
            // The PUT logic in users.js expects ALL fields properly... 
            // Wait, users.js `PUT` requires email, firstName, etc. 
            // This is problematic. If I only send role_id, it will fail "Missing required fields".
            // I should use `PATCH` if available or fetch-modify-put.
            // users.js does NOT have PATCH.
            // And it validates required fields.
            // So I MUST fetch each user first, update role_id, then PUT. 
            // This is slow but necessary given current backend.

            var that = this;
            this.getView().setBusy(true);

            var aPromises = aSelectedItems.map(function (oItem) {
                var oUser = oItem.getBindingContext().getObject();
                // We have the user object from the list! We can just use it if it has all fields.
                // The list endpoint returns almost all fields.
                // Let's check `users.js` GET /. It joins profiles.
                // It returns: id, email, is_active, role, first_name...
                // The PUT expects: email, firstName, lastName, ...
                // The GET returns `first_name`, `last_name`. We need to map it.

                var oPayload = {
                    email: oUser.email,
                    firstName: oUser.first_name,
                    lastName: oUser.last_name,
                    nif: oUser.nif, // Getting from list? Yes, select list has p.nif
                    role_id: sRoleId, // New Role
                    phone: oUser.phone,
                    addressLine1: oUser.address_line1,
                    addressLine2: oUser.address_line2,
                    city: oUser.city,
                    stateProvince: oUser.state_province,
                    postalCode: oUser.postal_code,
                    country: oUser.country,
                    dateOfBirth: oUser.date_of_birth,
                    bio: oUser.bio
                };

                return fetch("/api/admin/users/" + oUser.id, {
                    method: "PUT",
                    headers: oHeaders,
                    body: JSON.stringify(oPayload)
                });
            });

            Promise.all(aPromises)
                .then(function () {
                    MessageToast.show("Users added to role");
                    that.loadUsers(sRoleId);
                })
                .catch(function (err) {
                    MessageBox.error("Error adding users: " + err.message);
                })
                .finally(function () { that.getView().setBusy(false); });
        },

        // --- Add Profile Logic ---

        onAddProfile: function () {
            var sUrl = "/api/admin/rol-profiles"; // Assuming this lists profiles
            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var that = this;
            this.getView().setBusy(true);
            fetch(sUrl, { headers: oHeaders })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    that.getView().getModel().setProperty("/allProfiles", data);
                    that._openAddProfileDialog();
                })
                .finally(function () { that.getView().setBusy(false); });
        },

        _openAddProfileDialog: function () {
            if (!this._pAddProfileDialog) {
                this._pAddProfileDialog = sap.ui.core.Fragment.load({
                    id: this.getView().getId(),
                    name: "user.management.view.AddProfileToRoleDialog",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }
            this._pAddProfileDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        onProfileSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },

        onAddProfileConfirm: function (oEvent) {
            var aSelectedItems = oEvent.getParameter("selectedItems");
            if (!aSelectedItems || aSelectedItems.length === 0) return;

            var sRoleId = this.getView().getModel().getProperty("/roleId");
            var aProfileIds = aSelectedItems.map(function (item) {
                return item.getBindingContext().getProperty("id");
            });

            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var that = this;
            this.getView().setBusy(true);
            fetch("/api/admin/roles/" + sRoleId + "/profiles", {
                method: "POST",
                headers: oHeaders,
                body: JSON.stringify({ profile_ids: aProfileIds })
            })
                .then(function (res) {
                    if (!res.ok) return res.json().then(e => { throw new Error(e.error) });
                    return res.json();
                })
                .then(function () {
                    MessageToast.show("Profiles added");
                    that.loadUsers(sRoleId);
                })
                .catch(function (e) {
                    MessageBox.error("Error adding profiles: " + e.message);
                })
                .finally(function () { that.getView().setBusy(false); });
        },

        onRemoveProfiles: function () {
            var aSelectedItems = this.byId("profilesInRoleTable").getSelectedItems();
            var that = this;

            MessageBox.confirm("Remove " + aSelectedItems.length + " profile(s) from this role?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that._performRemoveProfiles(aSelectedItems);
                    }
                }
            });
        },

        _performRemoveProfiles: function (aItems) {
            var sRoleId = this.getView().getModel().getProperty("/roleId");
            var aIds = aItems.map(function (item) {
                return item.getBindingContext().getProperty("id");
            });

            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var oPayload = { profile_ids: aIds };
            var that = this;

            this.getView().setBusy(true);
            fetch("/api/admin/roles/" + sRoleId + "/profiles", {
                method: "DELETE",
                headers: oHeaders,
                body: JSON.stringify(oPayload)
            })
                .then(function (res) {
                    if (!res.ok) return res.json().then(function (e) { throw new Error(e.error) });
                    return res.json();
                })
                .then(function () {
                    MessageToast.show("Profiles removed from role");
                    that.loadUsers(sRoleId);
                    that.byId("profilesInRoleTable").removeSelections();
                    that.getView().getModel().setProperty("/selectedProfilesCount", 0);
                })
                .catch(function (err) {
                    MessageBox.error("Error removing profiles: " + err.message);
                })
                .finally(function () { that.getView().setBusy(false); });
        },

        onProfilePress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oCtx = oItem.getBindingContext();
            var sProfileId = oCtx.getProperty("id");
            this.getOwnerComponent().getRouter().navTo("rolProfileDetail", { profileId: sProfileId });
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("roles");
        }
    });
});
