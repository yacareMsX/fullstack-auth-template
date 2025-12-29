sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, MessageToast, MessageBox, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("user.management.controller.Users", {

        onInit: function () {
            var oModel = new JSONModel({
                users: [],
                roles: [
                    { key: "admin", text: "Admin" },
                    { key: "user", text: "User" },
                    { key: "dev", text: "Developer" }
                ] // Should ideally be fetched from backend
            });
            this.getView().setModel(oModel);
            this._loadUsers();
        },

        _loadUsers: function (sSearchQuery) {
            var sUrl = "/api/admin/users";
            if (sSearchQuery) {
                sUrl += "?search=" + encodeURIComponent(sSearchQuery);
            }

            // Using fetch with auth token logic (assumed global or handled via cookie/header in main app logic)
            // For now, assuming token is handled by browser cookies or interceptors if implemented. 
            // If explicit token needed: localStorage.getItem('token')

            var sToken = localStorage.getItem("auth_token");
            var oHeaders = {
                "Content-Type": "application/json"
            };
            if (sToken) {
                oHeaders["Authorization"] = "Bearer " + sToken;
            }

            var that = this;
            this.getView().setBusy(true);

            fetch(sUrl, { headers: oHeaders })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then(function (data) {
                    that.getView().getModel().setProperty("/users", data);
                })
                .catch(function (error) {
                    MessageToast.show("Error loading users: " + error.message);
                })
                .finally(function () {
                    that.getView().setBusy(false);
                });
        },

        onSearch: function () {
            var sQuery = this.byId("searchField").getValue();
            // Client-side filtering could be added here for role/status if not handled by backend search parameter extensively
            // For now, trigger backend search with the text query
            this._loadUsers(sQuery);

            // Client side filtering for exact matches like Role/Status if we want to mix modes:
            var oTable = this.byId("usersTable");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            var sRole = this.byId("roleFilter").getSelectedKey();
            if (sRole) {
                aFilters.push(new Filter("role", FilterOperator.Contains, sRole)); // Using Contains as backend role might be 'admin' vs 'Administrator' etc.
            }

            var sStatus = this.byId("statusFilter").getSelectedKey();
            if (sStatus) {
                var bActive = sStatus === "true";
                aFilters.push(new Filter("is_active", FilterOperator.EQ, bActive));
            }

            if (oBinding) {
                oBinding.filter(aFilters);
            }
        },

        onClearFilters: function () {
            this.byId("searchField").setValue("");
            this.byId("roleFilter").setSelectedKey(null);
            this.byId("statusFilter").setSelectedKey(null);
            this._loadUsers();
        },

        onSelectionChange: function (oEvent) {
            var bSelected = oEvent.getParameter("listItem").getSelected();
            this.byId("btnView").setEnabled(bSelected);
            this.byId("btnModify").setEnabled(bSelected);
            this.byId("btnBlock").setEnabled(bSelected);
            this.byId("btnUnblock").setEnabled(bSelected);
            this.byId("btnDelete").setEnabled(bSelected);

            // Context sensitive enabling (e.g. block only if active)
            if (bSelected) {
                var oContext = oEvent.getParameter("listItem").getBindingContext();
                var bActive = oContext.getProperty("is_active");
                this.byId("btnBlock").setEnabled(bActive);
                this.byId("btnUnblock").setEnabled(!bActive);
            }
        },

        onCreate: function () {
            var oView = this.getView();
            var oResourceBundle = oView.getModel("i18n").getResourceBundle();

            // Initialize new user data in a named model
            var oNewUserModel = new JSONModel({
                isEditMode: false,
                isViewMode: false,
                dialogTitle: oResourceBundle.getText("createUserTitle"),
                email: "",
                firstName: "",
                lastName: "",
                nif: "",
                role_id: "user", // Default
                phone: "",
                addressLine1: "",
                addressLine2: "",
                city: "",
                stateProvince: "",
                postalCode: "",
                country: "",
                dateOfBirth: "", /** @type {string} yyyy-MM-dd */
                bio: ""
            });
            oView.setModel(oNewUserModel, "newUser");

            this._openDialog();
        },

        _openDialog: function () {
            var oView = this.getView();
            if (!this._pDialog) {
                this._pDialog = sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "user.management.view.CreateUserDialog",
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

        onCancelUser: function () {
            // Close the dialog using the stored promise
            if (this._pDialog) {
                this._pDialog.then(function (oDialog) {
                    oDialog.close();
                });
            }
        },

        onSaveUser: function () {
            var oModel = this.getView().getModel("newUser");
            var oData = oModel.getData();

            // Basic Validation
            var aMissingFields = [];
            if (!oData.email) aMissingFields.push("Email");
            if (!oData.firstName) aMissingFields.push("Nombre");
            if (!oData.lastName) aMissingFields.push("Apellidos");
            if (!oData.nif) aMissingFields.push("NIF");
            if (!oData.role_id) aMissingFields.push("Rol");

            if (aMissingFields.length > 0) {
                MessageBox.error("Por favor rellene los siguientes campos obligatorios:: " + aMissingFields.join(", "));
                return;
            }

            var sToken = localStorage.getItem("auth_token");
            var oHeaders = {
                "Content-Type": "application/json"
            };
            if (sToken) {
                oHeaders["Authorization"] = "Bearer " + sToken;
            }

            var that = this;
            this.getView().setBusy(true);

            var sUrl = "/api/admin/users";
            var sMethod = "POST";
            if (oData.isEditMode) {
                sUrl += "/" + oData.id;
                sMethod = "PUT";
            }

            fetch(sUrl, {
                method: sMethod,
                headers: oHeaders,
                body: JSON.stringify(oData)
            })
                .then(function (res) {
                    if (!res.ok) {
                        return res.json().then(function (errData) { throw new Error(errData.error || "Operation failed"); });
                    }
                    return res.json();
                })
                .then(function (data) {
                    MessageToast.show(oData.isEditMode ? "User updated successfully" : "User created successfully");
                    that._loadUsers(); // Refresh list
                    that.onCancelUser(); // Close dialog
                })
                .catch(function (err) {
                    MessageBox.error("Error saving user: " + err.message);
                })
                .finally(function () {
                    that.getView().setBusy(false);
                });
        },

        onModify: function () {
            console.log("onModify called");
            this._openUserDialog(true, false);
        },

        onViewUser: function () {
            console.log("onViewUser called");
            this._openUserDialog(false, true);
        },

        _openUserDialog: function (bEditMode, bViewMode) {
            console.log("_openUserDialog called", bEditMode, bViewMode);
            var oTable = this.byId("usersTable");
            var oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) {
                console.error("No item selected");
                return;
            }

            var oContext = oSelectedItem.getBindingContext();
            var oUserData = oContext.getObject();
            console.log("User data:", oUserData);

            var oView = this.getView();
            var oResourceBundle = oView.getModel("i18n").getResourceBundle();

            var sTitle = bViewMode ? oResourceBundle.getText("viewUserTitle") : oResourceBundle.getText("modifyUserTitle");

            // Populate modified model
            var oNewUserModel = new JSONModel({
                isEditMode: bEditMode,
                isViewMode: bViewMode,
                dialogTitle: sTitle,
                id: oUserData.id,
                email: oUserData.email,
                firstName: oUserData.first_name,
                lastName: oUserData.last_name,
                nif: oUserData.nif,
                role_id: oUserData.role, // Backend returns role name in 'role' field
                phone: oUserData.phone,
                addressLine1: oUserData.address_line1,
                addressLine2: oUserData.address_line2,
                city: oUserData.city,
                stateProvince: oUserData.state_province,
                postalCode: oUserData.postal_code,
                country: oUserData.country,
                dateOfBirth: (function (d) {
                    if (!d) return "";
                    if (d instanceof Date) return d.toISOString().substring(0, 10);
                    if (typeof d === 'string') return d.substring(0, 10);
                    return "";
                })(oUserData.date_of_birth),
                bio: oUserData.bio
            });
            oView.setModel(oNewUserModel, "newUser");

            this._openDialog();
        },

        onBlock: function () {
            this._updateStatus(false);
        },

        onUnblock: function () {
            this._updateStatus(true);
        },

        _updateStatus: function (bActive) {
            var oTable = this.byId("usersTable");
            var oContext = oTable.getSelectedItem().getBindingContext();
            var sId = oContext.getProperty("id");

            var sToken = localStorage.getItem("auth_token");
            var oHeaders = {
                "Content-Type": "application/json"
            };
            if (sToken) {
                oHeaders["Authorization"] = "Bearer " + sToken;
            }

            var that = this;
            fetch("/api/admin/users/" + sId + "/status", {
                method: "PUT",
                headers: oHeaders,
                body: JSON.stringify({ is_active: bActive })
            })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    MessageToast.show(data.message || "Status updated");
                    that._loadUsers(); // Refresh list
                    // Reset buttons
                    that.byId("btnBlock").setEnabled(bActive);
                    that.byId("btnUnblock").setEnabled(!bActive);
                })
                .catch(function (err) {
                    MessageBox.error("Error updating status: " + err.message);
                });
        },

        onDelete: function () {
            var oTable = this.byId("usersTable");
            var oContext = oTable.getSelectedItem().getBindingContext();
            var sId = oContext.getProperty("id");
            var sEmail = oContext.getProperty("email");

            var that = this;
            MessageBox.confirm("Are you sure you want to delete user " + sEmail + "?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that._performDelete(sId);
                    }
                }
            });
        },

        _performDelete: function (sId) {
            var sToken = localStorage.getItem("token");
            var oHeaders = {
                "Content-Type": "application/json"
            };
            if (sToken) {
                oHeaders["Authorization"] = "Bearer " + sToken;
            }

            var that = this;
            fetch("/api/admin/users/" + sId, {
                method: "DELETE",
                headers: oHeaders
            })
                .then(function (res) {
                    if (!res.ok) throw new Error("Delete failed");
                    return res.json();
                })
                .then(function (data) {
                    MessageToast.show("User deleted");
                    that._loadUsers();
                })
                .catch(function (err) {
                    MessageBox.error("Error deleting user: " + err.message);
                });
        }

    });
});
