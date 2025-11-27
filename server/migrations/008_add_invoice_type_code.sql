-- Add codigo_tipo column to factura table
ALTER TABLE factura
ADD COLUMN codigo_tipo VARCHAR(2);
-- Update existing invoices based on tipo
-- ISSUE -> 01
-- RECEIPT -> 02
UPDATE factura
SET codigo_tipo = '01'
WHERE tipo = 'ISSUE';
UPDATE factura
SET codigo_tipo = '02'
WHERE tipo = 'RECEIPT';
-- Default to 01 if null (optional, but good for safety)
UPDATE factura
SET codigo_tipo = '01'
WHERE codigo_tipo IS NULL;
-- Make codigo_tipo NOT NULL
ALTER TABLE factura
ALTER COLUMN codigo_tipo
SET NOT NULL;
-- Add comment
COMMENT ON COLUMN factura.codigo_tipo IS 'Code for invoice type: 01 (Issued/Emitida), 02 (Received/Recibida)';