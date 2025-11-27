sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Formats invoice status to ObjectStatus state
         * @param {string} sStatus - Invoice status
         * @returns {string} - ObjectStatus state
         */
        statusState: function (sStatus) {
            var mStatusState = {
                "BORRADOR": "None",
                "EMITIDA": "Information",
                "ENVIADA": "Information",
                "FIRMADA": "Success",
                "REGISTRADA": "Success",
                "RECHAZADA": "Error",
                "PAGADA": "Success",
                "CANCELADA": "Error"
            };
            return mStatusState[sStatus] || "None";
        },

        /**
         * Formats currency value
         * @param {number} fValue - Currency value
         * @returns {string} - Formatted currency
         */
        currency: function (fValue) {
            if (!fValue) {
                return "0,00 €";
            }
            return new Intl.NumberFormat("es-ES", {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(fValue);
        },

        /**
         * Formats currency value without symbol
         * @param {number} fValue - Currency value
         * @returns {string} - Formatted currency
         */
        currencyValue: function (fValue) {
            if (!fValue) {
                return "0,00";
            }
            return new Intl.NumberFormat("es-ES", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(fValue);
        },

        /**
         * Formats number value (integer)
         * @param {number} fValue - Number value
         * @returns {string} - Formatted number
         */
        number: function (fValue) {
            if (!fValue) {
                return "0";
            }
            return new Intl.NumberFormat("es-ES").format(fValue);
        },

        /**
         * Formats origin description to icon URI
         * @param {string} sOrigin - Origin description
         * @returns {string} - Icon URI
         */
        originIcon: function (sOrigin) {
            if (!sOrigin) {
                return "sap-icon://document";
            }

            var sUpperOrigin = sOrigin.toUpperCase();

            if (sUpperOrigin.includes("MANUAL")) {
                return "sap-icon://edit";
            } else if (sUpperOrigin.includes("OCR") || sUpperOrigin.includes("SCAN")) {
                return "sap-icon://camera";
            } else if (sUpperOrigin.includes("EMAIL") || sUpperOrigin.includes("CORREO")) {
                return "sap-icon://email";
            } else if (sUpperOrigin.includes("API")) {
                return "sap-icon://api";
            } else if (sUpperOrigin.includes("IMPORT")) {
                return "sap-icon://upload";
            }

            return "sap-icon://document";
        },

        /**
         * Formats catalog product name based on current language
         * @param {string} sSku - Product SKU (fallback)
         * @param {array} aTranslations - Array of translations
         * @returns {string} - Localized name
         */
        catalogName: function (sSku, aTranslations) {
            if (aTranslations && aTranslations.length > 0) {
                var sLang = sap.ui.getCore().getConfiguration().getLanguage().split("-")[0];
                var oTrans = aTranslations.find(function (t) { return t.codigo_idioma === sLang; });
                if (oTrans) {
                    return oTrans.nombre;
                }
                // Fallback to English
                oTrans = aTranslations.find(function (t) { return t.codigo_idioma === "en"; });
                if (oTrans) {
                    return oTrans.nombre;
                }
                // Fallback to first
                return aTranslations[0].nombre;
            }
            return sSku;
        },

        /**
         * Formats catalog price
         * @param {string} fPrice - Base price
         * @returns {string} - Formatted price
         */
        catalogPrice: function (fPrice) {
            return parseFloat(fPrice).toFixed(2);
        },

        /**
         * Formats audit action to state
         * @param {string} sAction - Action name
         * @returns {string} - State
         */
        auditState: function (sAction) {
            if (!sAction) return "None";
            if (sAction.includes("LOGIN")) return "Success";
            if (sAction.includes("CREATE")) return "Success";
            if (sAction.includes("UPDATE")) return "Warning";
            if (sAction.includes("DELETE")) return "Error";
            if (sAction.includes("SCAN")) return "Information";
            return "None";
        },

        /**
         * Stringifies JSON object for display
         * @param {object} oDetails - Details object
         * @returns {string} - Stringified details
         */
        jsonStringify: function (oDetails) {
            if (!oDetails) return "";
            try {
                return JSON.stringify(oDetails, null, 2);
            } catch (e) {
                return String(oDetails);
            }
        },

        /**
         * Formats date string to locale string
         * @param {string} sDate - Date string
         * @returns {string} - Formatted date
         */
        formatDate: function (sDate) {
            if (!sDate) return "";
            var oDate = new Date(sDate);
            var oFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({ style: "medium" });
            return oFormat.format(oDate);
        },

        /**
         * Formats product name, falling back to SKU
         * @param {string} sName - Product name
         * @param {string} sSku - Product SKU
         * @returns {string} - Formatted name
         */
        productName: function (sName, sSku) {
            return sName || sSku;
        }
    };
});
