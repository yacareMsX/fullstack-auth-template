-- Migration to add APP_TILE_349 permission
INSERT INTO authorization_objects (object_type, code, description)
VALUES (
        'ACCESS_APP',
        'APP_TILE_349',
        'Acceso al Tile Modelo 349'
    ) ON CONFLICT (code) DO NOTHING;