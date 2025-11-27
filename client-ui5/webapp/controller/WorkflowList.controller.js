sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, JSONModel, MessageToast, MessageBox, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("invoice.app.controller.WorkflowList", {

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("workflowList").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._loadWorkflows();
        },

        _loadWorkflows: function () {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("/api/workflows", {
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(res => res.json())
                .then(data => {
                    var oModel = new JSONModel(data);
                    that.getView().setModel(oModel, "workflows");
                })
                .catch(err => {
                    console.error("Error loading workflows:", err);
                    MessageToast.show("Error loading workflows");
                });
        },

        onCreateWorkflow: function () {
            this.getOwnerComponent().getRouter().navTo("workflowNew");
        },

        onWorkflowPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var sPath = oItem.getBindingContext("workflows").getPath();
            var oWorkflow = this.getView().getModel("workflows").getProperty(sPath);

            this.getOwnerComponent().getRouter().navTo("workflowDesigner", {
                workflowId: oWorkflow.id
            });
        },

        onEditWorkflow: function (oEvent) {
            // Prevent navigation from row press
            // oEvent.preventDefault(); 
            // Actually, row press handles navigation, this button is redundant for navigation but good for explicit action
            // We can just let row press handle it or implement specific edit logic (like metadata edit dialog)
            // For now, let's just navigate to designer
            var oItem = oEvent.getSource().getParent().getParent();
            var sPath = oItem.getBindingContext("workflows").getPath();
            var oWorkflow = this.getView().getModel("workflows").getProperty(sPath);

            this.getOwnerComponent().getRouter().navTo("workflowDesigner", {
                workflowId: oWorkflow.id
            });
        },

        onDeleteWorkflow: function (oEvent) {
            var that = this;
            var oItem = oEvent.getSource().getParent().getParent();
            var sPath = oItem.getBindingContext("workflows").getPath();
            var oWorkflow = this.getView().getModel("workflows").getProperty(sPath);
            var sToken = localStorage.getItem("auth_token");

            MessageBox.confirm("Are you sure you want to delete this workflow?", {
                onClose: function (sAction) {
                    if (sAction === "OK") {
                        fetch("/api/workflows/" + oWorkflow.id, {
                            method: "DELETE",
                            headers: { "Authorization": "Bearer " + sToken }
                        })
                            .then(res => {
                                if (res.ok) {
                                    MessageToast.show("Workflow deleted");
                                    that._loadWorkflows();
                                } else {
                                    MessageToast.show("Error deleting workflow");
                                }
                            })
                            .catch(err => {
                                console.error("Error deleting workflow:", err);
                                MessageToast.show("Error deleting workflow");
                            });
                    }
                }
            });
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oFilter = new Filter("name", FilterOperator.Contains, sQuery);
            var oBinding = this.getView().byId("workflowTable").getBinding("items");
            oBinding.filter([oFilter]);
        }
    });
});
