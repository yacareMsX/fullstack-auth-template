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

            console.log("[Login] Attempting login for:", sEmail);

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
                    console.log("[Login] Response status:", response.status);
                    if (!response.ok) {
                        return response.json().then(function (errData) {
                            throw new Error(errData.error || "Invalid credentials");
                        });
                    }
                    return response.json();
                })
                .then(function (data) {
                    console.log("[Login] Success data received:", data);
                    // Save token and user info
                    localStorage.setItem("auth_token", data.token);
                    localStorage.setItem("auth_user", JSON.stringify(data.user));
                    localStorage.setItem("permissions", JSON.stringify(data.user.permissions || []));

                    oModel.setProperty("/loading", false);

                    // Redirect to main application
                    console.log("[Login] Redirecting to index.html#/");
                    window.location.href = "index.html#/";
                })
                .catch(function (error) {
                    console.error("[Login] Login error:", error);
                    oModel.setProperty("/loading", false);
                    oModel.setProperty("/error", true);
                    oModel.setProperty("/errorMessage", error.message || "Invalid email or password");
                });
        }
    });
});
