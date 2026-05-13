# JewelFlow — Split Frontend + Backend Architecture

JewelFlow is a jewellery raw-material & vendor management system. This repository is a **monorepo** with two independent services that were extracted from the original Next.js monolith (still preserved at `jewelflow/` for reference).

```
.
├── backend/        Express + Prisma REST API     (port 4000)
├── frontend/       Next.js 14 App Router UI      (port 3000)
├── jewelflow/      ORIGINAL monolith (do not edit, kept as historical reference)
├── docker-compose.yml
├── package.json    Root scripts (concurrently runs both)
└── README.md
```

---

## Architecture Overview

```
┌────────────────────────┐        HTTPS / fetch + cookie         ┌──────────────────────────┐
│   frontend  :3000      │ ───────────────────────────────────▶  │   backend  :4000         │
│   Next.js (App Router) │ ◀───────  JSON + Set-Cookie  ───────  │   Express + Prisma       │
│                        │                                        │                          │
│   - Pages, components  │                                        │   - REST routes /api/*   │
│   - i18n (en/hi)       │                                        │   - JWT + bcrypt auth    │
│   - middleware checks  │                                        │   - Business logic       │
│     auth cookie        │                                        │   - Zod validation       │
│   - lib/api.ts wraps   │                                        │   - SQLite or Postgres   │
│     all fetch calls    │                                        │                          │
└────────────────────────┘                                        └──────────────────────────┘
                                                                              │
                                                                              ▼
                                                                    ┌─────────────────┐
                                                                    │  Prisma + DB    │
                                                                    │  (SQLite / PG)  │
                                                                    └─────────────────┘
```

### What changed vs the monolith

| Concern | Monolith (`jewelflow/`) | Split architecture |
|---|---|---|
| API routes | `src/app/api/**/route.ts` (Next.js handlers) | `backend/src/routes/*` + `backend/src/controllers/*` (Express) |
| Database | Prisma client imported anywhere | Lives **only** in `backend/src/lib/prisma.ts` |
| Business logic | `src/lib/business.ts` | Moved verbatim to `backend/src/lib/business.ts` |
| Auth helpers | `src/lib/auth.ts` (uses `next/headers`) | `backend/src/lib/auth.ts` (uses Express `Request`/`Response`) |
| Auth gate (server) | `getCurrentUser()` in RSC layout via Prisma | Replaced by client-side `/api/auth/me` ping |
| Auth gate (edge) | `middleware.ts` cookie check | Same, just renamed cookie reads to be JWT-only (no DB) |
| Frontend fetch | `fetch("/api/...")` | `api("/api/...")` from `lib/api.ts` (prepends `NEXT_PUBLIC_API_URL`, sets `credentials: "include"`) |
| i18n | Inside Next.js | Stays in frontend (locales not relevant to backend) |
| Seeds & schema | `prisma/` at root of monolith | `backend/prisma/` |

---

## Authentication: how it works across two origins

The backend keeps the existing **JWT in an `httpOnly` cookie** strategy.

The trick to make this work across `http://localhost:3000` (frontend) and `http://localhost:4000` (backend) is two things working together:

1. **Backend sets the cookie with `Domain=localhost`**, so it's stored against the bare hostname rather than a port. Both ports then share it.
2. **Frontend's `lib/api.ts` always sends `credentials: "include"`**, and **backend's CORS allows credentials** for `FRONTEND_URL` (no `*` wildcard).

```
POST  http://localhost:4000/api/auth/login          ◀── browser sends cookies
        Set-Cookie: jewelflow_token=…;
                    HttpOnly; SameSite=Lax;
                    Domain=localhost; Path=/

GET   http://localhost:3000/dashboard               ◀── Next.js middleware reads cookie
        cookie present → render
        cookie missing → 302 /login

GET   http://localhost:4000/api/dashboard/summary   ◀── backend verifies JWT
        valid   → 200 + JSON
        invalid → 401
```

In production, configure both services under one parent domain and set
`COOKIE_DOMAIN=.yourdomain.com` so the cookie is shared between
`api.yourdomain.com` and `app.yourdomain.com` (both with HTTPS, `Secure`,
`SameSite=Lax`).

The backend also accepts `Authorization: Bearer <token>` as a fallback so
non-browser clients (mobile apps, scripts, integration tests) can call the
API without juggling cookies. The login response includes the token in the
JSON body for that purpose.

---

## Quick Start (local, no Docker)

### 1. Install dependencies (all three: root + backend + frontend)
```bash
npm run install:all
```

