# ScanPOS – Billing & Scanner System Roadmap

## Overview
A billing system for local shops where:
- **PC Web App (AngularJS)** is the main billing interface.
- **Mobile Web App (responsive page)** acts as a barcode scanner using the phone camera.
- Both connect to a shared **Flask backend API** with a single database.

Later, the mobile web scanner can be upgraded to a **native Android app** without changing the core backend much.

---

## PHASE 0 – Project Definition

### Step 0.1 – Choose and fix the stack
- **Backend:** Flask, SQLAlchemy, Flask-Migrate, JWT auth, SQLite (can later move to Postgres/MySQL).
- **Frontend (PC):** AngularJS (single-page app with routes).
- **Mobile scanner:** Responsive web page (also AngularJS or plain JS) served from same backend/frontend.
- **Auth:** JWT tokens stored on client (localStorage in browser).
- **Network (initial):** Local Wi-Fi – PC and phone connect to Flask via LAN IP (e.g. `http://192.168.x.x:5000`).

Goal: Clear architecture before coding.

---

## PHASE 1 – Project Setup

### Step 1.1 – Setup Flask Project
**Tasks:**
1. Create folder `scanpos-backend/`.
2. Setup virtual environment and install dependencies:
   - `flask`
   - `flask-cors`
   - `flask-jwt-extended`
   - `flask_sqlalchemy`
   - `flask-migrate`
   - `marshmallow` (optional but recommended)
3. Create an app structure:
   - `scanpos_backend/`
     - `__init__.py` (app factory)
     - `models.py`
     - `routes/` (e.g. `auth.py`, `products.py`, `invoices.py`)
     - `config.py`
     - `extensions.py` (db, migrate, jwt, cors)
   - `wsgi.py` or `run.py`
4. Implement a `/health` endpoint that returns `{ "status": "ok" }`.
5. Enable CORS for AngularJS frontend origin.

**AI Prompt Example:**
> "Create a minimal Flask project with an app factory, Blueprints, SQLAlchemy, JWT auth setup, and CORS enabled. Include a `/health` endpoint and organize files into `models.py`, `routes/`, `extensions.py`, and `config.py`."

---

### Step 1.2 – Setup AngularJS Project (Frontend)
**Tasks:**
1. Create folder `scanpos-frontend/`.
2. Add base files:
   - `index.html`
   - `app.js` (AngularJS module + routing)
   - `controllers/` folder
   - `services/` folder
   - `views/` folder
3. Configure routes (using `ngRoute` or `ui-router`):
   - `/login`
   - `/dashboard`
   - `/billing`
   - `/products`
   - `/reports`
4. Build a common layout:
   - Top bar with app name "ScanPOS".
   - Left sidebar with navigation links.
   - Main content area where views are injected.

**AI Prompt Example:**
> "Generate a basic AngularJS SPA structure with routing for `/login`, `/dashboard`, `/billing`, `/products`, and `/reports`. Use a shared layout with a sidebar and top bar."

---

## PHASE 2 – Database & Models

### Step 2.1 – Design Database Schema
**Tables:**
1. `users`
   - `id`
   - `name`
   - `email` (unique)
   - `password_hash`
   - `role` (`admin`, `cashier`)
   - `created_at`

2. `products`
   - `id`
   - `name`
   - `barcode` (unique, nullable if some items don’t have barcode)
   - `price`
   - `tax_percent`
   - `stock_qty`
   - `is_active`
   - `created_at`

3. `customers` (optional in v1 but useful)
   - `id`
   - `name`
   - `phone`
   - `address`
   - `created_at`

4. `invoices`
   - `id`
   - `invoice_number` (string, unique)
   - `customer_id` (nullable FK)
   - `status` (`draft`, `completed`, `cancelled`)
   - `subtotal_amount`
   - `total_tax`
   - `discount_amount`
   - `total_amount`
   - `created_at`
   - `updated_at`

5. `invoice_items`
   - `id`
   - `invoice_id` (FK)
   - `product_id` (FK)
   - `quantity`
   - `unit_price`
   - `tax_percent`
   - `line_subtotal`
   - `line_tax`
   - `line_total`

**AI Prompt Example:**
> "In SQLAlchemy, define models for users, products, customers, invoices, and invoice_items with the following fields: [paste list]. Include relationships and backrefs so an invoice can access its items and a product can access its invoice_items."

