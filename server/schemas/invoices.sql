-- =====================================================
-- INVOICE MANAGEMENT SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Version: 1.0
-- Database: PostgreSQL 12+
-- Description: Complete schema for electronic invoicing system
-- =====================================================
-- =====================================================
-- ENUMS
-- =====================================================
-- Invoice status lifecycle
CREATE TYPE estado_factura AS ENUM (
    'BORRADOR',
    -- Draft
    'EMITIDA',
    -- Issued
    'ENVIADA',
    -- Sent
    'FIRMADA',
    -- Signed
    'REGISTRADA',
    -- Registered with tax authority
    'RECHAZADA',
    -- Rejected
    'PAGADA',
    -- Paid
    'CANCELADA' -- Cancelled
);
-- Payment methods
CREATE TYPE metodo_pago_enum AS ENUM (
    'TRANSFERENCIA',
    -- Bank transfer
    'TARJETA',
    -- Credit/Debit card
    'ADEUDO_SEPA',
    -- SEPA direct debit
    'PAYPAL',
    -- PayPal
    'CONTADO',
    -- Cash
    'OTRO' -- Other
);
-- =====================================================
-- TABLES
-- =====================================================
-- -----------------------------------------------------
-- Table: EMISOR (Invoice Issuer)
-- -----------------------------------------------------
CREATE TABLE emisor (
    id_emisor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    nif VARCHAR(20) NOT NULL UNIQUE,
    direccion TEXT,
    email VARCHAR(200),
    telefono VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE emisor IS 'Invoice issuers (companies/individuals that issue invoices)';
COMMENT ON COLUMN emisor.nif IS 'Tax identification number (unique)';
-- -----------------------------------------------------
-- Table: RECEPTOR (Invoice Receiver)
-- -----------------------------------------------------
CREATE TABLE receptor (
    id_receptor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    nif VARCHAR(20) NOT NULL,
    direccion TEXT,
    email VARCHAR(200),
    telefono VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE receptor IS 'Invoice receivers (customers/clients)';
-- -----------------------------------------------------
-- Table: IMPUESTO (Tax)
-- -----------------------------------------------------
CREATE TABLE impuesto (
    id_impuesto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    porcentaje NUMERIC(5, 2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE impuesto IS 'Tax catalog (VAT, IVA, etc.)';
COMMENT ON COLUMN impuesto.porcentaje IS 'Tax percentage (e.g., 21.00 for 21%, -15.00 for withholding)';
-- -----------------------------------------------------
-- Table: FACTURA (Invoice)
-- -----------------------------------------------------
CREATE TABLE factura (
    id_factura UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(50) NOT NULL,
    serie VARCHAR(20),
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    id_emisor UUID NOT NULL REFERENCES emisor(id_emisor),
    id_receptor UUID NOT NULL REFERENCES receptor(id_receptor),
    estado estado_factura NOT NULL DEFAULT 'BORRADOR',
    metodo_pago metodo_pago_enum,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    impuestos_totales NUMERIC(12, 2) NOT NULL CHECK (impuestos_totales >= 0),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    xml_path TEXT,
    pdf_path TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT factura_unica UNIQUE (numero, serie)
);
COMMENT ON TABLE factura IS 'Main invoice table';
COMMENT ON COLUMN factura.numero IS 'Invoice number';
COMMENT ON COLUMN factura.serie IS 'Invoice series (e.g., A, B, 2024)';
COMMENT ON CONSTRAINT factura_unica ON factura IS 'Invoice number + series must be unique';
-- -----------------------------------------------------
-- Table: LINEA_FACTURA (Invoice Line Item)
-- -----------------------------------------------------
CREATE TABLE linea_factura (
    id_linea UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_factura UUID NOT NULL REFERENCES factura(id_factura) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    cantidad NUMERIC(12, 2) NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    porcentaje_impuesto NUMERIC(5, 2),
    importe_impuesto NUMERIC(12, 2),
    total_linea NUMERIC(12, 2) NOT NULL CHECK (total_linea >= 0),
    id_impuesto UUID REFERENCES impuesto(id_impuesto),
    created_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE linea_factura IS 'Invoice line items';
COMMENT ON COLUMN linea_factura.total_linea IS 'Total for this line (quantity × price + tax)';
-- -----------------------------------------------------
-- Table: LOG_FACTURA (Invoice Audit Log)
-- -----------------------------------------------------
CREATE TABLE log_factura (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_factura UUID NOT NULL REFERENCES factura(id_factura) ON DELETE CASCADE,
    fecha TIMESTAMP NOT NULL DEFAULT NOW(),
    accion VARCHAR(200) NOT NULL,
    detalle TEXT,
    usuario VARCHAR(100)
);
COMMENT ON TABLE log_factura IS 'Audit trail for invoice operations';
COMMENT ON COLUMN log_factura.accion IS 'Action performed (e.g., CREADA, MODIFICADA, ESTADO_CAMBIADO)';
-- -----------------------------------------------------
-- Table: ADJUNTO (Invoice Attachment)
-- -----------------------------------------------------
CREATE TABLE adjunto (
    id_adjunto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_factura UUID NOT NULL REFERENCES factura(id_factura) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
COMMENT ON TABLE adjunto IS 'Files attached to invoices';
COMMENT ON COLUMN adjunto.tipo IS 'MIME type (e.g., application/pdf, image/jpeg)';
COMMENT ON COLUMN adjunto.url IS 'File storage URL or path';
-- =====================================================
-- INDEXES
-- =====================================================
-- Factura indexes
CREATE INDEX idx_factura_numero_serie ON factura(numero, serie);
CREATE INDEX idx_factura_emisor ON factura(id_emisor);
CREATE INDEX idx_factura_receptor ON factura(id_receptor);
CREATE INDEX idx_factura_estado ON factura(estado);
CREATE INDEX idx_factura_fecha ON factura(fecha_emision);
CREATE INDEX idx_factura_created ON factura(created_at DESC);
-- Linea factura indexes
CREATE INDEX idx_linea_factura_factura ON linea_factura(id_factura);
CREATE INDEX idx_linea_factura_impuesto ON linea_factura(id_impuesto);
-- Log factura indexes
CREATE INDEX idx_log_factura ON log_factura(id_factura);
CREATE INDEX idx_log_fecha ON log_factura(fecha DESC);
CREATE INDEX idx_log_usuario ON log_factura(usuario);
-- Adjunto indexes
CREATE INDEX idx_adjunto_factura ON adjunto(id_factura);
-- Emisor/Receptor indexes
CREATE INDEX idx_emisor_nif ON emisor(nif);
CREATE INDEX idx_receptor_nif ON receptor(nif);
-- Impuesto indexes
CREATE INDEX idx_impuesto_codigo ON impuesto(codigo);
CREATE INDEX idx_impuesto_activo ON impuesto(activo);
-- =====================================================
-- TRIGGERS
-- =====================================================
-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Apply trigger to emisor
CREATE TRIGGER update_emisor_updated_at BEFORE
UPDATE ON emisor FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Apply trigger to receptor
CREATE TRIGGER update_receptor_updated_at BEFORE
UPDATE ON receptor FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Apply trigger to factura
CREATE TRIGGER update_factura_updated_at BEFORE
UPDATE ON factura FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Auto-log invoice state changes
CREATE OR REPLACE FUNCTION log_factura_estado_change() RETURNS TRIGGER AS $$ BEGIN IF OLD.estado IS DISTINCT
FROM NEW.estado THEN
INSERT INTO log_factura (id_factura, accion, detalle)
VALUES (
        NEW.id_factura,
        'ESTADO_CAMBIADO',
        'Estado cambiado de ' || OLD.estado || ' a ' || NEW.estado
    );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_log_estado_change
AFTER
UPDATE ON factura FOR EACH ROW EXECUTE FUNCTION log_factura_estado_change();
-- =====================================================
-- INITIAL DATA
-- =====================================================
-- Common tax rates in Spain
INSERT INTO impuesto (codigo, descripcion, porcentaje)
VALUES ('IVA21', 'IVA General 21%', 21.00),
    ('IVA10', 'IVA Reducido 10%', 10.00),
    ('IVA4', 'IVA Superreducido 4%', 4.00),
    ('IVA0', 'IVA Exento 0%', 0.00),
    ('IRPF15', 'IRPF 15% (Retención)', -15.00),
    ('IRPF7', 'IRPF 7% (Retención)', -7.00) ON CONFLICT (codigo) DO NOTHING;
-- =====================================================
-- VIEWS
-- =====================================================
-- View: Complete invoice with issuer and receiver info
CREATE OR REPLACE VIEW v_facturas_completas AS
SELECT f.id_factura,
    f.numero,
    f.serie,
    f.fecha_emision,
    f.fecha_vencimiento,
    f.estado,
    f.metodo_pago,
    f.subtotal,
    f.impuestos_totales,
    f.total,
    e.nombre AS emisor_nombre,
    e.nif AS emisor_nif,
    e.email AS emisor_email,
    r.nombre AS receptor_nombre,
    r.nif AS receptor_nif,
    r.email AS receptor_email,
    f.created_at,
    f.updated_at
FROM factura f
    JOIN emisor e ON f.id_emisor = e.id_emisor
    JOIN receptor r ON f.id_receptor = r.id_receptor;
COMMENT ON VIEW v_facturas_completas IS 'Complete invoice view with issuer and receiver details';
-- View: Invoice summary with line count
CREATE OR REPLACE VIEW v_facturas_resumen AS
SELECT f.id_factura,
    f.numero,
    f.serie,
    f.fecha_emision,
    f.estado,
    f.total,
    e.nombre AS emisor,
    r.nombre AS receptor,
    COUNT(lf.id_linea) AS num_lineas,
    COUNT(a.id_adjunto) AS num_adjuntos
FROM factura f
    JOIN emisor e ON f.id_emisor = e.id_emisor
    JOIN receptor r ON f.id_receptor = r.id_receptor
    LEFT JOIN linea_factura lf ON f.id_factura = lf.id_factura
    LEFT JOIN adjunto a ON f.id_factura = a.id_factura
GROUP BY f.id_factura,
    f.numero,
    f.serie,
    f.fecha_emision,
    f.estado,
    f.total,
    e.nombre,
    r.nombre;
COMMENT ON VIEW v_facturas_resumen IS 'Invoice summary with line and attachment counts';
-- =====================================================
-- FUNCTIONS
-- =====================================================
-- Function to calculate invoice totals from lines
CREATE OR REPLACE FUNCTION calcular_totales_factura(p_id_factura UUID) RETURNS TABLE(
        subtotal NUMERIC,
        impuestos NUMERIC,
        total NUMERIC
    ) AS $$ BEGIN RETURN QUERY
SELECT COALESCE(SUM((cantidad * precio_unitario)), 0)::NUMERIC(12, 2) AS subtotal,
    COALESCE(SUM(importe_impuesto), 0)::NUMERIC(12, 2) AS impuestos,
    COALESCE(SUM(total_linea), 0)::NUMERIC(12, 2) AS total
FROM linea_factura
WHERE id_factura = p_id_factura;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION calcular_totales_factura IS 'Calculate invoice totals from line items';
-- =====================================================
-- GRANTS (Optional - adjust as needed)
-- =====================================================
-- Example: Grant permissions to application role
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;
-- =====================================================
-- END OF SCHEMA
-- =====================================================