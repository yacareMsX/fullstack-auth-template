const db = require('../db');

const products = [
    {
        sku: 'HW-LAP-001',
        tipo: 'PRODUCTO',
        precio_base: 1200.00,
        en: { nombre: 'High-Performance Laptop', descripcion: '16GB RAM, 512GB SSD, i7 Processor' },
        es: { nombre: 'Portátil de Alto Rendimiento', descripcion: '16GB RAM, 512GB SSD, Procesador i7' }
    },
    {
        sku: 'HW-MON-002',
        tipo: 'PRODUCTO',
        precio_base: 300.00,
        en: { nombre: '27-inch 4K Monitor', descripcion: 'IPS Panel, 60Hz, HDMI/DP' },
        es: { nombre: 'Monitor 4K de 27 pulgadas', descripcion: 'Panel IPS, 60Hz, HDMI/DP' }
    },
    {
        sku: 'HW-KEY-003',
        tipo: 'PRODUCTO',
        precio_base: 150.00,
        en: { nombre: 'Mechanical Keyboard', descripcion: 'RGB Backlit, Cherry MX Blue Switches' },
        es: { nombre: 'Teclado Mecánico', descripcion: 'Retroiluminación RGB, Switches Cherry MX Blue' }
    },
    {
        sku: 'HW-MOU-004',
        tipo: 'PRODUCTO',
        precio_base: 80.00,
        en: { nombre: 'Wireless Ergonomic Mouse', descripcion: 'High precision, long battery life' },
        es: { nombre: 'Ratón Ergonómico Inalámbrico', descripcion: 'Alta precisión, larga duración de batería' }
    },
    {
        sku: 'HW-HDD-005',
        tipo: 'PRODUCTO',
        precio_base: 100.00,
        en: { nombre: 'External Hard Drive 2TB', descripcion: 'USB 3.0, Portable' },
        es: { nombre: 'Disco Duro Externo 2TB', descripcion: 'USB 3.0, Portátil' }
    },
    {
        sku: 'HW-CAM-006',
        tipo: 'PRODUCTO',
        precio_base: 120.00,
        en: { nombre: 'HD Webcam 1080p', descripcion: 'With built-in microphone' },
        es: { nombre: 'Cámara Web HD 1080p', descripcion: 'Con micrófono integrado' }
    },
    {
        sku: 'HW-HEA-007',
        tipo: 'PRODUCTO',
        precio_base: 200.00,
        en: { nombre: 'Noise Cancelling Headphones', descripcion: 'Bluetooth 5.0, 30h battery' },
        es: { nombre: 'Auriculares con Cancelación de Ruido', descripcion: 'Bluetooth 5.0, 30h batería' }
    },
    {
        sku: 'HW-DOC-008',
        tipo: 'PRODUCTO',
        precio_base: 180.00,
        en: { nombre: 'USB-C Docking Station', descripcion: 'HDMI, Ethernet, USB 3.0 ports' },
        es: { nombre: 'Estación de Acoplamiento USB-C', descripcion: 'Puertos HDMI, Ethernet, USB 3.0' }
    },
    {
        sku: 'HW-TAB-009',
        tipo: 'PRODUCTO',
        precio_base: 600.00,
        en: { nombre: 'Tablet Pro 11"', descripcion: '128GB, Wi-Fi' },
        es: { nombre: 'Tablet Pro 11"', descripcion: '128GB, Wi-Fi' }
    },
    {
        sku: 'HW-PRT-010',
        tipo: 'PRODUCTO',
        precio_base: 400.00,
        en: { nombre: 'Laser Printer Color', descripcion: 'Wireless, Duplex printing' },
        es: { nombre: 'Impresora Láser Color', descripcion: 'Inalámbrica, Impresión a doble cara' }
    }
];

