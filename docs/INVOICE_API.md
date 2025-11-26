# Invoice API Documentation

## Base URL
```
http://localhost:3000/api/invoices
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Emisor (Issuers)

### GET /emisores
List all issuers

**Response**: `200 OK`
```json
[
  {
    "id_emisor": "uuid",
    "nombre": "Company Name",
    "nif": "B12345678",
    "direccion": "Street Address",
    "email": "contact@company.com",
    "telefono": "+34 123456789",
    "created_at": "2025-11-23T20:00:00Z",
    "updated_at": "2025-11-23T20:00:00Z"
  }
]
```

### GET /emisores/:id
Get issuer by ID

### POST /emisores
Create new issuer

**Request Body**:
```json
{
  "nombre": "Company Name",
  "nif": "B12345678",
  "direccion": "Street Address",
  "email": "contact@company.com",
  "telefono": "+34 123456789"
}
```

### PUT /emisores/:id
Update issuer

### DELETE /emisores/:id
Delete issuer

---

## Receptor (Receivers)

### GET /receptores
List all receivers

### GET /receptores/:id
Get receiver by ID

### POST /receptores
Create new receiver

### PUT /receptores/:id
Update receiver

### DELETE /receptores/:id
Delete receiver

---

## Impuesto (Taxes)

### GET /impuestos
List all taxes

**Query Parameters**:
- `activo` (optional): Filter by active status (true/false)

**Response**: `200 OK`
```json
[
  {
    "id_impuesto": "uuid",
    "codigo": "IVA21",
    "descripcion": "IVA General 21%",
    "porcentaje": 21.00,
    "activo": true,
    "created_at": "2025-11-23T20:00:00Z"
  }
]
```

### GET /impuestos/:id
Get tax by ID

### POST /impuestos
Create new tax

**Request Body**:
```json
{
  "codigo": "IVA21",
  "descripcion": "IVA General 21%",
  "porcentaje": 21.00,
  "activo": true
}
```

### PUT /impuestos/:id
Update tax

### DELETE /impuestos/:id
Delete tax

---

## Factura (Invoices)

### GET /facturas
List invoices with filters

**Query Parameters**:
- `estado` (optional): Filter by status
- `id_emisor` (optional): Filter by issuer
- `id_receptor` (optional): Filter by receiver
- `fecha_desde` (optional): Filter by start date
- `fecha_hasta` (optional): Filter by end date
- `limit` (optional, default: 50): Number of results
- `offset` (optional, default: 0): Pagination offset

**Response**: `200 OK`
```json
[
  {
    "id_factura": "uuid",
    "numero": "2024-001",
    "serie": "A",
    "fecha_emision": "2024-11-23",
    "fecha_vencimiento": "2024-12-23",
    "id_emisor": "uuid",
    "id_receptor": "uuid",
    "estado": "EMITIDA",
    "metodo_pago": "TRANSFERENCIA",
    "subtotal": 1000.00,
    "impuestos_totales": 210.00,
    "total": 1210.00,
    "emisor_nombre": "Company Name",
    "receptor_nombre": "Client Name"
  }
]
```

### GET /facturas/:id
Get invoice details with lines

**Response**: `200 OK`
```json
{
  "id_factura": "uuid",
  "numero": "2024-001",
  "serie": "A",
  "fecha_emision": "2024-11-23",
  "estado": "EMITIDA",
  "total": 1210.00,
  "emisor_nombre": "Company Name",
  "emisor_nif": "B12345678",
  "receptor_nombre": "Client Name",
  "lineas": [
    {
      "id_linea": "uuid",
      "descripcion": "Product/Service",
      "cantidad": 10.00,
      "precio_unitario": 100.00,
      "porcentaje_impuesto": 21.00,
      "importe_impuesto": 210.00,
      "total_linea": 1210.00
    }
  ]
}
```

### POST /facturas
Create new invoice

**Request Body**:
```json
{
  "numero": "2024-001",
  "serie": "A",
  "fecha_emision": "2024-11-23",
  "fecha_vencimiento": "2024-12-23",
  "id_emisor": "uuid",
  "id_receptor": "uuid",
  "metodo_pago": "TRANSFERENCIA",
  "lineas": [
    {
      "descripcion": "Product/Service",
      "cantidad": 10.00,
      "precio_unitario": 100.00,
      "porcentaje_impuesto": 21.00,
      "importe_impuesto": 210.00,
      "total_linea": 1210.00,
      "id_impuesto": "uuid"
    }
  ]
}
```

### PUT /facturas/:id
Update invoice

### PATCH /facturas/:id/estado
Change invoice status

**Request Body**:
```json
{
  "estado": "EMITIDA"
}
```

**Valid Status Values**:
- BORRADOR
- EMITIDA
- ENVIADA
- FIRMADA
- REGISTRADA
- RECHAZADA
- PAGADA
- CANCELADA

### GET /facturas/:id/logs
Get invoice audit log

**Response**: `200 OK`
```json
[
  {
    "id_log": "uuid",
    "id_factura": "uuid",
    "fecha": "2024-11-23T20:00:00Z",
    "accion": "ESTADO_CAMBIADO",
    "detalle": "Estado cambiado de BORRADOR a EMITIDA",
    "usuario": "user@example.com"
  }
]
```

### DELETE /facturas/:id
Delete invoice

---

## Linea Factura (Invoice Lines)

### GET /facturas/:id_factura/lineas
Get invoice lines

### POST /facturas/:id_factura/lineas
Add line to invoice

**Request Body**:
```json
{
  "descripcion": "Product/Service",
  "cantidad": 10.00,
  "precio_unitario": 100.00,
  "porcentaje_impuesto": 21.00,
  "importe_impuesto": 210.00,
  "total_linea": 1210.00,
  "id_impuesto": "uuid"
}
```

**Note**: Invoice totals are automatically recalculated

### PUT /lineas/:id
Update invoice line

### DELETE /lineas/:id
Delete invoice line

---

## Adjunto (Attachments)

### GET /facturas/:id_factura/adjuntos
Get invoice attachments

**Response**: `200 OK`
```json
[
  {
    "id_adjunto": "uuid",
    "id_factura": "uuid",
    "filename": "document.pdf",
    "tipo": "application/pdf",
    "url": "/uploads/invoices/1234567890-document.pdf",
    "created_at": "2024-11-23T20:00:00Z"
  }
]
```

### POST /facturas/:id_factura/adjuntos
Upload attachment

**Request**: `multipart/form-data`
- `file`: File to upload (max 5MB)

**Allowed Types**: JPEG, PNG, PDF, XML, DOC, DOCX, XLS, XLSX

**Response**: `201 Created`
```json
{
  "id_adjunto": "uuid",
  "id_factura": "uuid",
  "filename": "document.pdf",
  "tipo": "application/pdf",
  "url": "/uploads/invoices/1234567890-document.pdf"
}
```

### GET /adjuntos/:id/download
Download attachment

**Response**: File download

### DELETE /adjuntos/:id
Delete attachment

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Invoice not found"
}
```

