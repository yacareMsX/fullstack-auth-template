CREATE TABLE IF NOT EXISTS documentation_xml (
    id SERIAL PRIMARY KEY,
    nombre_objeto VARCHAR(20) NOT NULL,
    tipo_estructura VARCHAR(10) NOT NULL,
    formato VARCHAR(5) NOT NULL,
    descripcion VARCHAR(120) NOT NULL
);