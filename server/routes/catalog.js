const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');
const router = express.Router();

// Get all products (with translations for a specific language)
router.get('/products', authenticateToken, async (req, res) => {
    try {
        const { lang = 'en', limit = 50, offset = 0, search } = req.query;

        let query = `
            SELECT p.*, 
                   pt.nombre, pt.descripcion,
                   i.codigo as impuesto_codigo, i.porcentaje as impuesto_porcentaje
            FROM producto p
            LEFT JOIN producto_traduccion pt ON p.id_producto = pt.id_producto AND pt.codigo_idioma = $1
            LEFT JOIN impuesto i ON p.id_impuesto = i.id_impuesto
            WHERE p.activo = true
        `;
        const params = [lang];
        let paramCount = 2;

        if (search) {
            query += ` AND (p.sku ILIKE $${paramCount} OR pt.nombre ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        query += ` ORDER BY p.creado_en DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get product by ID
router.get('/products/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get base product
        const productResult = await db.query(
            `SELECT p.*, i.codigo as impuesto_codigo 
             FROM producto p
             LEFT JOIN impuesto i ON p.id_impuesto = i.id_impuesto
             WHERE p.id_producto = $1`,
            [id]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = productResult.rows[0];

        // Get translations
        const translationsResult = await db.query(
            'SELECT * FROM producto_traduccion WHERE id_producto = $1',
            [id]
        );
        product.translations = translationsResult.rows;

        // Get prices
        const pricesResult = await db.query(
            'SELECT * FROM producto_precio WHERE id_producto = $1',
            [id]
        );
        product.prices = pricesResult.rows;

        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create product
router.post('/products', authenticateToken, async (req, res) => {
    console.log('[GENERIC DEBUG] POST /api/catalog/products called');
    const client = await db.pool.connect();
    try {
        const { sku, tipo, precio_base, id_impuesto, translations, prices } = req.body;

        await client.query('BEGIN');

        // Insert product
        const productResult = await client.query(
            `INSERT INTO producto (sku, tipo, precio_base, id_impuesto)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [sku, tipo, precio_base, id_impuesto]
        );
        const product = productResult.rows[0];

        // Insert translations
        if (translations && translations.length > 0) {
            for (const t of translations) {
                await client.query(
                    `INSERT INTO producto_traduccion (id_producto, codigo_idioma, nombre, descripcion)
                     VALUES ($1, $2, $3, $4)`,
                    [product.id_producto, t.codigo_idioma, t.nombre, t.descripcion]
                );
            }
        }

        // Insert prices
        if (prices && prices.length > 0) {
            for (const p of prices) {
                await client.query(
                    `INSERT INTO producto_precio (id_producto, codigo_pais, moneda, precio)
                     VALUES ($1, $2, $3, $4)`,
                    [product.id_producto, p.codigo_pais, p.moneda, p.precio]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(product);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating product:', error);
        if (error.constraint === 'producto_sku_key') {
            return res.status(409).json({ error: 'SKU already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Update product
router.put('/products/:id', authenticateToken, async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id } = req.params;
        const { sku, tipo, precio_base, id_impuesto, translations, prices, activo } = req.body;

        await client.query('BEGIN');

        // Update base product
        const productResult = await client.query(
            `UPDATE producto 
             SET sku = COALESCE($1, sku),
                 tipo = COALESCE($2, tipo),
                 precio_base = COALESCE($3, precio_base),
                 id_impuesto = COALESCE($4, id_impuesto),
                 activo = COALESCE($5, activo),
                 actualizado_en = CURRENT_TIMESTAMP
             WHERE id_producto = $6
             RETURNING *`,
            [sku, tipo, precio_base, id_impuesto, activo, id]
        );

        if (productResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }

        // Update translations (Full replace strategy for simplicity, or upsert)
        // For now, let's delete and recreate to handle removals easily
        if (translations) {
            await client.query('DELETE FROM producto_traduccion WHERE id_producto = $1', [id]);
            for (const t of translations) {
                await client.query(
                    `INSERT INTO producto_traduccion (id_producto, codigo_idioma, nombre, descripcion)
                     VALUES ($1, $2, $3, $4)`,
                    [id, t.codigo_idioma, t.nombre, t.descripcion]
                );
            }
        }

        // Update prices
        if (prices) {
            await client.query('DELETE FROM producto_precio WHERE id_producto = $1', [id]);
            for (const p of prices) {
                await client.query(
                    `INSERT INTO producto_precio (id_producto, codigo_pais, moneda, precio)
                     VALUES ($1, $2, $3, $4)`,
                    [id, p.codigo_pais, p.moneda, p.precio]
                );
            }
        }

        await client.query('COMMIT');
        res.json(productResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

// Delete product (Soft delete preferred, but hard delete implemented for admin)
router.delete('/products/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        // Due to CASCADE, this will delete translations and prices too
        const result = await db.query('DELETE FROM producto WHERE id_producto = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
