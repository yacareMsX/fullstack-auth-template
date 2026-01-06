sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/resource/ResourceModel"
], function (UIComponent, ResourceModel) {
    "use strict";

    return UIComponent.extend("audit.app.Component", {

        metadata: {
            manifest: "json",
            rootView: {
                "viewName": "audit.app.view.Main",
                "type": "XML",
                "async": true,
                "id": "app"
            }
        },

        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set i18n model
            var i18nModel = new ResourceModel({
                bundleName: "audit.app.i18n.i18n"
            });
            this.setModel(i18nModel, "i18n");

            // enable routing
            this.getRouter().initialize();
        }
    });
});
