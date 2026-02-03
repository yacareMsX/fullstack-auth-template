const db = require('../db');

async function updateInvoices() {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Find invoices with numero length > 20
        const res = await client.query("SELECT id_factura, numero FROM factura WHERE LENGTH(numero) > 20");
        console.log(`Found ${res.rows.length} invoices to update.`);

        for (const row of res.rows) {
            const oldNum = row.numero;
            // Expected format: INV-ISUE-000000000044 (21 chars)
            // Goal: INV-ISUE-00000000044 (20 chars)
            // Logic: Replace first occurrence of '00' with '0' inside the sequence part?
            // Safer: split by prefix.
            // Prefix len: 9 (INV-ISUE-)
            // Sequence part: chars 9 to end.

            let newNum = oldNum;
            if (oldNum.startsWith('INV-ISUE-')) {
                const prefix = 'INV-ISUE-';
                const seq = oldNum.substring(prefix.length);
                // If seq starts with '0', remove one '0'.
                if (seq.startsWith('0')) {
                    newNum = prefix + seq.substring(1);
                }
            } else if (oldNum.startsWith('INV-FR-')) { // Check other prefix if any
                const prefix = 'INV-FR-';
                const seq = oldNum.substring(prefix.length);
                if (seq.startsWith('0')) {
                    newNum = prefix + seq.substring(1);
                }
            }

            if (newNum !== oldNum && newNum.length <= 20) {
                console.log(`Updating ${oldNum} -> ${newNum}`);
                await client.query("UPDATE factura SET numero = $1 WHERE id_factura = $2", [newNum, row.id_factura]);
            } else {
                console.log(`Skipping ${oldNum} (could not shorten or unknown format)`);
            }
        }

        await client.query('COMMIT');
        console.log("Update complete.");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error updating invoices:", err);
    } finally {
        client.release();
        process.exit();
    }
}

updateInvoices();
