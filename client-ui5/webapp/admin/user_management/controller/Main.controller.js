sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("user.management.controller.Main", {

        onInit: function () {
            // UI Model
            var oUIModel = new sap.ui.model.json.JSONModel({
                themeIcon: "sap-icon://show"
            });
            this.getView().setModel(oUIModel, "ui");

            this._initTheme();
            this._handleDeepLink();
        },

        _handleDeepLink: function () {
            // Check for 'section' query parameter
            var oParams = new URLSearchParams(window.location.search);
            var sSection = oParams.get("section");

            if (sSection) {
                // Set selected item in sidebar
                var oToolPage = this.byId("toolPage");
                // Note: SideNavigation is in sideContent aggregation. 
                // Since we didn't give it an ID, we access it via aggregation getter if possible or just assume logic works
                // But setting selected key is good relevant to UX.
                var oSideNav = oToolPage.getSideContent();
                if (oSideNav) {
                    oSideNav.setSelectedKey(sSection);

                    // Manually handle selection if needed, but we also want to trigger navigation
                    this._navToSection(sSection);
                }
            }
        },

        _initTheme: function () {
            var sTheme = localStorage.getItem("theme");
            if (!sTheme) {
                sTheme = "sap_horizon";
            }
            sap.ui.getCore().applyTheme(sTheme);
            this._updateThemeIcon(sTheme);
        },

        onThemeToggle: function () {
            var sCurrentTheme = sap.ui.getCore().getConfiguration().getTheme();
            var sNewTheme = (sCurrentTheme === "sap_horizon_dark") ? "sap_horizon" : "sap_horizon_dark";

            sap.ui.getCore().applyTheme(sNewTheme);
            localStorage.setItem("theme", sNewTheme);
            this._updateThemeIcon(sNewTheme);
        },

        _updateThemeIcon: function (sTheme) {
            if (sTheme === "sap_horizon_dark") {
                this.getView().getModel("ui").setProperty("/themeIcon", "sap-icon://light-mode");
            } else {
                this.getView().getModel("ui").setProperty("/themeIcon", "sap-icon://palette");
            }
        },

        onNavHome: function () {
            window.location.href = "../../index.html";
        },

        onMenuPress: function () {
            // Optional: Toggle sidebar if we wanted to support collapsing the SplitApp master
        },

        onItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            var sKey = oItem.getKey();
            this._navToSection(sKey);
        },

        _navToSection: function (sKey) {
            var oNavContainer = this.byId("userMgmtNavContainer");

            if (sKey === "users") {
                oNavContainer.to(this.createId("usersDetail"));
            } else if (sKey === "roles") {
                oNavContainer.to(this.createId("rolesDetail"));
            } else if (sKey === "auth") {
                oNavContainer.to(this.createId("authDetail"));
            } else if (sKey === "profiles") {
                oNavContainer.to(this.createId("profilesDetail"));
            } else if (sKey === "countries") {
                oNavContainer.to(this.createId("countriesDetail"));
            } else {
                // If it's a group header or other item without specific handler
                if (sKey) {
                    oNavContainer.to(this.createId("detailUnderConstruction"));
                    MessageToast.show("Opción seleccionada: " + sKey + ". Funcionalidad en construcción.");
                }
            }
        }
    });
});
