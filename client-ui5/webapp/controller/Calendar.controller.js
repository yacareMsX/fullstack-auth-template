sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("invoice.app.controller.Calendar", {

        onInit: function () {
            var oModel = new JSONModel();
            oModel.setData({
                startDate: new Date("2026-02-01"),
                appointments: [
                    {
                        title: "Joule: Planned Maintenance",
                        text: "System Update",
                        type: "Type06",
                        icon: "sap-icon://appointment",
                        startDate: new Date("2026-02-07T00:00:00"),
                        endDate: new Date("2026-02-07T23:59:59")
                    },
                    {
                        title: "SAP Extension Suite - Dev",
                        text: "Development",
                        type: "Type01", // Success
                        icon: "sap-icon://wrench",
                        startDate: new Date("2026-02-14T09:00:00"),
                        endDate: new Date("2026-02-14T11:00:00")
                    },
                    {
                        title: "Target Date",
                        text: "Project Milestone",
                        type: "Type08", // Success/Purple
                        startDate: new Date("2026-02-18T00:00:00"),
                        endDate: new Date("2026-02-18T23:59:59")
                    },
                    {
                        title: "Review Meeting",
                        text: "Weekly Sync",
                        type: "Type03",
                        startDate: new Date("2026-02-18T14:00:00"),
                        endDate: new Date("2026-02-18T15:00:00")
                    }
                ]
            });
            this.getView().setModel(oModel);
        },

        onTabSelect: function (oEvent) {
            var sKey = oEvent.getParameter("item").getKey();
            sap.m.MessageToast.show("Selected tab: " + sKey);
        }

    });
});
