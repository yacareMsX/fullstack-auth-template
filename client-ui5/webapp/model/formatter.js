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
                return "0.00";
            }
            return parseFloat(fValue).toFixed(2);
        }
    };
});
