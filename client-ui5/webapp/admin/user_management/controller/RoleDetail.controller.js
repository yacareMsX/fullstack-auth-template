sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, JSONModel) {
    "use strict";

    return Controller.extend("user.management.controller.RoleDetail", {

        onInit: function () {
            var oModel = new JSONModel({
                users: [],
                roleName: ""
            });
            this.getView().setModel(oModel);
        },

        loadUsers: function (sRoleId, sRoleName) {
            this.getView().getModel().setProperty("/roleName", sRoleName);

            var sUrl = "/api/admin/users?role_id=" + sRoleId;

            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var that = this;
            this.getView().setBusy(true);

            fetch(sUrl, { headers: oHeaders })
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    if (data.error) throw new Error(data.error);
                    that.getView().getModel().setProperty("/users", data);
                })
                .catch(function (error) {
                    MessageToast.show("Error loading users: " + error.message);
                })
                .finally(function () {
                    that.getView().setBusy(false);
                });
        },

        onNavBack: function () {
            // Navigate back to Roles view
            var oSplitApp = this._getSplitApp();
            if (!oSplitApp) {
                MessageToast.show("Error: Navigation container not found.");
                return;
            }

            // Find Roles view by ID suffix
            var aDetails = oSplitApp.getDetailPages();
            var oRolesPage = aDetails.find(function (p) {
                return p.getId().indexOf("rolesDetail") > -1;
            });

            if (oRolesPage) {
                oSplitApp.toDetail(oRolesPage);
            }
        },

        _getSplitApp: function () {
            var oControl = this.getView();
            while (oControl) {
                if (oControl.getDetailPages && oControl.toDetail) {
                    return oControl;
                }
                oControl = oControl.getParent();
            }
            return null;
        }

    });
});