---

### Step 2.2 – Setup DB Migrations
**Tasks:**
1. Integrate Flask-Migrate with the app.
2. Initialize migrations: `flask db init`.
3. Create first migration: `flask db migrate -m "initial"`.
4. Apply migration: `flask db upgrade`.

**AI Prompt Example:**
> "Integrate Flask-Migrate with my Flask app using SQLAlchemy. Show how to initialize migrations and create the first migration using the existing models."

---

## PHASE 3 – Authentication & User Management

### Step 3.1 – JWT Authentication API
**Endpoints:**
- `POST /api/auth/register` (admin only in production, but can be open during development)
  - Input: name, email, password, role.
  - Creates a hashed-password user.
- `POST /api/auth/login`
  - Input: email, password.
  - On success: returns `{ access_token, user: {id, name, email, role} }`.
- `GET /api/auth/me`
  - Requires JWT.
  - Returns current user info.

**AI Prompt Example:**
> "Implement JWT-based authentication in Flask using flask-jwt-extended. Add `/api/auth/register`, `/api/auth/login` (returns access token and user info), and `/api/auth/me`. Use password hashing with Werkzeug."

---

### Step 3.2 – AngularJS Auth Integration
**Tasks:**
1. Create `AuthService`:
   - Functions: `login`, `logout`, `getUser`, `isAuthenticated`.
   - Store JWT token in `localStorage`.
2. Setup HTTP interceptor:
   - Attach `Authorization: Bearer <token>` header to outgoing requests.
   - On `401 Unauthorized`, clear token and redirect to `/login`.
3. Build `LoginController` + login view:
   - Email + password form.
   - On submit, call `AuthService.login()`.
   - On success, redirect to `/dashboard`.

**AI Prompt Example:**
> "In AngularJS, build an AuthService that stores a JWT token in localStorage, an HTTP interceptor that adds the token to Authorization headers, and a login controller + template using `/api/auth/login`."

---

## PHASE 4 – Product Management (PC Interface)

### Step 4.1 – Product API (CRUD)
**Endpoints:**
- `GET /api/products`
  - Optional filters: `search`, `page`, `page_size`.
- `POST /api/products`
  - Create new product.
- `GET /api/products/<id>`
- `PUT /api/products/<id>`
- `DELETE /api/products/<id>`
  - Soft delete: set `is_active = false`.
- `GET /api/products/by-barcode/<barcode>`
  - Find product by barcode.

**Behaviours:**
- Only authenticated users can access.
- Optionally restrict product management to admin role.

**AI Prompt Example:**
> "Create Flask routes for full CRUD on products, including an endpoint `/api/products/by-barcode/<barcode>` that returns a product by its barcode. Use SQLAlchemy models and return JSON responses."

---

### Step 4.2 – AngularJS Product Screens
**Tasks:**
1. Create `ProductsService` to call `/api/products` endpoints.
2. Create `ProductsController` and views:
   - Product List View:
     - Table with columns: Name, Barcode, Price, Tax, Stock, Active, Edit/Delete.
     - Search box.
   - Product Create/Edit View:
     - Form with: Name, Barcode, Price, Tax %, Stock, Active toggle.
3. Add navigation link "Products" in sidebar.

**AI Prompt Example:**
> "Build AngularJS controllers, services, and templates for listing, creating, and editing products using the Flask `/api/products` endpoints. Include search and soft delete."

---

## PHASE 5 – Core Billing Flow (PC Interface)

### Step 5.1 – Invoice API
**Endpoints:**
- `POST /api/invoices`
  - Create a new invoice with status `draft` and generate `invoice_number`.
- `GET /api/invoices/<id>`
  - Returns invoice + items.
- `POST /api/invoices/<id>/items`
  - Add item by product ID or barcode.
  - Body could be `{ "product_id": 1, "quantity": 2 }` or `{ "barcode": "123456", "quantity": 1 }`.
- `PUT /api/invoices/<id>/items/<item_id>`
  - Update quantity or remove (e.g. set quantity to 0 or support `DELETE`).
- `POST /api/invoices/<id>/complete`
  - Mark invoice as `completed`.
  - Recalculate and save subtotal, tax, discount, total.
