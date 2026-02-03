sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageBox, MessageToast, Fragment) {
    "use strict";

    return Controller.extend("invoice.app.controller.DocumentationXml", {
        onInit: function () {
            console.log("DocumentationXml Controller Initialized"); // Debug log
            this.getView().setModel(new JSONModel([]), "doc");
            this.getView().setModel(new JSONModel({}), "view"); // For UI state like enabled buttons
            this._loadData();
        },

        _loadData: function () {
            fetch("/api/documentation-xml")
                .then(res => res.json())
                .then(data => {
                    console.log("Data loaded:", data); // Debug log
                    this.getView().getModel("doc").setData(data);
                })
                .catch(err => {
                    console.error(err);
                    MessageToast.show("Error loading data");
                });
        },

        onSelectionChange: function (oEvent) {
            console.log("onSelectionChange triggered"); // Debug log
            const oSelectedItem = oEvent.getParameter("listItem");
            this.getView().getModel("view").setProperty("/selectedItem", !!oSelectedItem);
        },

        onItemPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oCtx = oItem.getBindingContext("doc");
            var sId = oCtx.getProperty("id");
            console.log("onItemPress triggered. ID:", sId); // Debug log
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("documentationDetail", {
                id: sId
            });
        },

        onDialogCreate: function () {
            if (!this._oDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "invoice.app.view.fragments.DocumentationXmlCreate",
                    controller: this
                }).then(oDialog => {
                    this._oDialog = oDialog;
                    this.getView().addDependent(this._oDialog);
                    this._openDialog();
                });
            } else {
                this._openDialog();
            }
        },

        _openDialog: function () {
            // Reset model
            this.getView().setModel(new JSONModel({
                nombre_objeto: "",
                tipo_estructura: "",
                formato: "",
                descripcion: ""
            }), "newDoc");
            this._oDialog.open();
        },

        onDialogCancel: function () {
            this._oDialog.close();
        },

        onSubmitCreate: function () {
            const oData = this.getView().getModel("newDoc").getData();

            // Basic validation
            if (!oData.nombre_objeto || !oData.tipo_estructura || !oData.formato || !oData.descripcion) {
                MessageBox.error("Por favor rellene todos los campos.");
                return;
            }

            fetch("/api/documentation-xml", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(oData)
            })
                .then(res => {
                    if (!res.ok) throw new Error("Error creating entry");
                    return res.json();
                })
                .then(() => {
                    MessageToast.show("Creado correctamente");
                    this._oDialog.close();
                    this._loadData();
                })
                .catch(err => {
                    MessageBox.error("Error al crear: " + err.message);
                });
        },

        onDialogDelete: function () {
            const oTable = this.byId("documentationTable");
            const oSelectedItem = oTable.getSelectedItem();

            if (!oSelectedItem) return;

            const oContext = oSelectedItem.getBindingContext("doc");
            const oData = oContext.getObject();

            MessageBox.confirm(`¿Estás seguro de que quieres borrar "${oData.nombre_objeto}"?`, {
                onClose: (sAction) => {
                    if (sAction === "OK") {
                        this._deleteEntry(oData.id);
                    }
                }
            });
        },

        _deleteEntry: function (id) {
            fetch(`/api/documentation-xml/${id}`, {
                method: "DELETE"
            })
                .then(res => {
                    if (!res.ok) throw new Error("Error deleting");
                    return res.json();
                })
                .then(() => {
                    MessageToast.show("Borrado correctamente");
                    this.getView().getModel("view").setProperty("/selectedItem", false);
                    this._loadData();
                })
                .catch(err => {
                    MessageBox.error("Error al borrar: " + err.message);
                });
        }
    });
});
