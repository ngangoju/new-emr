# 🏥 Modern EMR Frontend — Consolidated README

This is the consolidated **frontend** README for the `new-emr` application.

It merges frontend-relevant material previously spread across multiple markdown files and keeps a cohesive structure for engineering, product, and operations handoff.

---

## 📑 Table of Contents
1. [General Overview](#-general-overview)
2. [Quick Start](#-quick-start)
3. [Project Structure](#-project-structure)
4. [Frontend Architecture](#-frontend-architecture)
5. [Design System & Color Standards](#-design-system--color-standards)
6. [Integrated API Surface (Frontend Consumption)](#-integrated-api-surface-frontend-consumption)
7. [Module Coverage](#-module-coverage)
8. [Reporting & Radiology UI Status](#-reporting--radiology-ui-status)
9. [Auth/Session Hardening & Role UX Stability](#-authsession-hardening--role-ux-stability)
10. [Known Frontend Workflow Gaps](#-known-frontend-workflow-gaps)
11. [Frontend Test Strategy](#-frontend-test-strategy)
12. [Changelog](#-changelog)
13. [Related Docs](#-related-docs)

---

## 📋 General Overview

A modern Electronic Medical Records frontend built with Next.js, TypeScript, and Tailwind CSS for role-based hospital workflows.

- **Status**: Production-oriented frontend with real backend integration
- **Backend dependency**: Spring Boot API (default `http://localhost:8888`)
- **Primary goals**: clear role-based UX, safe critical actions, and operational reporting visibility

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
git clone https://github.com/ngangoju/new-emr.git
cd new-emr
npm install
```

### Environment
Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8888
```

### Run
```bash
npm run dev
```

### Access
- Frontend: `http://localhost:3000`

---

## 🏗️ Project Structure

```text
src/
├── app/
│   ├── dashboard/
│   │   ├── admin/
│   │   ├── approvals/
│   │   ├── cashier/close/
│   │   ├── doctor/
│   │   ├── nurse/
│   │   ├── pharmacy/
│   │   ├── radiology/
│   │   ├── reception/
│   │   └── reports/
│   └── login/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── clinical/
│   ├── billing/
│   ├── pharmacy/
│   ├── radiology/
│   └── reports/
├── hooks/
├── lib/
│   ├── api.ts
│   ├── authz/policy.ts
│   └── utils/
└── types/
```

---

## 🧱 Frontend Architecture

### Stack
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS + shadcn/ui + Radix UI
- React Query
- Recharts

### UX principles
- Guarded role-based action visibility
- Strong clinical readability and low-friction workflows
- Clear status feedback for critical actions (payments, discharge, approvals)
- Cohesive route-level navigation behavior across roles

---

## 🎨 Design System & Color Standards

Kalisimbi Summit palette (standardized):

| Color | Hex | Usage |
|---|---|---|
| Growth Green | `#0C6030` | Navigation, success emphasis |
| Emerald Green | `#3ABF72` | Primary actions/CTAs/focus |
| Sky Blue | `#00ADEF` | Secondary highlights/active states |
| Deep Grey | `#343A40` | Core text/icons |
| Lava Red | `#D32F2F` | Errors/destructive/critical alerts |
| Volcanic Ash | `#F4F4F4` | Backgrounds/surfaces |

### Clinical safety constraints
- Red reserved for true alerts/destructive actions.
- Ensure WCAG-safe text contrast.
- Do not rely on color-only validation.
- For charts, supplement color with labels/patterns.

---

## 🔌 Integrated API Surface (Frontend Consumption)

### Authentication
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

### Patient & consultation core
- `GET /patients`
- `GET /patients/search`
- `POST /patients`
- `GET /patients/{id}`
- `PUT /patients/{id}`
- `GET /patients/{id}/vitals`
- `GET /consultations`
- `POST /consultations`
- `PUT /consultations/{id}`

### Queue
- `GET /queue/active`
- `POST /queue`
- `POST /queue/call-next`
- `POST /queue/{id}/start`
- `POST /queue/{id}/complete`

### Lab
- `GET /lab-orders/pending`
- `GET /lab-orders/completed`
- `GET /lab-orders/{id}`
- `POST /lab-orders/{id}/results/submit`

### Billing/reports
- `GET /invoices`
- `POST /api/billing/payments`
- `GET /api/billing/payments/invoice/{invoiceId}`
- `GET /reports/{reportType}/export?format=csv|json`

> Full backend contracts, domain model, events, and governance are in `BACKEND_README.md`.

---

## 🧩 Module Coverage

- **Reception**: patient registration/search and queue initiation
- **Nurse**: triage workflow and admissions-related UI
- **Doctor**: consultation wizard, diagnosis, orders, patient records
- **Laboratory**: pending/completed views and result submission
- **Pharmacy**: inventory/alerts, request queue and dispensing surfaces
- **Billing/Cashier**: invoice/payment workflows and cash close UI entry
- **Admin**: roles/users/system configuration/report links
- **Reports**: throughput, revenue, pending items dashboards
- **Radiology**: doctor ordering, tech acquisition, radiologist reporting

---

## 📊 Reporting & Radiology UI Status

### Reporting
- `/dashboard/reports` landing page implemented.
- Throughput report includes date presets, summary cards, charts, and recent encounters table.
- Revenue and Pending Items pages are implemented and routable.
- Shared hook pattern (`useHmisReports`) and charting via Recharts.

### Radiology
End-to-end UX surfaces are implemented:
- Order creation UI with modality/priority/body part and clinical indication validation.
- Priority-sorted worklist for radiology technicians.
- Acquisition workflow and reporting/sign-off interface.

---

## 🔐 Auth/Session Hardening & Role UX Stability

### A1 Session/token hardening
- Access token lifecycle moved to in-memory handling.
- Centralized session invalidation and deterministic redirect on `401`.

### A2 Authorization UX alignment
- Centralized role-policy map for route families and feature visibility.
- Sidebar and route rendering aligned to role policy.
- `403` behavior standardized as non-logout feedback.

### A5 Critical action API integration
- Billing payment paths now use real API mutations.
- Lab result submit/finalize wired to real API endpoint.
- Report export uses backend endpoint with browser download handling.

### Role race-condition remediation (from implementation plan)
- Previous intermittent visibility issue traced to inconsistent localStorage role keys and hydration timing.
- Strategy: centralized auth utilities + unified role retrieval + guarded loading before access checks.

---

## ⚠️ Known Frontend Workflow Gaps

From workflow compliance analysis, major UI-impact gaps still tracked:
- Nurse billing capability completeness
- Nurse-to-pharmacy drug request UX depth
- Cashier multi-invoice and daily closing operational polish
- Clinical Director approval workflow visibility/ergonomics
- Full tariff management experience for relevant privileged roles

---

## 🧪 Frontend Test Strategy

### Automated tests
- Unit/component tests (Vitest)
- Auth/session hardening tests
- Authz policy tests
- Dashboard search tests

### E2E & smoke
- Playwright critical flow coverage
- Role-based smoke scenarios tied to backend API contracts

### Quality gates
- Full-repo `eslint --max-warnings=0`
- `npm audit --audit-level=high`
- API contract validation against the backend route surface
- Dependency review on pull requests
- Scheduled/manual `Security History Scan` workflow for git-history secret detection
- Critical action regressions (payments/lab/results/export)
- Guardrail checks for `401` and `403` semantics

### Running the critical Playwright suite

The lightweight, supported browser gate is:

```bash
npm run test:e2e:critical
```

It runs only the Chromium-based critical suites:
- `e2e/critical-flows.spec.ts`
- `e2e/qa-workflow.spec.ts`

Local default assumptions:
- frontend at `http://localhost:3000`
- backend/auth API at `http://localhost:8888`
- seeded users still available (`doctor1`, `receptionist`, `cashier`, `ngango`, `matt`)

To target a hosted staging environment instead of starting `next dev`, set:

```bash
PLAYWRIGHT_BASE_URL=https://staging-frontend.example.com
E2E_AUTH_API_BASE=https://staging-api.example.com
E2E_USERNAME=doctor1
E2E_PASSWORD=...
npm run test:e2e:critical
```

For GitHub Actions, use the `Critical E2E` workflow and configure:
- repository variable `PLAYWRIGHT_BASE_URL`
- repository variable `E2E_AUTH_API_BASE`
- optional repository variable `E2E_USERNAME`
- repository secret `E2E_PASSWORD`

For repository-wide secret hygiene, use the `Security History Scan` workflow.
It scans full git history with Gitleaks. If the repository lives under a GitHub
organization, set the `GITLEAKS_LICENSE` secret before enabling the workflow.

---

## 📜 Changelog

### 2026-02-11 — Sprint 1 A1 Frontend Session/Token Hardening
- In-memory token handling and centralized session invalidation.

### 2026-02-12 — Sprint 1 A2 Frontend Authorization UX Alignment
- Role-based route/nav policy alignment and deterministic `403` UX.

### 2026-02-12 — Sprint 1 A5 Frontend Critical Actions API Integration
- Real endpoint integration for payments, lab result submission/finalization, and report exports.

---

## 📚 Related Docs

- `BACKEND_README.md` — consolidated backend architecture, contracts, modules, reporting/radiology backend, insurance pricing logic, and implementation orchestration.
- `QA_TEST_README.md` — consolidated QA plans, smoke scripts, regression workflows, evidence templates, and known issues.