### 2. Configure environment
- `backend/.env`  — already populated for the SQLite demo. Adjust `JWT_SECRET` and `FRONTEND_URL` as needed.
- `frontend/.env.local` — already populated with `NEXT_PUBLIC_API_URL=http://localhost:4000`.

### 3. Initialize the database (Prisma generate + push + seed demo data)
```bash
npm run db:setup
```

### 4. Start both services in parallel
```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3000 |
| Backend (Express)  | http://localhost:4000 |
| Health check       | http://localhost:4000/api/health |

### Demo credentials
| Role  | Email                  | Password   |
|-------|------------------------|------------|
| Admin | `admin@jewelflow.in`   | `Admin@123` |
| User  | `user@jewelflow.in`    | `User@123`  |

---

## Quick Start (Docker)

```bash
# Build and start both services. Backend runs migrations on first boot.
docker compose up --build

# In a separate terminal, seed the demo data inside the running backend container:
docker compose exec backend npm run db:seed
```

Then open http://localhost:3000.

---

## Root scripts

| Script | What it does |
|---|---|
| `npm run install:all`    | Installs dependencies for root, backend, and frontend |
| `npm run dev`            | Runs backend (:4000) + frontend (:3000) in parallel via `concurrently` |
| `npm run dev:backend`    | Backend only |
| `npm run dev:frontend`   | Frontend only |
| `npm run build`          | Builds both services for production |
| `npm run start`          | Starts both built services in parallel |
| `npm run db:setup`       | Generate Prisma client, push schema, seed demo data |
| `npm run db:seed`        | Re-seed demo data |
| `npm run db:reset`       | Drop, recreate, and re-seed the database |
| `npm run docker:up`      | `docker compose up --build` |
| `npm run docker:down`    | `docker compose down` |

---

## Backend

### Folder structure
```
backend/
├── prisma/
│   ├── schema.prisma          # SQLite default, Postgres-ready
│   ├── seed.ts                # Demo users / vendors / purchases / issues
│   └── dev.db                 # Generated by db:push
├── src/
│   ├── lib/
│   │   ├── prisma.ts          # PrismaClient singleton
│   │   ├── auth.ts            # JWT sign/verify, cookie helpers, bcrypt
│   │   ├── business.ts        # computeStock, computeVendorBalances, detectOverdue
│   │   └── utils.ts           # purityToFraction
│   ├── middleware/
│   │   ├── requireAuth.ts     # 401 if no/invalid JWT, attaches req.user
│   │   ├── requireAdmin.ts    # 403 if role !== ADMIN
│   │   └── errorHandler.ts    # JSON 404 + 500 handlers
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── materials.controller.ts
│   │   ├── vendors.controller.ts
│   │   ├── issues.controller.ts
│   │   ├── receives.controller.ts
│   │   ├── reports.controller.ts
│   │   ├── notifications.controller.ts
│   │   └── health.controller.ts
│   ├── routes/
│   │   ├── *.routes.ts        # one file per domain
│   │   └── index.ts           # mounts everything under /api
│   ├── app.ts                 # Express app factory (CORS, helmet, cookie-parser, morgan)
│   └── server.ts              # Boots the HTTP server
├── .env / .env.example
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Environment variables (`backend/.env`)
```bash
PORT=4000
NODE_ENV=development

# Supabase Postgres
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase service keys (used by @supabase/supabase-js for admin operations)
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_ANON_KEY="your-anon-key"

JWT_SECRET="please-change-me"
JWT_EXPIRES_IN="30m"
FRONTEND_URL="http://localhost:3000"
COOKIE_DOMAIN="localhost"                  # ".yourdomain.com" in prod
```

### Connecting to Supabase

The backend is wired for Supabase Postgres out of the box.

