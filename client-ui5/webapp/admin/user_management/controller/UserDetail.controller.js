sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, History, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("user.management.controller.UserDetail", {

        onInit: function () {
            var oModel = new JSONModel({
                isViewMode: true,
                dialogTitle: "Detalle de Usuario",
                email: "",
                firstName: "",
                lastName: "",
                // ... initialize other fields if needed
            });
            this.getView().setModel(oModel, "newUser");

            // Define roles model
            var oDefaultModel = new JSONModel({
                roles: []
            });
            this.getView().setModel(oDefaultModel);
            this._loadRoles();

            this.getOwnerComponent().getRouter().getRoute("userDetail").attachPatternMatched(this._onRouteMatched, this);
        },

        _loadRoles: function () {
            var sUrl = "/api/admin/roles";
            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var that = this;
            fetch(sUrl, { headers: oHeaders })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (Array.isArray(data)) {
                        that.getView().getModel().setProperty("/roles", data);
                    }
                })
                .catch(function (err) {
                    console.error("Error loading roles:", err);
                });
        },

        _onRouteMatched: function (oEvent) {
            var sUserId = oEvent.getParameter("arguments").userId;
            this._loadUser(sUserId);
        },

        _loadUser: function (sUserId) {
            var sUrl = "/api/admin/users/" + sUserId;
            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var that = this;
            this.getView().setBusy(true);

            fetch(sUrl, { headers: oHeaders })
                .then(function (res) {
                    if (!res.ok) throw new Error("Failed to load user");
                    return res.json();
                })
                .then(function (oUserData) {
                    that.displayUser(oUserData);
                })
                .catch(function (err) {
                    MessageToast.show("Error loading user: " + err.message);
                })
                .finally(function () {
                    that.getView().setBusy(false);
                });
        },

        displayUser: function (oUserData) {
            var oModel = this.getView().getModel("newUser");
            // Store original data
            this._oOriginalData = JSON.parse(JSON.stringify(oUserData));

            var oFormData = this._mapUserDataToForm(oUserData);
            oModel.setData(oFormData);
        },

        _mapUserDataToForm: function (oUserData) {
            var parseDate = function (d) {
                if (!d) return null;
                var date = new Date(d);
                return isNaN(date.getTime()) ? null : date;
            };

            var oFormData = {
                isViewMode: true,
                dialogTitle: "Detalle de Usuario",
                id: oUserData.id,
                email: oUserData.email,
                role_id: oUserData.role_id || oUserData.role,
                firstName: oUserData.first_name,
                lastName: oUserData.last_name,
                nif: oUserData.nif,
                phone: oUserData.phone,
                addressLine1: oUserData.address_line1,
                addressLine2: oUserData.address_line2,
                city: oUserData.city,
                stateProvince: oUserData.state_province,
                postalCode: oUserData.postal_code,
                country: oUserData.country,
                bio: oUserData.bio,
                is_active: oUserData.is_active,
                dateOfBirth: parseDate(oUserData.date_of_birth)
            };

            if (oFormData.role_id) oFormData.role_id = String(oFormData.role_id);
            return oFormData;
        },

        onModify: function () {
            this.getView().getModel("newUser").setProperty("/isViewMode", false);
        },

        onCancel: function () {
            if (this._oOriginalData) {
                var oFormData = this._mapUserDataToForm(this._oOriginalData);
                this.getView().getModel("newUser").setData(oFormData);
            }
            this.getView().getModel("newUser").setProperty("/isViewMode", true);
        },

        onSave: function () {
            var oModel = this.getView().getModel("newUser");
            var oData = oModel.getData();

            var aMissingFields = [];
            if (!oData.email) aMissingFields.push("Email");
            if (!oData.firstName) aMissingFields.push("Nombre");
            if (!oData.lastName) aMissingFields.push("Apellidos");
            if (!oData.nif) aMissingFields.push("NIF");
            if (!oData.role_id) aMissingFields.push("Rol");

            if (aMissingFields.length > 0) {
                MessageBox.error("Por favor rellene los siguientes campos obligatorios: " + aMissingFields.join(", "));
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

            // API expects camelCase to match the destructuring in users.js
            var oPayload = {
                email: oData.email,
                firstName: oData.firstName,
                lastName: oData.lastName,
                nif: oData.nif,
                role_id: oData.role_id,
                phone: oData.phone,
                addressLine1: oData.addressLine1,
                addressLine2: oData.addressLine2,
                city: oData.city,
                stateProvince: oData.stateProvince,
                postalCode: oData.postalCode,
                country: oData.country,
                bio: oData.bio,
                dateOfBirth: oData.dateOfBirth
            };

            fetch("/api/admin/users/" + oData.id, {
                method: "PUT",
                headers: oHeaders,
                body: JSON.stringify(oPayload)
            })
                .then(function (res) {
                    if (!res.ok) {
                        return res.json().then(function (errData) { throw new Error(errData.error || "Operation failed"); });
                    }
                    return res.json();
                })
                .then(function (data) {
                    MessageToast.show("Usuario actualizado correctamente");
                    that.getView().getModel("newUser").setProperty("/isViewMode", true);
                    that._refreshMasterList();
                })
                .catch(function (err) {
                    MessageBox.error("Error actualizando usuario: " + err.message);
                })
                .finally(function () {
                    that.getView().setBusy(false);
                });
        },

        _refreshMasterList: function () {
            // Since we are using router now, we might not have easy access to the master controller instance via SplitApp logic
            // But if we want to refresh the list, we can just assume the list will be refreshed when the user navigates back 
            // OR we can trigger a refresh if we have a global model. 
            // For now, let's keep it simple. If we really need to refresh the list in the previous view, we can use EventBus.

            // Re-implementing basic SplitApp check just in case, but likely not needed with Router nav
            /*
            var oSplitApp = this._getSplitApp();
            if (oSplitApp) {
                var oMaster = oSplitApp.getMasterPages()[0];
                if (oMaster && oMaster.getController()._loadUsers) {
                    oMaster.getController()._loadUsers();
                }
            }
            */
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("users");
        },

        _getSplitApp: function () {
            var oView = this.getView();
            var oParent = oView.getParent();
            while (oParent && !oParent.isA("sap.m.SplitApp")) {
                oParent = oParent.getParent();
            }
            return oParent;
        }
    });
});
