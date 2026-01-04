-- 1. Add column nullable first
ALTER TABLE factura
ADD COLUMN invoice_country_id INTEGER;
-- 2. Backfill with default value
UPDATE factura
SET invoice_country_id = 1
WHERE invoice_country_id IS NULL;
-- 3. Set NOT NULL and add FK to invoice_country
ALTER TABLE factura
ALTER COLUMN invoice_country_id
SET NOT NULL;
ALTER TABLE factura
ADD CONSTRAINT fk_invoice_country FOREIGN KEY (invoice_country_id) REFERENCES invoice_country(id);
-- 4. Drop existing Foreign Keys from child tables
ALTER TABLE linea_factura DROP CONSTRAINT linea_factura_id_factura_fkey;
ALTER TABLE log_factura DROP CONSTRAINT log_factura_id_factura_fkey;
ALTER TABLE adjunto DROP CONSTRAINT adjunto_id_factura_fkey;
-- 5. Drop existing Primary Key
ALTER TABLE factura DROP CONSTRAINT factura_pkey;
-- 6. Add UNIQUE constraint to id_factura (so child tables can reference it solely)
ALTER TABLE factura
ADD CONSTRAINT factura_id_factura_key UNIQUE (id_factura);
-- 7. Add new Composite Primary Key
ALTER TABLE factura
ADD CONSTRAINT factura_pkey PRIMARY KEY (id_factura, invoice_country_id);
-- 8. Re-instate Foreign Keys in child tables referencing the UNIQUE id_factura
ALTER TABLE linea_factura
ADD CONSTRAINT linea_factura_id_factura_fkey FOREIGN KEY (id_factura) REFERENCES factura(id_factura) ON DELETE CASCADE;
ALTER TABLE log_factura
ADD CONSTRAINT log_factura_id_factura_fkey FOREIGN KEY (id_factura) REFERENCES factura(id_factura) ON DELETE CASCADE;
ALTER TABLE adjunto
ADD CONSTRAINT adjunto_id_factura_fkey FOREIGN KEY (id_factura) REFERENCES factura(id_factura) ON DELETE CASCADE;