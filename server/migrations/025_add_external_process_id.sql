-- Add external process id to invoices for SAP integration
ALTER TABLE factura
ADD COLUMN external_process_id VARCHAR(255) UNIQUE;
CREATE INDEX idx_factura_external_process_id ON factura(external_process_id);