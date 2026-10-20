# POSFlow — POS Billing Software

A complete Point-of-Sale and billing system for a textile/retail business,
built with the **MERN stack** (MongoDB, Express, React, Node).

It ships with three portals:

| Portal | URL | Who it's for |
| --- | --- | --- |
| **Admin Portal** (desktop) | `/admin` | Owner/manager: products, staff, suppliers, transactions, returns, ledger, reports |
| **Billing Portal** | `/billing` | Staff: day-to-day billing, payment, printable receipts |
| **Mobile Admin UI** | `/mobile` | The *entire* Admin Portal in an app-style mobile layout (bottom tabs, cards, FABs) |

## 1. Project description

POSFlow covers the full retail billing cycle:

- **Billing Portal (staff)** — search/tap products into a cart, quantity controls,
  customer details, flat discount + GST (0/5/12/18%), Cash/UPI/Card payments,
  cash tendering with automatic change calculation, one-click printable thermal-style
  receipt, and a "My Sales" history. Stock is validated and decremented atomically
  on the server; insufficient stock is rejected.
- **Admin Portal** — Dashboard (today/month KPIs, recent bills, low-stock alerts),
  Product CRUD (SKU, category, size, cost/selling price, stock, low-stock threshold,
  supplier link, search), Staff management (create/edit/activate/deactivate/delete,
  roles), Supplier management, Transaction management (filters, invoice detail,
  cancel with automatic stock restore + ledger reversal), Product returns (partial
  or full, restocked automatically, refund recorded in the ledger, per-line
  returned-quantity tracking so an item can never be returned twice), Ledger
  (auto entries for every sale/refund + manual expenses/capital, credits/debits/net
  balance) and Reports (daily sales chart, payment-method split, top products,
  staff performance, gross profit, discounts, refunds, tax, inventory valuation
  with cost/retail value and category breakdown).
- **Mobile Admin UI** (`/mobile`) — every admin feature above, in a phone-style
  shell (top app bar, bottom tab bar, floating action buttons, card lists). On a
  desktop browser it renders inside a centered phone frame so the mobile experience
  can be reviewed without a device; on a real phone it goes full-screen.
- **Authentication & access control** — JWT (8h expiry) with bcrypt-hashed
  passwords. Roles: `admin` (everything) and `staff` (billing + own sales only).
  Deactivated accounts are rejected at login *and* on every API call. Staff cannot
  see other staff's sales, manage products/staff/suppliers/returns/ledger/reports,
  or cancel invoices.

## 2. Technology stack

- **Frontend:** React 19, Vite, React Router 7, Axios, Lucide icons, custom CSS design system
- **Backend:** Node.js, Express 5, Mongoose 9, JWT, bcryptjs
- **Database:** MongoDB (Atlas in production; falls back to an in-memory MongoDB replica set for local dev so the app always runs)
- **Deployment:** Render single-service (Express serves the built React app; `render.yaml` blueprint included)

## 3. Live / demo URL

| Portal | Live URL |
| --- | --- |
| Login | https://posflow-zj1k.onrender.com/login |
| Admin Portal | https://posflow-zj1k.onrender.com/admin |
| Billing Portal | https://posflow-zj1k.onrender.com/billing |
| Mobile Admin UI | https://posflow-zj1k.onrender.com/mobile |

Source code: https://github.com/Parvathy204/POSFlow

The Render free tier sleeps after ~15 minutes of inactivity, so the first visit
can take 30-60 seconds to wake up.

Local application: http://localhost:5173 (available when running locally)

## 4. Mobile UI URL

Live mobile admin UI: https://posflow-zj1k.onrender.com/mobile

Open the link in a phone browser (or a narrow desktop window) for the full
app-style layout: bottom tab bar, card lists and floating action buttons cover
every admin module. On a wide desktop screen it renders inside a centered phone
frame instead.

Local mobile admin UI: http://localhost:5173/mobile

Local desktop admin portal: http://localhost:5173/admin

Local billing portal: http://localhost:5173/billing

The local URLs are accessible only while the application is running on the development computer.

## 5. Test credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@posflow.com` | `admin123` |
| Staff | `staff@posflow.com` | `staff123` |
| Staff | `pranu12@gmail.com` | `kannan12` |

## 6. Local setup

```bash
# 1. Install dependencies
npm run install:all

# 2. Seed demo data (only needed with a persistent MongoDB)
npm run seed            # skips a database that already has users
npm run seed -- --force # wipes it and re-creates the demo data

# 3. Run the API (Express on :5000) - terminal 1
npm run dev:backend

# 4. Run the React dev server (Vite on :5173) - terminal 2
npm run dev:frontend
```

