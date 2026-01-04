CREATE TABLE IF NOT EXISTS invoice_country (
    id SERIAL PRIMARY KEY,
    pais VARCHAR(255) NOT NULL,
    region VARCHAR(255)
);
INSERT INTO invoice_country (pais, region)
VALUES ('España', 'Europa'),
    ('Polonia', 'Europa'),
    ('Francia', 'Europa'),
    ('Bélgica', 'Europa');