const services = [
    {
        sku: 'SRV-CON-001',
        tipo: 'SERVICIO',
        precio_base: 100.00,
        en: { nombre: 'IT Consulting (Hourly)', descripcion: 'General technology consultation' },
        es: { nombre: 'Consultoría TI (Por hora)', descripcion: 'Consulta tecnológica general' }
    },
    {
        sku: 'SRV-DEV-002',
        tipo: 'SERVICIO',
        precio_base: 150.00,
        en: { nombre: 'Software Development (Hourly)', descripcion: 'Custom software development' },
        es: { nombre: 'Desarrollo de Software (Por hora)', descripcion: 'Desarrollo de software a medida' }
    },
    {
        sku: 'SRV-AUD-003',
        tipo: 'SERVICIO',
        precio_base: 1200.00,
        en: { nombre: 'Security Audit', descripcion: 'Comprehensive system security review' },
        es: { nombre: 'Auditoría de Seguridad', descripcion: 'Revisión completa de seguridad del sistema' }
    },
    {
        sku: 'SRV-MNT-004',
        tipo: 'SERVICIO',
        precio_base: 500.00,
        en: { nombre: 'Monthly Maintenance Plan', descripcion: 'Server and infrastructure maintenance' },
        es: { nombre: 'Plan de Mantenimiento Mensual', descripcion: 'Mantenimiento de servidores e infraestructura' }
    },
    {
        sku: 'SRV-CLD-005',
        tipo: 'SERVICIO',
        precio_base: 2000.00,
        en: { nombre: 'Cloud Migration', descripcion: 'Migration of on-premise systems to cloud' },
        es: { nombre: 'Migración a la Nube', descripcion: 'Migración de sistemas locales a la nube' }
    },
    {
        sku: 'SRV-TRA-006',
        tipo: 'SERVICIO',
        precio_base: 800.00,
        en: { nombre: 'Staff Training Session', descripcion: 'Cybersecurity awareness training' },
        es: { nombre: 'Sesión de Formación de Personal', descripcion: 'Formación en concienciación sobre ciberseguridad' }
    },
    {
        sku: 'SRV-SEO-007',
        tipo: 'SERVICIO',
        precio_base: 600.00,
        en: { nombre: 'SEO Optimization Package', descripcion: 'Website SEO analysis and improvements' },
        es: { nombre: 'Paquete de Optimización SEO', descripcion: 'Análisis y mejoras SEO para sitios web' }
    },
    {
        sku: 'SRV-DBA-008',
        tipo: 'SERVICIO',
        precio_base: 130.00,
        en: { nombre: 'Database Administration (Hourly)', descripcion: 'Performance tuning and management' },
        es: { nombre: 'Administración de Base de Datos (Por hora)', descripcion: 'Ajuste de rendimiento y gestión' }
    },
    {
        sku: 'SRV-NET-009',
        tipo: 'SERVICIO',
        precio_base: 110.00,
        en: { nombre: 'Network Configuration (Hourly)', descripcion: 'Setup and troubleshooting' },
        es: { nombre: 'Configuración de Red (Por hora)', descripcion: 'Instalación y resolución de problemas' }
    },
    {
        sku: 'SRV-REC-010',
        tipo: 'SERVICIO',
        precio_base: 1500.00,
        en: { nombre: 'Data Recovery Service', descripcion: 'Recovery from damaged storage media' },
        es: { nombre: 'Servicio de Recuperación de Datos', descripcion: 'Recuperación de medios de almacenamiento dañados' }
    }
];

async function seedCatalog() {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Get Tax ID (IVA 21%)
        const taxRes = await client.query("SELECT id_impuesto FROM impuesto WHERE codigo = 'IVA21'");
        let taxId = null;
        if (taxRes.rows.length > 0) {
            taxId = taxRes.rows[0].id_impuesto;
        } else {
            console.log('Warning: IVA21 tax not found. Products will be created without tax.');
        }

        const allItems = [...products, ...services];

        for (const item of allItems) {
            console.log(`Creating ${item.sku}...`);

            // Insert Product
            const prodRes = await client.query(
                `INSERT INTO producto (sku, tipo, precio_base, id_impuesto) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (sku) DO UPDATE SET precio_base = EXCLUDED.precio_base
                 RETURNING id_producto`,
                [item.sku, item.tipo, item.precio_base, taxId]
            );
            const productId = prodRes.rows[0].id_producto;

            // Insert Translations (Delete existing first to avoid duplicates/conflicts on re-run)
            await client.query('DELETE FROM producto_traduccion WHERE id_producto = $1', [productId]);

            await client.query(
                `INSERT INTO producto_traduccion (id_producto, codigo_idioma, nombre, descripcion)
                 VALUES ($1, 'en', $2, $3), ($1, 'es', $4, $5)`,
                [productId, item.en.nombre, item.en.descripcion, item.es.nombre, item.es.descripcion]
            );

            // Insert Price (EUR)
            await client.query('DELETE FROM producto_precio WHERE id_producto = $1', [productId]);
            await client.query(
                `INSERT INTO producto_precio (id_producto, codigo_pais, moneda, precio)
                 VALUES ($1, 'ES', 'EUR', $2)`,
                [productId, item.precio_base]
            );
        }

        await client.query('COMMIT');
        console.log('Catalog seeded successfully!');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error seeding catalog:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

seedCatalog();