- `GET /api/invoices?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - List invoices for reporting.

**AI Prompt Example:**
> "Implement Flask endpoints for invoice creation and management: create draft invoice, get invoice with items, add item by product_id or barcode, update item, complete invoice (calculate totals), and list invoices by date range. Use the given SQLAlchemy models."

---

### Step 5.2 – Billing Screen on PC
**Flow:**
1. User opens `/billing` route.
2. `BillingController` calls `POST /api/invoices` to create a draft invoice.
3. UI shows:
   - Current invoice number.
   - Product search box (by name or barcode).
   - Button to add selected product with quantity.
   - Table of items with:
     - Product name
     - Quantity (editable)
     - Unit price
     - Tax
     - Line total
   - Summary section:
     - Subtotal, tax, discount, grand total.
4. User can:
   - Adjust quantities.
   - Remove items.
   - Apply discount (optional).
   - Click **Complete & Print**:
     - Calls `/api/invoices/<id>/complete`.
     - Redirect or show print/download options.

**AI Prompt Example:**
> "Create an AngularJS billing controller and view that, on load, creates a draft invoice via `/api/invoices`, allows adding products to it, shows invoice items in a table, updates quantities, and completes the invoice via `/api/invoices/<id>/complete`."

---

## PHASE 6 – Mobile Web Scanner Flow

### Concept Overview
- PC billing page manages invoice and shows a **QR code** that represents the invoice (or a scan URL).
- Mobile browser opens `scan` page.
- Mobile page uses camera to scan:
  - First, scan the invoice QR (or read invoice ID from URL).
  - Then, scan product barcodes.
- For each product scan, the mobile page calls the backend to **add an item** to that invoice.
- PC billing screen periodically refreshes invoice items (polling) to reflect new items.

---

### Step 6.1 – QR Code on Billing Screen (PC)
**Tasks:**
1. When draft invoice is created, store `invoice_id` in `BillingController`.
2. Generate a URL like:
   - `https://yourserver/scan?invoice=<invoice_id>` (or local IP version for testing).
3. Use a JS QR code library (e.g. `qrcodejs`) to render a QR code with that URL.
4. Display the QR on the billing page so the mobile device can scan it.

**AI Prompt Example:**
> "On an AngularJS billing page with an invoice_id, generate and display a QR code encoding the URL `/scan?invoice=<invoice_id>` using a JS library like qrcodejs."

---

### Step 6.2 – Mobile `/scan` View (Web Scanner)
**Behaviour:**
1. New frontend route `/scan` (can be in same AngularJS app or a simple standalone HTML page).
2. On load:
   - Read `invoice` query parameter from URL.
   - If absent, optionally allow user to type invoice ID.
3. Access device camera using `getUserMedia`.
4. Use a JS barcode library (e.g. QuaggaJS, jsQR, or any supported lib) to decode barcodes from camera frames.
5. On successful barcode detection:
   - Send `POST` to `/api/invoices/<invoice_id>/items` with body:
     ```json
     { "barcode": "SCANNED_CODE", "quantity": 1 }
     ```
   - Show UI feedback: "Item added"; avoid double-adding the same scan (small debounce).

**AI Prompt Example:**
> "Create a mobile-friendly HTML + JS (or AngularJS) page at `/scan` that reads the `invoice` query parameter, uses `getUserMedia` to access the camera, and uses a barcode library to detect barcodes. On each successful scan, send a POST request to `/api/invoices/<invoice_id>/items` with the barcode and quantity=1, and show a toast/alert when an item is added."

---

### Step 6.3 – Backend Handling of Scanned Barcodes
**Endpoint:**
- `POST /api/invoices/<id>/items`

**Logic:**
1. Ensure invoice exists and is in status `draft`.
2. If request body has `barcode`:
   - Find `product` by `barcode`.
   - If not found, return error (or later allow quick-add).
3. Create or update `invoice_item`:
   - If product already exists on invoice, increase quantity.
   - Otherwise create new item.
4. Recalculate line totals for that item.
5. Return the updated invoice or the new item.

**AI Prompt Example:**
> "In Flask, implement the `POST /api/invoices/<id>/items` endpoint so that when it receives a `barcode`, it finds the product, adds or updates the corresponding invoice_item, recalculates line totals, and returns the updated invoice."

---

### Step 6.4 – Polling on Billing Screen (PC)
**Tasks:**
1. In `BillingController`, set up an `$interval` that every 2 seconds:
   - Calls `GET /api/invoices/<id>`.
   - Updates the list of items and totals on the screen.
