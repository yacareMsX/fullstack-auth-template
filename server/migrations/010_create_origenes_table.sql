-- Create origenes table
CREATE TABLE IF NOT EXISTS origenes (
    id_origen SERIAL PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL
);
-- Add initial data
INSERT INTO origenes (descripcion)
VALUES ('Manual');
INSERT INTO origenes (descripcion)
VALUES ('Email');
INSERT INTO origenes (descripcion)
VALUES ('Scanner');
INSERT INTO origenes (descripcion)
VALUES ('API');
-- Add id_origen column to factura table
ALTER TABLE factura
ADD COLUMN id_origen INTEGER REFERENCES origenes(id_origen);
-- Set default origin for existing invoices (assuming Manual = 1)
UPDATE factura
SET id_origen = 1
WHERE id_origen IS NULL;