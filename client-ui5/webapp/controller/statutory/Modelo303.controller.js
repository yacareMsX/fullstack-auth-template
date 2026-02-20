sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/routing/History"
], function (Controller, JSONModel, MessageToast, History) {
    "use strict";

    return Controller.extend("invoice.app.controller.statutory.Modelo303", {
        onInit: function () {
            var oViewModel = new JSONModel({
                year: "2025",
                period: "1T",
                nif: "",
                companyName: "",
                devengado_general: [
                    { base: 0, rate: 21, quota: 0 },
                    { base: 0, rate: 10, quota: 0 },
                    { base: 0, rate: 4, quota: 0 }
                ],
                recargo_equivalencia: [
                    { base: 0, rate: 5.2, quota: 0 },
                    { base: 0, rate: 1.4, quota: 0 }
                ],
                recargo_mod_base: 0,
                recargo_mod_quota: 0,
                devengado_intra_base: 0,
                total_devengado: 0,
                deducible_interior_base: 0,
                deducible_interior_quota: 0,
                deducible_intra_base: 0,
                deducible_intra_quota: 0,
                deducible_import_base: 0,
                deducible_import_quota: 0,
                deducible_assets_base: 0,
                deducible_assets_quota: 0,
                total_deducible: 0,
                result_difference: 0,
                prev_period_result: 0,
                final_result: 0,
                chk_sii: false,
                chk_criterion: false,
                chk_bankruptcy: false
            });
            this.getView().setModel(oViewModel, "modelo303");

            // Check if we need to load data (future implementation: load by query param)
            this._loadData("303", "2025", "1T");
        },

        _loadData: function (sModelType, sYear, sPeriod) {
            var sToken = localStorage.getItem("auth_token");
            if (!sToken) return;

            // Fetch existing model (assuming 1st one found is active)
            fetch(`/api/statutory/models?model_type=${sModelType}&year=${sYear}&period=${sPeriod}`, {
                headers: { "Authorization": "Bearer " + sToken }
            })
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        var oModelData = data[0].data;
                        // Merge loaded data into the model
                        this.getView().getModel("modelo303").setData(oModelData);
                        MessageToast.show("Datos cargados correctamente");
                    }
                })
                .catch(err => console.error("Error loading model:", err));
        },

        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("home", {}, true);
            }
        },

        onSave: function () {
            var oModel = this.getView().getModel("modelo303");
            var oData = oModel.getData();
            var sToken = localStorage.getItem("auth_token");

            // Prepare payload for JSONB column
            var oPayload = {
                model_type: "303",
                year: oData.year,
                period: oData.period,
                status: "DRAFT",
                data: oData
            };

            fetch("/api/statutory/models", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + sToken
                },
                body: JSON.stringify(oPayload)
            })
                .then(function (response) {
                    if (response.ok) {
                        MessageToast.show("Modelo 303 Guardado correctamente");
                    } else {
                        MessageToast.show("Error al guardar el Modelo");
                    }
                })
                .catch(function (error) {
                    MessageToast.show("Error de conexión");
                    console.error(error);
                });
        }
    });
});
