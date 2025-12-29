-- Add fecha_operacion column to factura table
ALTER TABLE factura
ADD COLUMN fecha_operacion DATE;
COMMENT ON COLUMN factura.fecha_operacion IS 'Date when the operation took place (fecha de devengo)';
-- Drop view to allow column changes
DROP VIEW IF EXISTS v_facturas_completas;
-- Update v_facturas_completas view to include fecha_operacion
CREATE OR REPLACE VIEW v_facturas_completas AS
SELECT f.id_factura,
    f.numero,
    f.serie,
    f.fecha_emision,
    f.fecha_vencimiento,
    f.fecha_operacion,
    -- Added field
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
COMMENT ON VIEW v_facturas_completas IS 'Complete invoice view with issuer and receiver details, including operation date';