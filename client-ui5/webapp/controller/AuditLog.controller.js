sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "../model/formatter"
], function (Controller, JSONModel, MessageToast, formatter) {
    "use strict";

    return Controller.extend("invoice.app.controller.AuditLog", {
        formatter: formatter,

        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("auditLog").attachPatternMatched(this._onRouteMatched, this);

            var oModel = new JSONModel();
            this.getView().setModel(oModel, "audit");
        },

        _onRouteMatched: function () {
            this._loadLogs();
        },

        _loadLogs: function () {
            var oView = this.getView();
            var oModel = oView.getModel("audit");

            // Get filters
            var sAction = oView.byId("actionFilter").getValue();
            var sUserId = oView.byId("userFilter").getValue();
            var oDateRange = oView.byId("dateFilter");
            var sStartDate = oDateRange.getDateValue() ? this._formatDate(oDateRange.getDateValue()) : null;
            var sEndDate = oDateRange.getSecondDateValue() ? this._formatDate(oDateRange.getSecondDateValue()) : null;

            var sUrl = "/api/audit?limit=100";
            if (sAction) sUrl += "&action=" + encodeURIComponent(sAction);
            if (sUserId) sUrl += "&userId=" + encodeURIComponent(sUserId);
            if (sStartDate) sUrl += "&startDate=" + sStartDate;
            if (sEndDate) sUrl += "&endDate=" + sEndDate;

            oView.setBusy(true);
            jQuery.ajax({
                url: sUrl,
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("auth_token")
                },
                success: function (data) {
                    oModel.setData(data);
                    oView.setBusy(false);
                },
                error: function (err) {
                    oView.setBusy(false);
                    console.error("Error fetching audit logs", err);
                    MessageToast.show("Failed to load audit logs");
                    if (err.status === 401 || err.status === 403) {
                        sap.ui.core.UIComponent.getRouterFor(this).navTo("login");
                    }
                }.bind(this)
            });
        },

        onSearch: function () {
            this._loadLogs();
        },

        onRefresh: function () {
            this._loadLogs();
        },

        onNavBack: function () {
            var sAppId = this.getOwnerComponent().getManifestEntry("sap.app").id;

            // If running in standalone Audit app
            if (sAppId === "audit.app") {
                window.location.href = "../../index.html";
            } else {
                // If running in Main app
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("dashboard");
            }
        },

        _formatDate: function (oDate) {
            var oFormat = sap.ui.core.format.DateFormat.getInstance({ pattern: "yyyy-MM-dd" });
            return oFormat.format(oDate);
        }
    });
});
