sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageBox) {
    "use strict";

    return Controller.extend("invoice.app.controller.Login", {

        onInit: function () {
            var oViewModel = new JSONModel({
                email: "",
                password: "",
                loading: false,
                error: false,
                errorMessage: ""
            });
            this.getView().setModel(oViewModel, "login");
        },

        onLogin: function () {
            var oModel = this.getView().getModel("login");
            var sEmail = oModel.getProperty("/email");
            var sPassword = oModel.getProperty("/password");

            // Validation
            if (!sEmail || !sPassword) {
                oModel.setProperty("/error", true);
                oModel.setProperty("/errorMessage", "Please enter email and password");
                return;
            }

            // Reset error
            oModel.setProperty("/error", false);
            oModel.setProperty("/loading", true);

            var that = this;

            fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: sEmail,
                    password: sPassword
                })
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Invalid credentials");
                    }
                    return response.json();
                })
                .then(function (data) {
                    // Save token and user info
                    localStorage.setItem("auth_token", data.token);
                    localStorage.setItem("auth_user", JSON.stringify(data.user));

                    oModel.setProperty("/loading", false);

                    // Redirect to main application
                    window.location.href = "index.html#/";
                })
                .catch(function (error) {
                    console.error("Login error:", error);
                    oModel.setProperty("/loading", false);
                    oModel.setProperty("/error", true);
                    oModel.setProperty("/errorMessage", "Invalid email or password");
                });
        }
    });
});
