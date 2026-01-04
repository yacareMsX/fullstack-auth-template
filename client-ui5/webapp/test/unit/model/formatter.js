sap.ui.define([
    "invoice/app/model/formatter",
    "sap/ui/core/format/NumberFormat"
], function (formatter, NumberFormat) {
    "use strict";

    QUnit.module("Formatting functions");

    QUnit.test("Should format invoice status to state", function (assert) {
        assert.strictEqual(formatter.statusState("BORRADOR"), "None", "The state for status BORRADOR is correct");
        assert.strictEqual(formatter.statusState("FIRMADA"), "Success", "The state for status FIRMADA is correct");
        assert.strictEqual(formatter.statusState("RECHAZADA"), "Error", "The state for status RECHAZADA is correct");
        assert.strictEqual(formatter.statusState("UNKNOWN"), "None", "The state for unknown status is None");
    });

    QUnit.test("Should format currency values correctly", function (assert) {
        // Mock Intl.NumberFormat if not available in phantomjs/headless environments (optional, usually present in modern browsers)
        var sResult = formatter.currency(1234.56);
        // Note: The specific output depends on the locale 'es-ES'. 
        // We check for the presence of the currency symbol and the value.
        assert.ok(sResult.indexOf("1.234,56") !== -1, "The number part is formatted correctly: " + sResult);
        assert.ok(sResult.indexOf("€") !== -1, "The currency symbol is present");

        assert.strictEqual(formatter.currency(null), "0,00 €", "Null value returns 0,00 €");
    });

    QUnit.test("Should return correct icon for origin", function (assert) {
        assert.strictEqual(formatter.originIcon("MANUAL_ENTRY"), "sap-icon://edit", "Correct icon for MANUAL");
        assert.strictEqual(formatter.originIcon("SCAN_OCR"), "sap-icon://camera", "Correct icon for OCR/SCAN");
        assert.strictEqual(formatter.originIcon("EMAIL_IMPORT"), "sap-icon://email", "Correct icon for EMAIL");
        assert.strictEqual(formatter.originIcon("UNKNOWN_SOURCE"), "sap-icon://document", "Fallback icon for unknown source");
    });

    QUnit.test("Should format audit actions to state", function (assert) {
        assert.strictEqual(formatter.auditState("USER_LOGIN"), "Success", "Login is Success");
        assert.strictEqual(formatter.auditState("INVOICE_DELETE"), "Error", "Delete is Error");
        assert.strictEqual(formatter.auditState("ITEM_UPDATE"), "Warning", "Update is Warning");
    });

});