1. **Create a project** at [supabase.com](https://supabase.com) and grab the **connection strings** from `Project Settings → Database`:
   - `DATABASE_URL` → use the **Connection pooling** URI (note: Supabase's pooler typically runs on port `6543`; the placeholder uses `5432` so update if needed). Append `?pgbouncer=true`.
   - `DIRECT_URL` → use the **URI** under "Connection string" (port `5432`, no `pgbouncer` flag). Prisma needs this for migrations.
2. Grab the API keys from `Project Settings → API`:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (public — fine to expose)
   - `SUPABASE_SERVICE_ROLE_KEY` (secret — backend only, bypasses RLS)
3. Paste them into `backend/.env`.
4. Run the migration + seed:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma migrate dev --name init     # or: npx prisma db push
   npm run db:seed
   ```

The Supabase admin SDK is also available at `backend/src/lib/supabase.ts` for any non-relational work (Storage, Auth admin, RPC calls, etc.). Day-to-day relational queries should still go through Prisma.

### ID format note

The schema uses `String @id @default(uuid())` — IDs are UUIDs everywhere. The frontend and backend types are aligned (`vendorId: string`, etc.). If you previously had any code or external integrations that assumed integer IDs, you'll need to update them.

### REST endpoints (all under `/api`)
Identical to the monolith — only the host changes from `:3000/api/...` to `:4000/api/...`.

| Group | Routes |
|---|---|
| **Auth** | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| **Dashboard** | `GET /dashboard/summary`, `GET /dashboard/trends`, `GET /dashboard/recent` |
| **Materials** | `GET/POST /materials`, `PUT/DELETE /materials/:id` (admin), `GET /materials/stock` |
| **Vendors** | `GET/POST /vendors`, `GET/PUT /vendors/:id`, `GET /vendors/:id/balance` |
| **Issues** | `GET/POST /issues`, `GET/PUT /issues/:id`, `GET /issues/overdue` |
| **Receives** | `GET/POST /receives`, `GET /receives/:id` |
| **Reports** | `GET /reports/stock`, `GET /reports/vendor-pending`, `GET /reports/production`, `GET /reports/wastage` |
| **Notifications** | `GET /notifications`, `GET /notifications/unread-count`, `PUT /notifications/:id/read` |
| **Health** | `GET /health` |

---

## Frontend

### Folder structure
```
frontend/
├── src/
│   ├── app/
│   │   ├── (app)/             # Authenticated layout group (no SSR auth — relies on middleware)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── materials/page.tsx
│   │   │   ├── vendors/page.tsx + [id]/page.tsx
│   │   │   ├── issues/page.tsx
│   │   │   ├── receives/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   ├── reminders/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── login/page.tsx
│   │   ├── layout.tsx         # Root html/body + Providers
│   │   ├── page.tsx           # Client redirect to /dashboard or /login
│   │   └── globals.css
│   ├── components/            # sidebar, header, stat-card, language-toggle, ui/*
│   ├── lib/
│   │   ├── api.ts             # fetch wrapper — prepends NEXT_PUBLIC_API_URL, sends cookies
│   │   ├── i18n.ts            # i18next bootstrap
│   │   └── utils.ts           # cn, formatINR, formatNumber, formatDate, purityToFraction
│   ├── locales/
│   │   ├── en.json
│   │   └── hi.json
│   └── middleware.ts          # Token-only auth gate (cookie presence → redirect)
├── .env.local / .env.example  # NEXT_PUBLIC_API_URL
├── Dockerfile
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

### Environment variables (`frontend/.env.local`)
```bash
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_APP_NAME="JewelFlow"
```

### How frontend talks to backend
Every page uses the wrapper from `frontend/src/lib/api.ts`:

```ts
import { api, apiFetch } from "@/lib/api";

const summary = useQuery({
  queryKey: ["summary"],
  queryFn: () => api("/api/dashboard/summary"),
});

await apiFetch("/api/issues", { method: "POST", body: { vendorId, ... } });
```

The wrapper:
- Prepends `NEXT_PUBLIC_API_URL` (so `/api/dashboard/summary` becomes `http://localhost:4000/api/dashboard/summary`).
- Always sends `credentials: "include"` so the JWT cookie travels cross-origin.
- Auto-sets `Content-Type: application/json` and `JSON.stringify`s the body.
- Throws a typed `Error` with `.status` for non-2xx responses (when using `api()`).

---

## Production deployment notes

1. **Use a single parent domain**:
   - `app.yourdomain.com`  → frontend (Next.js)
   - `api.yourdomain.com`  → backend (Express)
2. Set `COOKIE_DOMAIN=.yourdomain.com` in the backend so the cookie is shared between subdomains.
3. Set `FRONTEND_URL=https://app.yourdomain.com` in the backend so CORS allows it.
4. Set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com` in the frontend build env (it gets baked into the bundle at `next build` time).
5. Set `NODE_ENV=production` everywhere — this flips the auth cookie to `Secure: true`.
6. Use PostgreSQL instead of SQLite (see "Switching to PostgreSQL" above).
7. Rotate `JWT_SECRET` to a long random value (e.g. `openssl rand -hex 32`).

---

## License

Proprietary — JewelFlow client demo. © 2026.
