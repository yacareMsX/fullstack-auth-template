sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("user.management.controller.RolProfileDetail", {

        onInit: function () {
            var oModel = new JSONModel({
                id: "",
                name: "",
                description: "",
                auth_objects: []
            });
            this.getView().setModel(oModel, "profile");

            this.getOwnerComponent().getRouter().getRoute("rolProfileDetail").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sProfileId = oEvent.getParameter("arguments").profileId;
            this._loadProfile(sProfileId);
        },

        _loadProfile: function (sId) {
            var sUrl = "/api/admin/rol-profiles/" + sId;
            var sToken = localStorage.getItem("auth_token");
            var oHeaders = { "Content-Type": "application/json" };
            if (sToken) oHeaders["Authorization"] = "Bearer " + sToken;

            var that = this;
            this.getView().setBusy(true);

            fetch(sUrl, { headers: oHeaders })
                .then(function (res) {
                    if (!res.ok) throw new Error("Failed to load profile");
                    return res.json();
                })
                .then(function (data) {
                    that.getView().getModel("profile").setData(data);
                })
                .catch(function (err) {
                    MessageToast.show("Error loading profile: " + err.message);
                })
                .finally(function () {
                    that.getView().setBusy(false);
                });
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("profiles");
        }
    });
});
