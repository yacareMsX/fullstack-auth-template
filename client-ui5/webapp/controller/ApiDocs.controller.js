sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("invoice.app.controller.ApiDocs", {
        onNavBack: function () {
            window.history.go(-1);
        }
    });
});
