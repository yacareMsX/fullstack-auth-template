-- Mirror Emisores to Receptores
INSERT INTO receptor (nombre, nif, direccion, email, telefono)
SELECT nombre,
    nif,
    direccion,
    email,
    telefono
FROM emisor
WHERE nif NOT IN (
        SELECT nif
        FROM receptor
    );
-- Mirror Receptores to Emisores
INSERT INTO emisor (nombre, nif, direccion, email, telefono)
SELECT nombre,
    nif,
    direccion,
    email,
    telefono
FROM receptor
WHERE nif NOT IN (
        SELECT nif
        FROM emisor
    );