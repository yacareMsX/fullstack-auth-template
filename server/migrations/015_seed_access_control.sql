-- Migration to seed authorization objects for Tiles and Sidebar Menu items
INSERT INTO authorization_objects (object_type, code, description)
VALUES -- Tiles
    (
        'ACCESS_APP',
        'APP_TILE_FACE',
        'Acceso al Tile eInvoice FACe'
    ),
    (
        'ACCESS_APP',
        'APP_TILE_TBAI',
        'Acceso al Tile TicketBAI'
    ),
    (
        'ACCESS_APP',
        'APP_TILE_LEY_CC',
        'Acceso al Tile Ley Crea y Crece (Dashboard)'
    ),
    (
        'ACCESS_APP',
        'APP_TILE_POLONIA',
        'Acceso al Tile eInvoice Polonia'
    ),
    (
        'ACCESS_APP',
        'APP_TILE_FRANCIA',
        'Acceso al Tile eInvoice Francia'
    ),
    (
        'ACCESS_APP',
        'APP_TILE_BELGICA',
        'Acceso al Tile eInvoice Bélgica'
    ),
    (
        'ACCESS_APP',
        'APP_TILE_SII',
        'Acceso al Tile SII'
    ),
    (
        'ACCESS_APP',
        'APP_TILE_VERIFACTU',
        'Acceso al Tile Verifactu'
    ),
    (
        'ACCESS_APP',
        'APP_TILE_FRANCE_REPORTING',
        'Acceso al Tile France Reporting'
    ),
    (
        'ACCESS_APP',
        'APP_TILE_301',
        'Acceso al Tile Modelo 301'
    ),
    (
        'ACCESS_APP',
        'APP_TILE_322',
        'Acceso al Tile Modelo 322'
    ),
    -- Sidebar Menu Items (Ley C&C)
    (
        'ACCESS_APP',
        'APP_MENU_DASHBOARD',
        'Acceso al Menú Dashboard'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_ISSUED_LIST',
        'Acceso al Menú Facturas Emitidas - Listado'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_ISSUED_NEW',
        'Acceso al Menú Facturas Emitidas - Nueva'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_RECEIVED_LIST',
        'Acceso al Menú Facturas Recibidas - Listado'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_RECEIVED_NEW',
        'Acceso al Menú Facturas Recibidas - Nueva'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_SCAN',
        'Acceso al Menú Escanear Factura'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_UPLOAD',
        'Acceso al Menú Subir Excel'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_CATALOG_NEW',
        'Acceso al Menú Catálogo - Nuevo Item'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_CATALOG_LIST',
        'Acceso al Menú Catálogo - Listado'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_WORKFLOW_NEW',
        'Acceso al Menú Workflow - Nuevo'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_WORKFLOW_LIST',
        'Acceso al Menú Workflow - Listado'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_CONFIG_ISSUERS',
        'Acceso al Menú Configuración - Emisores'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_CONFIG_RECEIVERS',
        'Acceso al Menú Configuración - Receptores'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_CONFIG_TAXES',
        'Acceso al Menú Configuración - Impuestos'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_MAPPING',
        'Acceso al Menú Herramienta de Mapeo'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_ADMIN_ORIGINS',
        'Acceso al Menú Administración - Orígenes'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_AUDIT',
        'Acceso al Menú Auditoría'
    ),
    (
        'ACCESS_APP',
        'APP_MENU_API_DOCS',
        'Acceso al Menú Documentación API'
    ) ON CONFLICT (code) DO NOTHING;