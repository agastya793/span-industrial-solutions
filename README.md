# SPAN Industrial Solutions Pvt Ltd

[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%206-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Cloudflare Pages](https://img.shields.io/badge/Hosting-Cloudflare%20Pages-F38020?logo=cloudflarepages&logoColor=white)](https://pages.cloudflare.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Serverless-Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Database-Cloudflare%20D1%20(SQLite)-F38020?logo=sqlite&logoColor=white)](https://developers.cloudflare.com/d1/)
[![Resend](https://img.shields.io/badge/Email-Resend-000000?logo=resend&logoColor=white)](https://resend.com/)
[![ISO 9001:2015](https://img.shields.io/badge/Certified-ISO%209001%3A2015-0b2545)](https://www.iso.org/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)]()

> Official digital portal and enterprise inquiry backend for **SPAN Industrial Solutions Pvt Ltd** — an ISO 9001:2015 certified company powering workforce management, manufacturing cost reduction, shop-floor technical upskilling, and self-paced industrial learning solutions across India.

---

## 📌 1. Project Overview & Key Capabilities

**SPAN Industrial Solutions Pvt Ltd** partners with automotive Tier-1 suppliers, precision engineering plants, packaging manufacturers, and electronics assembly lines across India to deliver measurable operational excellence.

### Core Industrial Verticals
1. **Workforce Management Solutions**: Multi-tier vetted staffing for CNC/VMC machinists, press tool makers, CMM quality inspectors, welding technicians, assembly operators, and plant leadership.
2. **Guaranteed Saving Program (GET SHRINK)**: 5 proven practical shop-floor tools targeting 20% to 30% reduction in manufacturing operational expenses without capital expenditure (Capex).
3. **Experts Training for Industries**: Shop-floor technical training delivered by veterans across 10 curriculum modules (*Kaizen*, *7 QC Tools*, *5S*, *GD&T*, *Engineering Drawings*, *QMS/IATF 16949*, *Inventory Flow*, *APQP/PPAP*).
4. **Self-Paced Learning & Video Solutions**: Digital standard operating procedure (SOP) modules, plant walk-throughs, safety compliance media, and technical capability demonstrations.

### Digital Platform Capabilities
- **Single-Page Application (SPA)**: React 19 and TypeScript with responsive navigation, interactive service modals, state/city industrial cluster selectors, and an interactive Non-Disclosure Agreement (NDA) viewer.
- **Serverless Edge Backend**: Express application hosted on Cloudflare Workers using the `cloudflare:node` bridge and `AsyncLocalStorage` request-context isolation.
- **Edge Persistence**: Cloudflare D1 (serverless SQLite) with parameterized prepared statements, automated primary keys, and indexed queries.
- **Transactional Notifications**: Automated executive email notifications dispatched via Resend to the corporate solutions desk.
- **Dual-Mode Architecture**: Cloudflare-native edge infrastructure for production, with seamless local Node.js/Express development utilizing PostgreSQL or an automatic in-memory fallback.

### Live Production Endpoints
- **Primary Website**: [https://spanindustrialsolutions.com](https://spanindustrialsolutions.com)
- **Alternative Domain**: [https://www.spanindustrialsolutions.com](https://www.spanindustrialsolutions.com)
- **Frontend Hosting**: Cloudflare Pages (`span-industrial-solutions`)
- **Backend API Worker**: [https://span-industrial-api.ankitbathla-ind.workers.dev](https://span-industrial-api.ankitbathla-ind.workers.dev)
- **Source Repository**: [https://github.com/agastya793/span-industrial-solutions](https://github.com/agastya793/span-industrial-solutions) (`main` branch)

---

## 📋 2. Table of Contents

- [1. Project Overview & Key Capabilities](#-1-project-overview--key-capabilities)
- [2. Table of Contents](#-2-table-of-contents)
- [3. Production Architecture](#-3-production-architecture)
- [4. Repository Structure](#-4-repository-structure)
- [5. Technologies & Dependencies](#-5-technologies--dependencies)
- [6. Local Installation & Development](#-6-local-installation--development)
- [7. Environment Variables & Secret Management](#-7-environment-variables--secret-management)
- [8. Cloudflare D1 Schema & Database Inspection](#-8-cloudflare-d1-schema--database-inspection)
- [9. Local Node/Express Database Architecture](#-9-local-nodeexpress-database-architecture)
- [10. Frontend API Connectivity & Vite Proxy](#-10-frontend-api-connectivity--vite-proxy)
- [11. Automated Testing & Production Builds](#-11-automated-testing--production-builds)
- [12. Cloudflare Pages Deployment](#-12-cloudflare-pages-deployment)
- [13. Cloudflare Workers Deployment](#-13-cloudflare-workers-deployment)
- [14. Resend Email Notifications & Status](#-14-resend-email-notifications--status)
- [15. Security Hardening](#-15-security-hardening)
- [16. Troubleshooting & Operational Runbook](#-16-troubleshooting--operational-runbook)
- [17. Production Readiness Checklist](#-17-production-readiness-checklist)

---

## 🏗️ 3. Production Architecture

The production environment operates entirely on Cloudflare's serverless edge network, separating static asset delivery from backend edge computation and storage.

```mermaid
flowchart TD
    subgraph ClientLayer["Client Layer (Browser)"]
        User["Corporate Visitor / Client"]
    end

    subgraph CloudflarePages["Cloudflare Pages (span-industrial-solutions)"]
        PagesEdge["Edge CDN & Static Hosting\nhttps://spanindustrialsolutions.com"]
        ReactApp["React 19 + TypeScript + Vite SPA\n(VITE_API_BASE_URL configured)"]
        PagesEdge --> ReactApp
    end

    subgraph CloudflareWorker["Cloudflare Worker (span-industrial-api)"]
        WorkerEntry["Worker Fetch Handler\nhttps://span-industrial-api.ankitbathla-ind.workers.dev"]
        RateLimiter["Edge Rate Limiter\nINQUIRY_RATE_LIMITER (10 req/60s)"]
        NodeBridge["cloudflare:node Bridge\nhttpServerHandler (Port 8080)"]
        ExpressApp["Express App\n(CORS, Helmet, Context Middleware)"]
        InquiryRoute["Inquiry Controller\n(Input Validation & Sanitization)"]

        WorkerEntry --> RateLimiter
        RateLimiter --> NodeBridge
        NodeBridge --> ExpressApp
        ExpressApp --> InquiryRoute
    end

    subgraph CloudflareD1["Cloudflare D1 (span-industrial-d1)"]
        D1Binding["Binding: span_industrial_d1"]
        InquiriesTable[("inquiries Table\n(Serverless SQLite)")]
        D1Binding --> InquiriesTable
    end

    subgraph ExternalServices["External Notification Services"]
        ResendAPI["Resend REST API\n(Encrypted Secret: RESEND_API_KEY)"]
        CorporateInbox["Corporate Solutions Inbox\nINFOSPAN.UKD@gmail.com"]
        ResendAPI --> CorporateInbox
    end

    User -->|"1. Visit Site (HTTPS)"| PagesEdge
    User -->|"2. Submit RFQ / Inquiry"| WorkerEntry
    InquiryRoute -->|"3. Prepared Statement INSERT"| D1Binding
    InquiryRoute -.->|"4. Async Notification Dispatch"| ResendAPI
```

---

## 📂 4. Repository Structure

```text
span-industrial-solutions/
├── client/                               # Frontend React 19 + TypeScript SPA
│   ├── public/                           # Static industrial media, photography & favicon
│   ├── src/
│   │   ├── components/                   # UI components (Header, Hero, About, Services,
│   │   │                                 # Contact form, NDAModal, ServiceModal, Footer)
│   │   ├── data/
│   │   │   └── indiaLocations.ts         # 357+ Indian industrial clusters & SEZ datasets
│   │   ├── styles/                       # Component styles & ambient studio tokens
│   │   ├── types/
│   │   │   └── inquiry.ts                # Inquiry form data models & service types
│   │   ├── utils/
│   │   │   └── api.ts                    # Dynamic getApiUrl helper for Pages & Vite proxy
│   │   ├── App.tsx                       # Root view layout & navigation state
│   │   ├── index.css                     # Design system tokens, typography & CSS reset
│   │   ├── main.tsx                      # Vite React 19 application mount point
│   │   └── vite-env.d.ts                 # TypeScript declarations for VITE_API_BASE_URL
│   ├── package.json                      # Client dependencies and build scripts
│   ├── tsconfig.json                     # Client TypeScript compilation settings
│   └── vite.config.ts                    # Vite config & local reverse proxy (/api -> :5000)
│
├── server/                               # Backend API Service
│   ├── dist/                             # Compiled TypeScript output (local Node server)
│   ├── migrations/                       # Database schema migrations
│   │   ├── 001_create_inquiries.sql      # Generic PostgreSQL schema (for local Node dev)
│   │   └── d1/
│   │       └── 0001_create_inquiries.sql # Cloudflare D1 schema (production SQLite)
│   ├── src/
│   │   ├── config/
│   │   │   ├── context.ts                # AsyncLocalStorage request-scoped context
│   │   │   ├── db.ts                     # Database abstraction (D1 edge + local pg pool)
│   │   │   └── env.ts                    # Dynamic configuration getters
│   │   ├── controllers/                  # inquiryController.ts, health checks
│   │   ├── middleware/                   # errorHandler.ts, rateLimiter.ts
│   │   ├── routes/                       # inquiryRoutes.ts, healthRoutes.ts
│   │   ├── services/                     # inquiryService.ts, emailService.ts (Resend)
│   │   ├── types/                        # Inquiry interfaces & Cloudflare types
│   │   ├── utils/                        # Structured logger
│   │   ├── validators/                   # Input sanitization, honeypot & regex checks
│   │   ├── app.ts                        # Express factory (shared by Node and Worker)
│   │   ├── index.ts                      # Standalone Node.js entry point (local dev)
│   │   └── worker.ts                     # Cloudflare Worker entry point (production edge)
│   ├── test/                             # Automated test suites (Node.js test runner)
│   │   ├── frontendApiUrl.test.ts        # API URL construction & proxy preservation tests
│   │   ├── inquiryApi.test.ts            # Input validation, sanitization & security tests
│   │   └── requestIsolation.test.ts      # Context isolation, D1 queries & rate limit tests
│   ├── package.json                      # Server dependencies & test scripts
│   └── tsconfig.json                     # Server TypeScript configuration
│
├── .env.example                          # Local environment variable template
├── package.json                          # Monorepo orchestration scripts
├── wrangler.jsonc                        # Cloudflare Worker & D1 production configuration
└── README.md                             # Repository architecture and maintenance guide
```

---

## 💻 5. Technologies & Dependencies

| Area | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^19.2.8` | Component architecture & client-side rendering |
| **Frontend Language** | TypeScript | `~6.0.2` | Client static typing and interface enforcement |
| **Frontend Bundler** | Vite | `^8.3.0` | Development server, bundling, and local proxy |
| **UI Icons** | Lucide React | `^1.52.0` | Industrial iconography |
| **Edge Compute** | Cloudflare Workers | Compatibility: `2026-10-13` | Serverless API runtime running Express via `cloudflare:node` |
| **Edge Database** | Cloudflare D1 | Engine: SQLite | Serverless relational storage for customer inquiries |
| **Edge Rate Limiting** | Cloudflare Rate Limiter | Namespace: `1001` | IP-based thresholding (10 inquiries / 60 seconds) |
| **Static Hosting** | Cloudflare Pages | - | Global CDN hosting for the compiled React SPA |
| **Email API** | Resend | `^6.32.1` | Transactional corporate email delivery |
| **Local Web Server** | Express | `^4.21.2` | HTTP request routing and middleware pipeline |
| **Local Database Engine**| PostgreSQL / `pg` | `^8.23.1` | Local Node.js development database driver |
| **HTTP Security** | Helmet | `^8.0.0` | Secure response headers |
| **Dev Orchestration** | Concurrently | `^9.2.5` | Simultaneous client and server local execution |

---

## 🛠️ 6. Local Installation & Development

### Prerequisites
- **Node.js**: `v18.0.0` or higher (`v20+` recommended)
- **npm**: `v9.0.0` or higher
- **Local PostgreSQL** *(Optional)*: If not configured, the local server automatically falls back to an in-memory store.

### 1. Repository Setup
```bash
git clone https://github.com/agastya793/span-industrial-solutions.git
cd span-industrial-solutions
npm install
npm install --prefix client
npm install --prefix server
```

### 2. Configure Local Environment
Copy the example environment configuration:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

### 3. Start Local Development
Start both the Vite client server and the Express backend concurrently:
```bash
npm run dev
```

The services will initialize at:
- **Frontend SPA**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Health Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 4. Running Components Independently
```bash
npm run dev:client      # Runs only the Vite client dev server
npm run dev:server      # Runs only the Express server with tsx watch
npm run preview:client  # Serves the client production build locally
```

---

## 🔐 7. Environment Variables & Secret Management

### Production Cloudflare Worker Configuration
Configured in [`wrangler.jsonc`](file:///c:/Users/acer/span-industrial-solutions/wrangler.jsonc):

| Variable / Binding | Type | Configured Value / Description |
| :--- | :--- | :--- |
| `NODE_ENV` | Variable | `"production"` |
| `CORS_ORIGIN` | Variable | `"https://spanindustrialsolutions.com,https://www.spanindustrialsolutions.com"` |
| `RESEND_TO_EMAIL` | Variable | `"INFOSPAN.UKD@gmail.com"` |
| `RESEND_FROM_EMAIL` | Variable | `"notifications@spanindustrialsolutions.com"` |
| `span_industrial_d1` | D1 Binding | Database ID: `6587abf9-8719-4af0-95f1-7194da2d6459` |
| `INQUIRY_RATE_LIMITER` | Rate Limiter | Limit: 10 requests / 60 seconds |
| `RESEND_API_KEY` | **Encrypted Secret** | Must be added via `npx wrangler secret put RESEND_API_KEY` |

> [!CAUTION]
> **Secret Protection**: `RESEND_API_KEY` must **never** be placed in `wrangler.jsonc`, frontend code, or git repositories. It must be set strictly through Cloudflare's encrypted secrets store.

### Production Cloudflare Pages Configuration
Configured in the **Cloudflare Dashboard &rarr; Pages &rarr; Settings &rarr; Environment variables**:

| Variable Name | Environment | Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Production & Preview | `https://span-industrial-api.ankitbathla-ind.workers.dev` | Directs client API calls to the Worker |

> [!WARNING]
> **Client-Side Exposure**: Any variable prefixed with `VITE_` is baked directly into client JavaScript bundles and is publicly readable by anyone inspecting the browser network tab. Never store API keys, tokens, or private secrets in `VITE_` variables.

### Local Development (`.env`)
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/spandb

# Optional Resend API key for local email dispatch testing
RESEND_API_KEY=
RESEND_FROM_EMAIL=SPAN Industrial Solutions <onboarding@resend.dev>
RESEND_TO_EMAIL=infospan.ukd@gmail.com
```

---

## 🗄️ 8. Cloudflare D1 Schema & Database Inspection

Cloudflare D1 serves as the production database engine (`span-industrial-d1`). It operates SQLite at edge locations with automatic replication.

### Production D1 Schema (`server/migrations/d1/0001_create_inquiries.sql`)
```sql
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  state TEXT,
  city TEXT,
  service TEXT NOT NULL,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);
CREATE INDEX IF NOT EXISTS idx_inquiries_service ON inquiries(service);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
```

### Read-Only Inspection Commands

To query the live production database safely without modifying records:

```powershell
# Check total inquiries stored in production
npx wrangler d1 execute span-industrial-d1 --remote --command="SELECT COUNT(*) AS total_enquiries FROM inquiries;"

# Inspect the 5 most recent inquiries (excluding message body)
npx wrangler d1 execute span-industrial-d1 --remote --command="SELECT id, name, company, email, phone, service, created_at FROM inquiries ORDER BY id DESC LIMIT 5;"

# Check table schema and index definitions
npx wrangler d1 execute span-industrial-d1 --remote --command="SELECT name, type, sql FROM sqlite_master WHERE tbl_name='inquiries';"
```

### Applying Migrations (Modifies Remote Database)

> [!WARNING]
> The following command executes DDL modifications against the live production database. Execute only when new migration files have been created in `server/migrations/d1/`.

```powershell
# Apply pending schema migrations to remote production D1
npx wrangler d1 migrations apply span-industrial-d1 --remote
```

---

## 🔄 9. Local Node/Express Database Architecture

An intentional distinction is maintained between production and local development database access:

1. **Production Edge (Cloudflare Worker)**:
   - Uses Cloudflare D1 exclusively (`span_industrial_d1`).
   - Prepared statements bind arguments via SQLite parameterized queries (`?`).
   - Neon and Cloudflare Hyperdrive configurations have been decommissioned and removed. Historical records were intentionally not migrated (accepted project decision).
2. **Local Node.js Development Server (`server/src/index.ts`)**:
   - Uses generic PostgreSQL drivers (`pg.Pool`) when `DATABASE_URL` is configured.
   - Initialized via `server/migrations/001_create_inquiries.sql`.
   - **Resilient Fallback**: If PostgreSQL credentials are missing or the local database server is offline, the backend issues a log warning and routes submissions to an internal memory store, allowing frontend and UI testing to continue uninterrupted.

---

## 🌐 10. Frontend API Connectivity & Vite Proxy

### Dynamic Base URL Construction
All client API calls pass through [`client/src/utils/api.ts`](file:///c:/Users/acer/span-industrial-solutions/client/src/utils/api.ts):

```typescript
export function getApiUrl(
  path: string,
  baseUrl: string | undefined = (import.meta as any)?.env?.VITE_API_BASE_URL
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!baseUrl || typeof baseUrl !== 'string' || !baseUrl.trim()) {
    return normalizedPath;
  }
  return `${baseUrl.trim().replace(/\/+$/, '')}${normalizedPath}`;
}
```

### How Routing Behaves in Different Environments

| Environment | `VITE_API_BASE_URL` | Request Target | Behavior |
| :--- | :--- | :--- | :--- |
| **Local Dev (`npm run dev`)** | *Unset / Empty* | Relative: `/api/inquiries` | Vite proxies `/api` to `http://localhost:5000` |
| **Local Preview (`npm run preview`)** | *Unset / Empty* | Relative: `/api/inquiries` | Vite preview proxies `/api` to `http://localhost:5000` |
| **Cloudflare Pages Production** | Configured | `https://span-industrial-api.ankitbathla-ind.workers.dev/api/inquiries` | Direct cross-origin request to Cloudflare Worker |

### Vite Proxy Configuration (`client/vite.config.ts`)
```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

---

## 🧪 11. Automated Testing & Production Builds

### 1. Running the Automated Test Suite
The backend test suite executes 52 tests across 3 suites using Node.js's native test runner (`tsx --test`):

```powershell
npm test --prefix server
```

**Test Coverage Summary:**
- **Inquiry Validation & Security (9 tests)**: XSS sanitization, honeypot spam detection, invalid email/phone rejection, and error message sanitization.
- **Request Context & Isolation (32 tests)**: Concurrency isolation, D1 prepared statements, edge rate limiting thresholds (HTTP 429), CORS origin validation, and verification that Worker runtime cannot access `DATABASE_URL`.
- **Frontend URL & Proxy Construction (6 tests)**: Relative fallback, trailing slash normalization, and production Worker URL generation.

### 2. Running Production Builds
Compile both frontend assets and server TypeScript:
```powershell
npm run build
```
- **Client Output**: Transpiles to `client/dist/` with optimized gzip chunks (`assets/index-*.js`, `assets/index-*.css`).
- **Server Output**: Compiles TypeScript into `server/dist/`.

### 3. Worker Deployment Dry-Run
Validate that Worker configuration and bundle size are correct without deploying:
```powershell
npx wrangler deploy --dry-run
```

---

## 🚀 12. Cloudflare Pages Deployment

The frontend single-page application is hosted on Cloudflare Pages with automated git-driven deployments.

### Pages Project Settings
- **Project Name**: `span-industrial-solutions`
- **GitHub Repository**: `agastya793/span-industrial-solutions`
- **Production Branch**: `main`
- **Framework Preset**: `Vite`
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: `https://span-industrial-api.ankitbathla-ind.workers.dev`
- **Custom Domains**:
  - `spanindustrialsolutions.com` (Primary apex domain)
  - `www.spanindustrialsolutions.com` (Canonical CNAME record)

---

## ⚡ 13. Cloudflare Workers Deployment

The backend API is powered by Cloudflare Workers, defined in [`wrangler.jsonc`](file:///c:/Users/acer/span-industrial-solutions/wrangler.jsonc).

### Worker Deployment Commands

```powershell
# 1. Configure the encrypted Resend API Key (One-time or rotation)
npx wrangler secret put RESEND_API_KEY

# 2. Verify compilation and bundle packaging
npx wrangler deploy --dry-run

# 3. Deploy Worker to production
npx wrangler deploy

# 4. Stream real-time Worker execution logs
npx wrangler tail span-industrial-api
```

---

## 📧 14. Resend Email Notifications & Status

### The Complete Inquiry Lifecycle
When a client submits the corporate contact form:
1. **Frontend Submission**: Form validates client inputs, packages payload, and executes `fetch(getApiUrl('/api/inquiries'))`.
2. **Edge Rate Limiting**: Cloudflare Rate Limiter checks the visitor's IP (`cf-connecting-ip`). If >10 requests in 60s, it immediately returns `HTTP 429 Too Many Requests`.
3. **Payload Sanitization**: HTML brackets (`<>`) and non-printable control characters are stripped. The hidden honeypot field (`_hp_website`) is evaluated.
4. **D1 Database Persistence**: An `INSERT INTO inquiries ... RETURNING id, ...` prepared statement executes against D1.
5. **Asynchronous Notification**: The Worker initializes Resend and dispatches an executive HTML/plain-text email to `INFOSPAN.UKD@gmail.com` from `notifications@spanindustrialsolutions.com`.
6. **HTTP Response**: The endpoint returns `HTTP 201 Created` with inquiry confirmation.

> [!IMPORTANT]
> **Decoupled Delivery**: An inquiry returning `HTTP 201 Created` and being safely recorded in D1 does **not** prove that the email notification arrived in the inbox. Email delivery is non-blocking so that third-party email provider outages do not fail customer inquiries.

### Current Notification Status & Incident History
- **Domain Verification**: The sender domain `spanindustrialsolutions.com` is verified with SPF and DKIM on Resend.
- **Incident History**: Production logs previously emitted `Resend email delivery failure: status=429, message=Reached the daily sending quota`.
- **Resolution**: An updated Resend API key was provisioned and stored in Cloudflare Worker secrets.
- **Verification Status**: *Pending live verification*. A live test confirming successful email receipt after the quota error has not yet been executed.

---

## 🛡️ 15. Security Hardening

- **Edge IP Rate Limiting**: Protected by Cloudflare Rate Limiting (`INQUIRY_RATE_LIMITER`), limiting requests by true client IP (`cf-connecting-ip`) rather than forgeable proxy headers.
- **SQL Injection Prevention**: All D1 database writes use parameterized prepared statements (`d1.prepare(...).bind(...)`). Zero dynamic SQL concatenation exists in request paths.
- **Cross-Site Scripting (XSS)**: Form fields are sanitized with control character removal and bracket stripping. Email rendering employs HTML entity escaping.
- **Bot & Spam Mitigation**: Hidden honeypot trap (`_hp_website`) catches automated form scanners without disrupting legitimate users.
- **Request Context Isolation**: Uses Node's `AsyncLocalStorage` to ensure environment bindings and secrets are isolated per request without global state crosstalk.
- **Strict CORS**: In production, origins are restricted strictly to `https://spanindustrialsolutions.com` and `https://www.spanindustrialsolutions.com`.
- **Secret Redaction**: Server logs intercept database connection strings, passwords, customer email addresses, and message bodies to prevent exposure in monitoring logs.

---

## 🔍 16. Troubleshooting & Operational Runbook

### 1. Health Probe Verification
Test production Worker availability:
```powershell
curl.exe -i https://span-industrial-api.ankitbathla-ind.workers.dev/api/health
```
**Expected Response (HTTP 200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-14T17:41:00.000Z",
  "database": "connected",
  "company": "SPAN Industrial Solutions Pvt Ltd"
}
```

### 2. Live Log Streaming
To monitor live requests, errors, or email warnings:
```powershell
npx wrangler tail span-industrial-api
```

### 3. Rate Limit Triggering (HTTP 429)
If a user submits more than 10 requests within 60 seconds from the same IP:
- **Response**: `HTTP 429 Too Many Requests`.
- **Resolution**: Wait 60 seconds for the window to reset.

### 4. Resend Email Delivery Issues
If customer inquiries appear in D1 but emails are not received:
1. Inspect logs: `npx wrangler tail span-industrial-api`.
2. Check for `Resend email delivery failure` messages.
3. If quota errors appear, upgrade the Resend plan or wait for the daily quota reset.
4. Verify the secret exists: `npx wrangler secret list`.
5. Rotate secret if needed: `npx wrangler secret put RESEND_API_KEY`.

---

## ✅ 17. Production Readiness Checklist

| Item | Component | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Edge API Worker** | Cloudflare Workers | **CONFIRMED** | Deployed at `span-industrial-api.ankitbathla-ind.workers.dev` |
| **Frontend Web App** | Cloudflare Pages | **CONFIRMED** | Deployed with custom domains `spanindustrialsolutions.com` |
| **Production Database** | Cloudflare D1 | **CONFIRMED** | `span-industrial-d1` storing active inquiries |
| **Hyperdrive / Neon Cleanup** | Cloudflare / Backend | **CONFIRMED** | Neon & Hyperdrive removed from Worker; local pg preserved |
| **Automated Tests** | Node.js Test Runner | **CONFIRMED** | 52/52 automated tests passing across 3 suites |
| **Production Builds** | Vite & TypeScript | **CONFIRMED** | Both client and server compile cleanly |
| **Rate Limiting** | Cloudflare Workers | **CONFIRMED** | Binding `INQUIRY_RATE_LIMITER` active (10 req/60s) |
| **CORS Policy** | Express Edge Bridge | **CONFIRMED** | Restricted to `spanindustrialsolutions.com` domains |
| **Resend Domain Verification** | Resend DNS | **CONFIRMED** | `spanindustrialsolutions.com` verified with SPF/DKIM |
| **Resend Secret Configuration** | Cloudflare Secrets | **CONFIRMED** | `RESEND_API_KEY` stored as encrypted Worker secret |
| **Live Email Delivery Test** | Email Flow | ⚠️ **PENDING** | Awaiting confirmed test delivery following quota incident |

---

## 📄 License & Attribution

Copyright © 2026 **SPAN Industrial Solutions Pvt Ltd**. All rights reserved.<br />
ISO 9001:2015 Certified Organization.
