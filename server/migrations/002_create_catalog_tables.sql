CREATE TABLE IF NOT EXISTS producto (
    id_producto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PRODUCTO', 'SERVICIO')),
    precio_base NUMERIC(10, 2) NOT NULL CHECK (precio_base >= 0),
    id_impuesto UUID REFERENCES impuesto(id_impuesto),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS producto_traduccion (
    id_traduccion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_producto UUID NOT NULL REFERENCES producto(id_producto) ON DELETE CASCADE,
    codigo_idioma VARCHAR(5) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    UNIQUE(id_producto, codigo_idioma)
);
CREATE TABLE IF NOT EXISTS producto_precio (
    id_precio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_producto UUID NOT NULL REFERENCES producto(id_producto) ON DELETE CASCADE,
    codigo_pais VARCHAR(2) NOT NULL,
    moneda VARCHAR(3) NOT NULL,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    UNIQUE(id_producto, codigo_pais)
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_producto_sku ON producto(sku);
CREATE INDEX IF NOT EXISTS idx_producto_traduccion_producto ON producto_traduccion(id_producto);
CREATE INDEX IF NOT EXISTS idx_producto_precio_producto ON producto_precio(id_producto);