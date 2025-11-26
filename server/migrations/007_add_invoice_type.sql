-- Add tipo column to factura table
ALTER TABLE factura
ADD COLUMN tipo VARCHAR(20) DEFAULT 'ISSUE' CHECK (tipo IN ('ISSUE', 'RECEIPT'));
-- Update existing invoices to ISSUE type
UPDATE factura
SET tipo = 'ISSUE'
WHERE tipo IS NULL;
-- Make tipo NOT NULL after setting default values
ALTER TABLE factura
ALTER COLUMN tipo
SET NOT NULL;
-- Add index for better query performance
CREATE INDEX idx_factura_tipo ON factura(tipo);
COMMENT ON COLUMN factura.tipo IS 'Type of invoice: ISSUE (emitida) or RECEIPT (recibida)';