### 409 Conflict
```json
{
  "error": "Invoice number and series combination already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Complete Workflow Example

### 1. Create an Invoice

```bash
POST /api/invoices/facturas
Authorization: Bearer <token>
Content-Type: application/json

{
  "numero": "2024-001",
  "serie": "A",
  "fecha_emision": "2024-11-23",
  "fecha_vencimiento": "2024-12-23",
  "id_emisor": "emisor-uuid",
  "id_receptor": "receptor-uuid",
  "metodo_pago": "TRANSFERENCIA",
  "lineas": [
    {
      "descripcion": "Consulting Services",
      "cantidad": 10,
      "precio_unitario": 100.00,
      "porcentaje_impuesto": 21.00,
      "importe_impuesto": 210.00,
      "total_linea": 1210.00,
      "id_impuesto": "iva21-uuid"
    }
  ]
}
```

### 2. Add Another Line

```bash
POST /api/invoices/facturas/{invoice-id}/lineas
Authorization: Bearer <token>

{
  "descripcion": "Additional Service",
  "cantidad": 5,
  "precio_unitario": 50.00,
  "porcentaje_impuesto": 21.00,
  "importe_impuesto": 52.50,
  "total_linea": 302.50,
  "id_impuesto": "iva21-uuid"
}
```

### 3. Change Status

```bash
PATCH /api/invoices/facturas/{invoice-id}/estado
Authorization: Bearer <token>

{
  "estado": "EMITIDA"
}
```

### 4. Upload Attachment

```bash
POST /api/invoices/facturas/{invoice-id}/adjuntos
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary-data>
```

---

**API Version**: 1.0  
**Last Updated**: 2025-11-23