2. Stop polling when:
   - Invoice is completed.
   - User leaves the billing page (use `$scope.$on('$destroy', ...)` to cancel interval).

**AI Prompt Example:**
> "In AngularJS, implement polling in the billing controller using `$interval` to fetch `/api/invoices/<id>` every 2 seconds and update the view, cancelling the interval when the controller is destroyed or when the invoice status becomes 'completed'."

---

## PHASE 7 – PDF Generation & Printing

### Step 7.1 – Backend PDF Generation
**Endpoint:**
- `GET /api/invoices/<id>/pdf`

**Approach:**
1. Fetch invoice + items from DB.
2. Render an HTML template of the invoice (Jinja2).
3. Convert HTML to PDF using:
   - `pdfkit` (requires wkhtmltopdf installed), or
   - `WeasyPrint`, or
   - `reportlab` for manual layout.
4. Return PDF as a file response with appropriate headers.

**AI Prompt Example:**
> "In Flask, create an endpoint `/api/invoices/<id>/pdf` that takes an invoice and its items, renders an HTML invoice template, converts it to PDF with pdfkit, and returns it as a downloadable file."

---

### Step 7.2 – Frontend Print & Download
**Tasks:**
1. On billing screen and invoice list:
   - Add a **Print** button.
   - Clicking it opens `/api/invoices/<id>/pdf` in a new browser tab.
   - User uses the browser print dialog or saves it.

**AI Prompt Example:**
> "In AngularJS, add a 'Print Invoice' button that opens `/api/invoices/<id>/pdf` in a new tab using `window.open`, so the user can print or download the invoice."

---

## PHASE 8 – Dashboard & Reports

### Step 8.1 – Reports API
**Endpoints:**
- `GET /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - Returns:
    - `total_sales`
    - `total_tax`
    - `invoice_count`
    - Optionally `top_products` (name, quantity sold).

**AI Prompt Example:**
> "Implement a Flask endpoint `/api/reports/sales` that takes from/to dates, aggregates invoices in that range, and returns total_sales, total_tax, invoice_count, and top products by quantity sold."

---

### Step 8.2 – AngularJS Dashboard & Reports UI
**Tasks:**
1. `/dashboard` page:
   - Show small cards: Today’s Sales, This Week’s Sales, Invoice Count.
2. `/reports` page:
   - Date range selector.
   - Call `/api/reports/sales` with the chosen range.
   - Display results:
     - Totals in summary cards.
     - Table of top products.
     - Optionally a simple chart (using chart library).

**AI Prompt Example:**
> "Create AngularJS controllers and views for a dashboard and reports page that call `/api/reports/sales` and display total sales, total tax, invoice count, and top products in a user-friendly layout."

---

## PHASE 9 – Polish, Security, and Future Android App

### Step 9.1 – Polish & Validation
**Tasks:**
- Add form validation (required fields, numeric checks, etc.).
- Better error handling on frontend (toast notifications, error messages).
- Role-based access (only admins can manage products and users).

---

### Step 9.2 – Deployment Considerations
**Tasks:**
- Decide if you want:
  - Local-only deployment (shop LAN), or
  - Cloud deployment (e.g., EC2) so you can use it from anywhere.
- Setup:
  - Gunicorn or uWSGI + Nginx for Flask.
  - Build production version of frontend (static files served from Nginx or Flask).

---

### Step 9.3 – Future: Native Android Scanner
**Plan:**
- Build Kotlin/Android app that:
  - Uses CameraX or ML Kit/ZXing for barcode scanning.
  - Reads or scans the invoice ID/QR.
  - Calls the same `/api/invoices/<id>/items` endpoint.
- Keep all business logic on the Flask backend.

**AI Prompt Example:**
> "Design an Android (Kotlin) app that scans barcodes using CameraX and sends them to a Flask backend via `/api/invoices/<id>/items`, similar to the existing mobile web scanner flow."

---

## How to Use This Document

- Treat each **Phase** and **Step** as a mini-task.
- For implementation, copy the relevant section (e.g., Phase 5 – Invoice API) and paste it into your AI coding assistant along with your current code.
- Ask it to **implement or update** your project according to that step.

Project Name: **ScanPOS**

This roadmap is meant to be your master reference for building and evolving the system.