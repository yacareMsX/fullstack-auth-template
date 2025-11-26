# SAPUI5 Invoice Management - Complete

## Overview
This is a **complete SAPUI5 implementation** of the Invoice Management application, running in parallel with the React version. Both frontends share the same backend API.

## Features
- ✅ Dashboard with real-time statistics
- ✅ Invoice list with filtering and search
- ✅ Invoice detail view with full information
- ✅ Invoice create/edit form with dynamic line items
- ✅ Automatic tax and total calculations
- ✅ Status management (change invoice status)
- ✅ **Issuer management** (CRUD operations)
- ✅ **Receiver management** (CRUD operations)
- ✅ SAP Fiori design (Horizon theme)
- ✅ Responsive layout (Desktop, Tablet, Phone)
- ✅ Same backend API as React version
- ✅ Real-time data from backend
- ✅ Form validation
- ✅ Confirmation dialogs

## Setup

### Prerequisites
- Node.js 18+
- Backend server running on port 3000

### Installation
```bash
cd client-ui5
npm install
```

### Run
```bash
npm start
```

The app will be available at: **http://localhost:8080**

## Architecture

### Project Structure
```
client-ui5/
├── webapp/
│   ├── controller/       # Controllers (business logic)
│   │   ├── App.controller.js
│   │   ├── Dashboard.controller.js
│   │   ├── InvoiceList.controller.js
│   │   ├── InvoiceDetail.controller.js
│   │   ├── InvoiceForm.controller.js
│   │   ├── IssuerManager.controller.js
│   │   └── ReceiverManager.controller.js
│   ├── view/            # XML Views (UI)
│   │   ├── App.view.xml
│   │   ├── Dashboard.view.xml
│   │   ├── InvoiceList.view.xml
│   │   ├── InvoiceDetail.view.xml
│   │   ├── InvoiceForm.view.xml
│   │   ├── IssuerManager.view.xml
│   │   └── ReceiverManager.view.xml
│   ├── model/           # Formatters and helpers
│   ├── i18n/            # Translations
│   ├── Component.js     # Main component
│   ├── manifest.json    # App descriptor
│   └── index.html       # Entry point
├── ui5.yaml            # UI5 tooling config
└── package.json
```

### Key Differences from React

| Aspect | React | SAPUI5 |
|--------|-------|--------|
| **Views** | JSX | XML |
| **State** | useState | JSONModel |
| **Routing** | react-router | UI5 Router |
| **Components** | Custom | SAP Fiori |
| **Styling** | CSS/inline | Theme + CSS |
| **Data** | fetch + state | Models + Binding |
| **Dialogs** | Custom | sap.m.Dialog |

## Pages Implemented

### 1. Dashboard (`#/`)
- Statistics cards (Total, Draft, Issued, Paid)
- Recent invoices table
- Quick action buttons
- **Route**: `#/`

### 2. Invoice List (`#/invoices`)
- Full invoice table
- Status filter
- Search functionality
- Navigation to details
- Create new invoice button
- **Route**: `#/invoices`

### 3. Invoice Detail (`#/invoice/{id}`)
- Complete invoice information
- Issuer and receiver details
- Line items table with totals
- Status change buttons
- Edit button
- **Route**: `#/invoice/{id}`

### 4. Invoice Form (`#/invoice/new`, `#/invoice/{id}/edit`)
- Create and edit invoices
- Dynamic line items (add/remove)
- Automatic calculations
- Tax selection
- Issuer/receiver selection
- Form validation
- **Routes**: `#/invoice/new`, `#/invoice/{id}/edit`

### 5. Issuer Manager (`#/issuers`)
- List all issuers
- Create new issuer (dialog)
- Edit issuer (dialog)
- Delete issuer (with confirmation)
- **Route**: `#/issuers`

### 6. Receiver Manager (`#/receivers`)
- List all receivers
- Create new receiver (dialog)
- Edit receiver (dialog)
- Delete receiver (with confirmation)
- **Route**: `#/receivers`

## API Integration

Uses the same backend as React:
- `GET /api/invoices/facturas` - List invoices
- Authentication via JWT token from localStorage

## SAP Fiori Components Used

- `sap.m.Page` - Page container
- `sap.m.Table` - Data tables
- `sap.m.GenericTile` - Statistics cards
- `sap.m.ObjectStatus` - Status badges
- `sap.m.ObjectNumber` - Currency display
- `sap.ui.layout.Grid` - Responsive grid

## Comparison with React

### Advantages of SAPUI5:
✅ Enterprise-grade components out of the box
✅ Built-in responsive design
✅ Professional SAP Fiori UX
✅ Powerful data binding
✅ Theme support (Horizon, Quartz, etc.)

### Advantages of React:
✅ More flexible and lightweight
✅ Larger ecosystem
✅ Easier learning curve
✅ Better for custom designs

## Next Steps

To complete the SAPUI5 version:
1. Add invoice detail view
2. Add invoice create/edit form
3. Add issuer/receiver management
4. Add file upload functionality
5. Add more advanced features

## Notes

- Uses OpenUI5 (free version) via CDN
- Backend proxy configured in `ui5.yaml`
- Authentication token from React app is reused
- Fully responsive (Desktop, Tablet, Phone)

---

**Version**: 1.0.0 (Prototype)
**Framework**: OpenUI5 1.120.0
**Theme**: SAP Horizon
