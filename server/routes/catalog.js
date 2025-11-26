const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/catalog/products - List all products
router.get('/products', authenticateToken, async (req, res) => {
    try {
        const { lang } = req.query; // Optional language filter

        let query = `
            SELECT p.*, 
                   json_agg(DISTINCT pt.*) as translations,
                   json_agg(DISTINCT pp.*) as prices,
                   i.descripcion as impuesto_descripcion,
                   i.porcentaje as impuesto_porcentaje
            FROM producto p
            LEFT JOIN producto_traduccion pt ON p.id_producto = pt.id_producto
            LEFT JOIN producto_precio pp ON p.id_producto = pp.id_producto
            LEFT JOIN impuesto i ON p.id_impuesto = i.id_impuesto
            WHERE p.activo = TRUE
        `;

        const params = [];

        if (lang) {
            // If language is specified, we might want to filter translations, 
            // but usually for a list we might want the specific translation or fallback.
            // For now, let's return all and let frontend filter, or filter in WHERE if needed.
            // Simpler to just group by product.
        }

        query += ` GROUP BY p.id_producto, i.id_impuesto ORDER BY p.creado_en DESC`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/catalog/products/:id - Get single product
router.get('/products/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT p.*, 
                   json_agg(DISTINCT pt.*) as translations,
                   json_agg(DISTINCT pp.*) as prices
            FROM producto p
            LEFT JOIN producto_traduccion pt ON p.id_producto = pt.id_producto
            LEFT JOIN producto_precio pp ON p.id_producto = pp.id_producto
            WHERE p.id_producto = $1
            GROUP BY p.id_producto
        `;

        const result = await db.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// POST /api/catalog/products - Create product
router.post('/products', authenticateToken, async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const { sku, tipo, precio_base, id_impuesto, translations, prices } = req.body;

        // 1. Insert Product
        const productResult = await client.query(
            `INSERT INTO producto (sku, tipo, precio_base, id_impuesto) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id_producto`,
            [sku, tipo, precio_base, id_impuesto]
        );
        const productId = productResult.rows[0].id_producto;

        // 2. Insert Translations
        if (translations && translations.length > 0) {
            for (const t of translations) {
                await client.query(
                    `INSERT INTO producto_traduccion (id_producto, codigo_idioma, nombre, descripcion)
                     VALUES ($1, $2, $3, $4)`,
                    [productId, t.codigo_idioma, t.nombre, t.descripcion]
                );
            }
        }

        // 3. Insert Prices
        if (prices && prices.length > 0) {
            for (const p of prices) {
                await client.query(
                    `INSERT INTO producto_precio (id_producto, codigo_pais, moneda, precio)
                     VALUES ($1, $2, $3, $4)`,
                    [productId, p.codigo_pais, p.moneda, p.precio]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Product created successfully', id: productId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating product:', err);
        if (err.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'SKU already exists' });
        }
        res.status(500).json({ error: 'Failed to create product' });
    } finally {
        client.release();
    }
});

// PUT /api/catalog/products/:id - Update product
router.put('/products/:id', authenticateToken, async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const { sku, tipo, precio_base, id_impuesto, translations, prices } = req.body;

        // 1. Update Product
        await client.query(
            `UPDATE producto 
             SET sku = $1, tipo = $2, precio_base = $3, id_impuesto = $4, actualizado_en = CURRENT_TIMESTAMP
             WHERE id_producto = $5`,
            [sku, tipo, precio_base, id_impuesto, id]
        );

        // 2. Update Translations (Delete all and recreate for simplicity, or upsert)
        // For simplicity, let's delete and recreate
        await client.query('DELETE FROM producto_traduccion WHERE id_producto = $1', [id]);
        if (translations && translations.length > 0) {
            for (const t of translations) {
                await client.query(
                    `INSERT INTO producto_traduccion (id_producto, codigo_idioma, nombre, descripcion)
                     VALUES ($1, $2, $3, $4)`,
                    [id, t.codigo_idioma, t.nombre, t.descripcion]
                );
            }
        }

        // 3. Update Prices
        await client.query('DELETE FROM producto_precio WHERE id_producto = $1', [id]);
        if (prices && prices.length > 0) {
            for (const p of prices) {
                await client.query(
                    `INSERT INTO producto_precio (id_producto, codigo_pais, moneda, precio)
                     VALUES ($1, $2, $3, $4)`,
                    [id, p.codigo_pais, p.moneda, p.precio]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating product:', err);
        res.status(500).json({ error: 'Failed to update product' });
    } finally {
        client.release();
    }
});

// DELETE /api/catalog/products/:id - Delete product
router.delete('/products/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM producto WHERE id_producto = $1', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
