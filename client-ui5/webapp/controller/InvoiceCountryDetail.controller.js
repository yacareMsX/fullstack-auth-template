sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("invoice.app.controller.InvoiceCountryDetail", {

        onInit: function () {
            this._oRouter = this.getOwnerComponent().getRouter();
            var oRoute;
            try {
                oRoute = this._oRouter.getRoute("invoiceCountryDetail");
            } catch (e) { console.error(e); }

            if (oRoute) {
                oRoute.attachPatternMatched(this._onRouteMatched, this);
            } else {
                console.warn("Route 'invoiceCountryDetail' not found. This view might be running standalone or route is missing.");
            }

            var oViewModel = new JSONModel({
                isNew: true,
                title: ""
            });
            this.getView().setModel(oViewModel, "detailView");
        },

        _onRouteMatched: function (oEvent) {
            var sCountryId = oEvent.getParameter("arguments").countryId;
            var oViewModel = this.getView().getModel("detailView");
            var oModel = new JSONModel();

            if (sCountryId === "new") {
                oViewModel.setProperty("/isNew", true);
                oViewModel.setProperty("/title", this.getResourceBundle().getText("createCountry"));
                oModel.setData({
                    pais: "",
                    region: ""
                });
                this.getView().setModel(oModel, "invoiceCountry");
            } else {
                oViewModel.setProperty("/isNew", false);
                oViewModel.setProperty("/title", this.getResourceBundle().getText("editCountry"));
                oModel.loadData("/api/invoice-countries/" + sCountryId);
                this.getView().setModel(oModel, "invoiceCountry");
            }
        },

        onSave: function () {
            var oModel = this.getView().getModel("invoiceCountry");
            var oData = oModel.getData();
            var oViewModel = this.getView().getModel("detailView");
            var bIsNew = oViewModel.getProperty("/isNew");
            var sUrl = "/api/invoice-countries";
            var sMethod = "POST";

            if (!oData.pais) {
                MessageToast.show(this.getResourceBundle().getText("fillRequiredFields"));
                return;
            }

            if (!bIsNew) {
                sUrl += "/" + oData.id;
                sMethod = "PUT";
            }

            fetch(sUrl, {
                method: sMethod,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(oData)
            })
                .then(response => {
                    if (response.ok) {
                        MessageToast.show(this.getResourceBundle().getText("saveSuccess"));
                        this.onNavBack();
                    } else {
                        response.json().then(data => {
                            MessageBox.error(data.error || "Error saving country");
                        });
                    }
                })
                .catch(err => {
                    MessageBox.error("Network error");
                });
        },

        onDelete: function () {
            var oModel = this.getView().getModel("invoiceCountry");
            var sId = oModel.getProperty("/id");
            var that = this;

            MessageBox.confirm(this.getResourceBundle().getText("confirmDelete"), {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        fetch("/api/invoice-countries/" + sId, {
                            method: "DELETE"
                        })
                            .then(response => {
                                if (response.ok) {
                                    MessageToast.show(that.getResourceBundle().getText("deleteSuccess"));
                                    that.onNavBack();
                                } else {
                                    MessageBox.error("Error deleting country");
                                }
                            })
                            .catch(err => {
                                MessageBox.error("Network error");
                            });
                    }
                }
            });
        },

        onNavBack: function () {
            this._oRouter.navTo("invoiceCountryList");
        },

        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        }
    });
});
