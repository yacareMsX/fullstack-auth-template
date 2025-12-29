# Documentación Detallada del Esquema de Datos

Esta versión describe el modelo de datos utilizando tablas detalladas para facilitar su lectura sin necesidad de un renderizador de diagramas.

## 1. Módulo de Autenticación y Usuarios

### `users`
Tabla principal de cuentas de usuario.
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | SERIAL | **PK** | Identificador único |
| `email` | VARCHAR | UNIQUE | Correo electrónico de acceso |
| `is_active` | BOOLEAN | | Estado de la cuenta |

### `roles`
Roles del sistema (ej. admin, user, dev).
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | SERIAL | **PK** | Identificador del rol |
| `name` | VARCHAR | UNIQUE | Nombre corto del rol |
| `description` | TEXT | | Descripción funcional |

### `profiles`
Información extendida del usuario (perfil).
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | SERIAL | **PK** | Identificador del perfil |
| `user_id` | INTEGER | **FK** -> `users.id` | Relación con usuario |
| `first_name` | VARCHAR | | Nombre |
| `last_name` | VARCHAR | | Apellidos |
| `nif` | VARCHAR | | NIF/DNI |

### `authorization_objects`
Objetos de autorización granular (permisos).
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | SERIAL | **PK** | Identificador |
| `object_type` | VARCHAR | | Tipo (ACCESS_APP, ACTION) |
| `code` | VARCHAR | UNIQUE | Código técnico del permiso |

---

## 2. Facturación (Core)

### `factura`
Cabecera de las facturas emitidas y recibidas.
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_factura` | UUID | **PK** | Identificador único global |
| `numero` | VARCHAR | | Número de factura |
| `serie` | VARCHAR | | Serie de facturación |
| `fecha_emision` | DATE | | Fecha de emisión |
| `fecha_operacion`| DATE | | Fecha real de la operación |
| `estado` | ENUM | | (BORRADOR, EMITIDA, etc.) |
| `tipo` | VARCHAR | | ISSUE (Emitida) / RECEIPT (Recibida) |
| `codigo_tipo` | VARCHAR | | 01 (Emitida) / 02 (Recibida) |
| `subtotal` | NUMERIC | | Base imponible |
| `impuestos_totales`| NUMERIC | | Total impuestos |
| `total` | NUMERIC | | Importe total |
| `id_emisor` | UUID | **FK** -> `emisor` | Quién emite |
| `id_receptor` | UUID | **FK** -> `receptor`| Quién recibe |
| `id_origen` | INTEGER | **FK** -> `origenes`| Canal (Manual, API, etc.) |

### `linea_factura`
Líneas de detalle de la factura.
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_linea` | UUID | **PK** | Identificador de línea |
| `id_factura` | UUID | **FK** -> `factura` | Factura padre |
| `descripcion` | TEXT | | Concepto |
| `cantidad` | NUMERIC | | Unidades |
| `precio_unitario`| NUMERIC | | Precio por unidad |
| `total_linea` | NUMERIC | | Total (inc. impuestos) |
| `id_impuesto` | UUID | **FK** -> `impuesto`| Impuesto aplicado |

### `emisor` / `receptor`
Entidades fiscales participantes.
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | **PK** | Identificador |
| `nombre` | VARCHAR | | Razón Social |
| `nif` | VARCHAR | | NIF / CIF |
| `direccion` | TEXT | | Dirección fiscal |

---

## 3. Catálogo de Productos

### `producto`
Maestro de productos y servicios.
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_producto` | UUID | **PK** | Identificador |
| `sku` | VARCHAR | UNIQUE | Referencia única |
| `tipo` | VARCHAR | | PRODUCTO / SERVICIO |
| `precio_base` | NUMERIC | | Precio estándar |

### `producto_precio`
Precios específicos por país/moneda.
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_precio` | UUID | **PK** | Identificador |
| `id_producto` | UUID | **FK** -> `producto`| Producto relacionado |
| `codigo_pais` | VARCHAR | | Código ISO país |
| `precio` | NUMERIC | | Precio para ese mercado |

---

## 4. Workflow Engine

### `workflows`
Definición de flujos de trabajo.
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | **PK** | Identificador |
| `name` | VARCHAR | | Nombre del workflow |
| `is_active` | BOOLEAN | | Si está habilitado |

### `workflow_nodes`
Nodos (pasos) del flujo.
| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | UUID | **PK** | Identificador del nodo |
| `workflow_id` | UUID | **FK** -> `workflows`| Workflow padre |
| `type` | VARCHAR | | Tipo (START, TASK, etc.) |
| `label` | VARCHAR | | Etiqueta visible |
