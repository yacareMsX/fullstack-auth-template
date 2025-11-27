sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Generates the AutoFirma invocation URL
         * @param {string} sXmlContent - The XML content to sign
         * @returns {string} The afirma:// URL
         */
        getSignUrl: function (sXmlContent) {
            // 0. Minify XML (remove whitespace) to reduce URL length
            var sMinifiedXml = sXmlContent.replace(/>\s+</g, "><").trim();

            // 1. Convert XML to Base64
            var sBase64Xml = btoa(unescape(encodeURIComponent(sMinifiedXml)));

            // 2. Construct the parameter object
            // Important: Put 'dat' last to avoid issues if JSON is parsed sequentially or logged
            var oParams = {
                op: "sign",
                alg: "SHA256withRSA",
                format: "XAdES",
                properties: "mode=implicit",
                dat: sBase64Xml
            };

            // 3. Convert params to JSON and then to Base64
            var sJsonParams = JSON.stringify(oParams);
            var sBase64Params = btoa(sJsonParams);

            // 4. Construct final URL (MUST URL-encode the Base64 string)
            return "afirma://sign?params=" + encodeURIComponent(sBase64Params);
        }
    };
});
