sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Simulates scanning a file and extracting invoice data
         * @param {File} file - The file to scan
         * @returns {Promise} Resolves with extracted invoice data
         */
        scan: function (file) {
            return new Promise(function (resolve, reject) {
                // Simulate processing delay
                setTimeout(function () {
                    // Generate random data
                    var oData = {
                        numero: "INV-" + Math.floor(Math.random() * 10000),
                        fecha_emision: new Date().toISOString().split('T')[0],
                        emisor_nombre: "Proveedor Ejemplo S.L.",
                        emisor_nif: "B12345678",
                        emisor_direccion: "Calle Falsa 123, Madrid",
                        subtotal: 100.00,
                        impuestos_totales: 21.00,
                        total: 121.00,
                        lineas: [
                            {
                                descripcion: "Servicios Profesionales",
                                cantidad: 1,
                                precio_unitario: 100.00,
                                porcentaje_impuesto: 21,
                                total_linea: 100.00
                            }
                        ]
                    };
                    resolve(oData);
                }, 2000); // 2 seconds delay
            });
        }
    };
});
