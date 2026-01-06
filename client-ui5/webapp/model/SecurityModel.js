sap.ui.define([
    "sap/ui/model/json/JSONModel"
], function (JSONModel) {
    "use strict";

    return JSONModel.extend("user.management.model.SecurityModel", {

        constructor: function () {
            JSONModel.call(this, {});
            this.loadFromStorage();
        },

        loadFromStorage: function () {
            var sPermissions = localStorage.getItem("permissions");
            console.log("[SecurityModel] Loading from storage:", sPermissions);
            if (sPermissions) {
                try {
                    var aPermissions = JSON.parse(sPermissions);
                    this.setPermissions(aPermissions);
                } catch (e) {
                    console.error("Failed to parse permissions", e);
                    this.setData({});
                }
            } else {
                console.warn("[SecurityModel] No permissions found in storage");
                this.setData({});
            }
        },

        setPermissions: function (aPermissions) {
            var oData = {};
            if (Array.isArray(aPermissions)) {
                aPermissions.forEach(function (sCode) {
                    oData[sCode] = true;
                });
            }
            this.setData(oData);
            localStorage.setItem("permissions", JSON.stringify(aPermissions));
        },

        hasPermission: function (sCode) {
            return !!this.getProperty("/" + sCode);
        },

        clearRequest: function () {
            this.setData({});
            localStorage.removeItem("permissions");
        }
    });
});