Open http://localhost:5173 — the Vite dev server proxies `/api` to Express.
(Or run `npm run build` then `npm start` to serve everything from :5000.)

> **No MongoDB needed locally:** if `MONGO_URI` is unset or unreachable, the
> backend automatically starts an in-memory MongoDB (replica set) **and seeds
> the demo accounts/products on first start**, so everything works out of the box.
> Data resets on restart. For a persistent local database, install MongoDB or
> use a free Atlas cluster and set `MONGO_URI` in `backend/.env`
> (see `backend/.env.example`), then run `npm run seed` once.

### Production build (single service)

```bash
npm run build        # builds React app into frontend/dist
cd backend && npm start   # Express serves the API + the built app on one port
```

## 7. Deployment (Render)

1. Push this repository to GitHub.
2. On Render: **New + → Blueprint**, select the repo (picks up `render.yaml`).
3. Create a MongoDB Atlas cluster (or Render-managed MongoDB), copy the connection
   string, and set the `MONGO_URI` env var in the Render service. `JWT_SECRET` is
   auto-generated by the blueprint.
4. Deploy. The service builds the frontend and serves everything from one URL.
5. The service seeds demo data automatically the first time it starts against an
   empty database, so the test accounts above exist right after the first deploy.
   To re-seed later, run `npm run seed -- --force` with `MONGO_URI` pointed at Atlas.

### Moving local data to the deployed database

A fresh Atlas database gets the demo dataset, not the records you entered while
running locally (those live in your local `pos_billing` database). Copy them over
with:

```bash
# backend/.env must contain the Atlas MONGO_URI
npm --prefix backend run migrate:local-db -- --dry-run   # preview counts
npm --prefix backend run migrate:local-db               # copy
```

The script backs up the target database to `.backup/` before replacing anything,
so the demo dataset can be restored if needed.

## 8. API overview

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | public | Login, returns JWT + user |
| POST | `/api/auth/setup-admin` | public (first run) | Create initial admin when no users exist |
| GET | `/api/auth/me` | auth | Current profile |
| GET/POST | `/api/users` | admin | List / create staff |
| PUT/DELETE | `/api/users/:id` | admin | Update / delete staff |
| GET | `/api/products` | auth | List products (search/filter) |
| POST/PUT/DELETE | `/api/products` | admin | Product CRUD |
| GET/POST | `/api/suppliers` | admin | Supplier CRUD |
| PUT/DELETE | `/api/suppliers/:id` | admin | Update / delete supplier |
| GET | `/api/transactions` | auth | Admin: all · Staff: own sales |
| GET | `/api/transactions/:id` | auth | Invoice detail |
| POST | `/api/transactions` | auth | Create sale (stock check + ledger) |
| POST | `/api/transactions/:id/cancel` | admin | Cancel + restock + ledger reversal |
| GET/POST | `/api/returns` | admin | List / process returns (restock + refund ledger) |
| GET/POST | `/api/ledger` | admin | Ledger entries + balance / manual entry |
| GET | `/api/reports/dashboard` | admin | KPIs, recent sales, low stock |
| GET | `/api/reports/sales` | admin | Sales by day/method/top products |
| GET | `/api/reports/staff` | admin | Staff performance |
| GET | `/api/reports/inventory` | admin | Inventory valuation |

## 9. Project structure

```
backend/
  config/db.js         # DB connect + in-memory fallback
  lib/txn.js           # transactions with standalone-mongod fallback
  lib/seedData.js      # demo data (auto-seeded for the in-memory DB)
  middleware/auth.js   # JWT auth + admin guard
  models/              # User, Product, Supplier, Transaction, Return, LedgerEntry
  routes/              # auth, users, products, suppliers, transactions, returns, ledger, reports
  seed.js              # demo data
  server.js
frontend/
  src/
    pages/admin/       # desktop admin portal (8 modules)
    pages/billing/     # POS billing portal
    pages/mobile/      # mobile admin UI (app-style shell)
    components/        # shared UI
    auth.jsx, api.js, utils/
```

## 10. Notes & assumptions

- Prices are in ₹ (INR); GST rates offered are 0/5/12/18% (configurable per bill).
- Returns are processed against the original invoice; returned units are restocked
  and refunded at the original selling price; per-line `returnedQuantity` prevents
  over-returns.
- Cancelling an invoice (admin) restores stock and writes a compensating ledger
  entry; only fully-returned/partially-returned invoices must go through Returns.
- Ledger is auto-maintained (sale = credit, refund/cancellation = debit) plus
  manual Expense/Capital/Adjustment entries.
- Local MongoDB standalone servers don't support multi-document transactions; the
  backend detects this and degrades gracefully (fine for dev). Production (Atlas)
  uses real transactions for atomic stock+sale+ledger writes.
