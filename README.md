# SPAN Industrial Solutions Pvt Ltd

[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%206-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![ISO 9001:2015](https://img.shields.io/badge/Certified-ISO%209001%3A2015-0b2545)](https://www.iso.org/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)]()

> Official digital portal and enterprise inquiry backend for **SPAN Industrial Solutions Pvt Ltd** — an ISO 9001:2015 certified company powering workforce management, manufacturing cost reduction, shop-floor technical upskilling, and industrial video solutions across India.

---

## 📌 Executive Summary

**SPAN Industrial Solutions Pvt Ltd** partners with automotive Tier-1 suppliers, precision engineering plants, packaging manufacturers, and electronics assembly lines to deliver measurable operational excellence. 

This repository houses the full-stack web application featuring:
- **Corporate Web Portal**: High-performance, single-page application built with React, TypeScript, and a custom CSS design system.
- **Enterprise Inquiry Backend**: Node.js & Express REST API with input sanitization, rate-limiting, and PostgreSQL storage (with resilient in-memory fallback for offline/development environments).
- **Interactive Modals & Legal Compliance**: Self-contained modal workflows for service deep-dives and an interactive Non-Disclosure Agreement (NDA) viewer.
- **Automated Test Suite**: Integration tests covering validation, sanitization, and database interactions.

---

## 🏭 4 Core Industrial Verticals

### 1. Workforce Management Solutions
- **US Staffing Rigor**: Multi-tier candidate vetting grounded in proven staffing standards.
- **Industrial Talent Pipeline**: Machinists (CNC/VMC), press tool makers, quality control inspectors, welding technicians, assembly supervisors, and plant managers.
- **On-Demand Scalability**: Fast turnaround for seasonal surges, plant expansions, and line-specific ramp-ups.

### 2. Guaranteed Saving Program (GET SHRINK)
- **5 Proven Practical Tools**: Target 20% to 30% reduction in manufacturing operational expenses.
- **Zero Capex Investment**: Focuses purely on eliminating waste, reducing scrap, streamlining workflows, and optimizing existing machinery.
- **Cost Centers Targeted**: Raw materials, power consumption, manpower allocation, overheads, and Cost of Poor Quality (COPQ).

### 3. Experts Training for Industries
- **Shop-Floor Upskilling**: Led by experienced industry veterans with decades of hands-on plant experience.
- **10 Core Curriculum Modules**:
  1. *Kaizen* (Continuous Improvement)
  2. *7 QC Tools* (Cause & Effect, Pareto, Control Charts, etc.)
  3. *5S Methodology* (Sort, Set, Shine, Standardize, Sustain)
  4. *Industrial Drawing Study* (First-angle & Third-angle projections)
  5. *GD&T* (Geometric Dimensioning & Tolerancing)
  6. *Inventory Control & Material Flow*
  7. *Functional Analysis* (Value Stream Mapping)
  8. *Quality Management Systems* (ISO 9001 / IATF 16949 awareness)
  9. *Production Planning & Shop Floor Management*
  10. *APQP / PPAP* (Advanced Product Quality Planning)

### 4. Industrial / Corporate Video Solutions
- **Visual Plant Media**: 4K plant walkthroughs, corporate profile videos, and aerial facility tours.
- **Operational Video Modules**: Standard Operating Procedure (SOP) videos, shop-floor safety compliance modules, and customer-facing capability demonstrations.
- **Full Production Lifecycle**: Scripting, storyboard creation, on-site filming in operating plants, bilingual voiceovers, and post-production editing.

---

## 🚀 Key Platform Features

- **Responsive Single-Page Layout**: Smooth scroll navigation, active scrollspy highlighting, and mobile drawer navigation.
- **Interactive Service Detail Modals**: Modal views for each service vertical detailing deliverables, engagement models, and direct inquiry pre-population.
- **Mutual NDA Modal**: Printable execution sheet with mutual confidentiality terms to ensure client peace of mind before project kickoff.
- **Dynamic India Locations Dataset**: Mapped across 357+ industrial hubs, SEZs, and major industrial states (Maharashtra, Tamil Nadu, Gujarat, Haryana, Karnataka, NCR, etc.).
- **Security Hardened Backend**:
  - `helmet` security headers.
  - IP-based rate limiting on inquiry endpoints (`express-rate-limit`).
  - Strict payload validation and HTML tag stripping.
  - CORS origin control.
- **Dual Storage Engine**:
  - Automated PostgreSQL table migration on startup.
  - Seamless in-memory fallback store when PostgreSQL credentials are not provided, ensuring seamless local development.

---

## 📂 Project Architecture

```
span-industrial-solutions/
├── client/                               # Frontend React + TypeScript SPA
│   ├── public/                           # Static assets, logos, and industrial photography
│   │   ├── experts-training.jpg          # Training vertical photography
│   │   ├── guaranteed-saving.jpg         # Cost reduction vertical photography
│   │   ├── nda-confidentiality.jpg       # NDA compliance banner
│   │   ├── video-solutions.jpg           # Media solutions photography
│   │   ├── workforce-management.jpg      # Workforce vertical photography
│   │   └── favicon.svg                   # Brand favicon
│   ├── src/
│   │   ├── components/                   # UI Components
│   │   │   ├── Header.tsx                # Sticky navbar with seal logo & navigation
│   │   │   ├── Hero.tsx                  # Hero section with primary CTAs
│   │   │   ├── About.tsx                 # Company history, mission & ISO status
│   │   │   ├── Services.tsx              # 4 Core vertical cards & interactive modals
│   │   │   ├── ServiceModal.tsx          # Deep-dive modal dialog
│   │   │   ├── WhySpan.tsx               # Strategic differentiators & value metrics
│   │   │   ├── Contact.tsx               # RFQ / Inquiry form with state/city dropdowns
│   │   │   ├── Footer.tsx                # Corporate footer, quick links & NDA launch
│   │   │   ├── NDAModal.tsx              # Mutual Non-Disclosure Agreement dialog
│   │   │   └── SpanLogo.tsx              # SVG vector corporate seal logo
│   │   ├── data/
│   │   │   └── indiaLocations.ts         # Indian industrial clusters dataset
│   │   ├── styles/
│   │   │   ├── atmosphere.css            # Ambient studio lighting & backdrops
│   │   │   └── components.css            # Component-scoped styling
│   │   ├── types/
│   │   │   └── inquiry.ts                # TypeScript client-side inquiry types
│   │   ├── App.tsx                       # App layout orchestration & back-to-top handler
│   │   ├── index.css                     # Global design tokens, typography & CSS reset
│   │   └── main.tsx                      # Vite React mount entry
│   └── vite.config.ts                    # Vite build configuration & API reverse proxy
│
├── server/                               # Backend Node.js + Express API
│   ├── src/
│   │   ├── config/                       # DB configuration, pool setup & schema.sql
│   │   ├── controllers/                  # inquiryController.ts, health check
│   │   ├── middleware/                   # errorHandler.ts, rateLimiter.ts
│   │   ├── routes/                       # inquiryRoutes.ts, healthRoutes.ts
│   │   ├── services/                     # inquiryService.ts (PostgreSQL + fallback)
│   │   ├── types/                        # Server TypeScript definitions
│   │   ├── utils/                        # Structured logger
│   │   ├── validators/                   # inquiryValidator.ts (sanitization & regex)
│   │   └── index.ts                      # Express application entrypoint
│   ├── test/                             # Automated test suite
│   │   └── inquiryApi.test.ts            # Supertest API validation & integration tests
│   └── tsconfig.json                     # Server TypeScript build config
│
├── shared/                               # Shared types between client and server
│   └── types.ts
├── .env.example                          # Environment variable template
├── package.json                          # Monorepo root orchestration scripts
└── README.md                             # Repository documentation
```

---

## 🛠️ Quick Start & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: Optional for local testing (fallback in-memory store activates automatically if not configured)

### 1. Installation
Clone the repository and install root, client, and server dependencies:
```bash
git clone https://github.com/agastya793/span-industrial-solutions.git
cd span-industrial-solutions
npm install
npm install --prefix client
npm install --prefix server
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your environment variables if using a local PostgreSQL database:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/spandb
```

### 3. Running in Development
Start both the Frontend and Backend concurrently with one command:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

Alternatively, run services independently:
```bash
npm run dev:client    # Vite development server
npm run dev:server    # Express TypeScript hot-reload server
```

### 4. Running Tests
Run backend API integration and validation tests:
```bash
npm test --prefix server
```

### 5. Production Build
Verify type checks and build client and server bundles:
```bash
npm run build
```

---

## 📡 API Reference

### Health Check
```http
GET /api/health
```
**Response (200 OK):**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-10-10T10:30:00.000Z"
}
```

### Submit Inquiry / RFQ
```http
POST /api/inquiries
Content-Type: application/json
```
**Request Body:**
```json
{
  "name": "Rajesh Sharma",
  "company": "Apex Precision Engineering Pvt Ltd",
  "email": "rajesh@apexeng.in",
  "phone": "+91 98765 43210",
  "service": "Guaranteed Saving Program (GET SHRINK)",
  "message": "Interested in evaluating cost reduction for our machining unit in Pune."
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Thank you for contacting SPAN Industrial Solutions. Our team will get back to you shortly.",
  "inquiryId": 1
}
```

---

## 🔒 Security & Code Standards

- **Cross-Site Scripting (XSS)**: Form inputs undergo sanitization and regex validation before persistence.
- **Rate Limiting**: Inquiry submission endpoints are rate-limited to avoid spam.
- **SQL Injection Prevention**: Parameterized queries via `pg` pool.
- **Strict Typing**: End-to-end type safety between shared types, client forms, and server controllers.

---

## 📄 License & Attribution

Copyright © 2026 **SPAN Industrial Solutions Pvt Ltd**. All rights reserved.
ISO 9001:2015 Certified Organization.
