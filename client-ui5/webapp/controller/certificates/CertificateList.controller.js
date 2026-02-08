sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("invoice.app.controller.certificates.CertificateList", {

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            var oRouteList = oRouter.getRoute("certificateList");
            if (oRouteList) {
                oRouteList.attachPatternMatched(this._onRouteMatched, this);
            }

            var oRouteLayout = oRouter.getRoute("certificateLayout");
            if (oRouteLayout) {
                oRouteLayout.attachPatternMatched(this._onRouteMatched, this);
            }
        },

        _onRouteMatched: function () {
            this._loadCertificates();
            this._clearSelection();
        },

        _loadCertificates: function () {
            var that = this;
            var sToken = localStorage.getItem("auth_token");

            fetch("/api/certificates", {
                headers: {
                    "Authorization": "Bearer " + sToken
                }
            })
                .then(function (response) {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error("Failed to fetch certificates");
                    }
                })
                .then(function (data) {
                    var oModel = new JSONModel(data);
                    that.getView().setModel(oModel, "certificates");
                })
                .catch(function (error) {
                    MessageToast.show("Error loading certificates: " + error.message);
                });
        },

        _clearSelection: function () {
            var oTable = this.byId("certificatesTable");
            oTable.removeSelections(true);
            this._updateButtons(null);
        },

        onSelectionChange: function (oEvent) {
            var oListItem = oEvent.getParameter("listItem");
            this._updateButtons(oListItem);
        },

        _updateButtons: function (oListItem) {
            var bSelected = !!oListItem;
            this.byId("btnUpdate").setEnabled(bSelected);
            this.byId("btnDelete").setEnabled(bSelected);
            this.byId("btnActivate").setEnabled(bSelected);
            this.byId("btnDeactivate").setEnabled(bSelected);
        },

        onItemPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext("certificates");
            var sId = oContext.getProperty("id");
            this.getOwnerComponent().getRouter().navTo("certificateDetail", { id: sId });
        },

        onCreate: function () {
            this.getOwnerComponent().getRouter().navTo("certificateDetail", { id: "new" });
        },

        onUpdate: function () {
            var oTable = this.byId("certificatesTable");
            var oSelectedItem = oTable.getSelectedItem();
            if (oSelectedItem) {
                var sId = oSelectedItem.getBindingContext("certificates").getProperty("id");
                this.getOwnerComponent().getRouter().navTo("certificateDetail", { id: sId });
            }
        },

        onDelete: function () {
            var oTable = this.byId("certificatesTable");
            var oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) return;

            var sId = oSelectedItem.getBindingContext("certificates").getProperty("id");
            var that = this;

            MessageBox.confirm("¿Estás seguro de que quieres borrar este certificado?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        that._performDelete(sId);
                    }
                }
            });
        },

        _performDelete: function (sId) {
            var sToken = localStorage.getItem("auth_token");
            var that = this;
            fetch("/api/certificates/" + sId, {
                method: "DELETE",
                headers: {
                    "Authorization": "Bearer " + sToken
                }
            })
                .then(function (response) {
                    if (response.ok) {
                        MessageToast.show("Certificado borrado");
                        that._loadCertificates();
                        that._clearSelection();
                    } else {
                        MessageToast.show("Error al borrar");
                    }
                });
        },

        onActivate: function () {
            this._updateStatus(true);
        },

        onDeactivate: function () {
            this._updateStatus(false);
        },

        _updateStatus: function (bActive) {
            var oTable = this.byId("certificatesTable");
            var oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) return;

            var sId = oSelectedItem.getBindingContext("certificates").getProperty("id");
            var sToken = localStorage.getItem("auth_token");
            var that = this;

            fetch("/api/certificates/" + sId + "/active", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + sToken
                },
                body: JSON.stringify({ active: bActive })
            })
                .then(function (response) {
                    if (response.ok) {
                        MessageToast.show(bActive ? "Certificado activado" : "Certificado desactivado");
                        that._loadCertificates();
                    } else {
                        MessageToast.show("Error al actualizar estado");
                    }
                });
        }
    });
});
