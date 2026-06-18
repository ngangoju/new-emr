# 🧪 Modern EMR QA & Test — Consolidated README

This document consolidates QA plans, smoke scripts, workflow compliance validation checklists, and regression evidence guidance for the EMR platform.

It merges and normalizes test-oriented content from:
- `qa_test_plan.md`
- `QA_SMOKE_TEST_WORKFLOW_COMPLIANCE.md`
- `MANUAL_TEST_SCRIPT.md`
- `SMOKE_TEST_REPORT.md`

---

## 📑 Table of Contents
1. [Purpose & Scope](#-purpose--scope)
2. [Environment & Prerequisites](#-environment--prerequisites)
3. [Core End-to-End Patient Journey Validation](#-core-end-to-end-patient-journey-validation)
4. [Role-Based Smoke Compliance Suite](#-role-based-smoke-compliance-suite)
5. [Critical Regression: Discharge Blocking (TC-CSH-002)](#-critical-regression-discharge-blocking-tc-csh-002)
6. [API Validation Matrix (Smoke-Level)](#-api-validation-matrix-smoke-level)
7. [Negative/Critical Guardrail Tests](#-negativecritical-guardrail-tests)
8. [Evidence Capture Standards](#-evidence-capture-standards)
9. [Known Issues and Current QA Risks](#-known-issues-and-current-qa-risks)
10. [Exit Criteria](#-exit-criteria)
11. [Execution Order](#-execution-order)

---

## 🎯 Purpose & Scope

### Objective
Validate end-to-end EMR workflow correctness and role-policy compliance with evidence-backed smoke execution.

### Primary controls under test
- Encounter pathway progression across clinical and financial stages
- Role-restricted action enforcement (`403` expected where applicable)
- Transition guarding for invalid state changes
- Approval-gated actions (discounts/voids)
- Discharge blocking when unpaid invoices exist
- Immutable and attributable audit logging

### Out of scope
- Full-scale performance/load testing
- Broad exploratory UX testing beyond smoke confidence goals
- Full finance reconciliation beyond smoke assertions

---

## 🧰 Environment & Prerequisites

Before execution:
- Backend health endpoint responds `200`
- Frontend is reachable and authentication works
- Seed/reference data loaded (roles, tariffs, inventory, beds/wards)
- API client available (Postman/Insomnia/cURL)
- SQL read-only evidence access available
- Audit/event logging enabled
- Timezone captured for evidence consistency (Africa/Kigali, UTC+2)

Track run metadata:
- app build
- backend commit/tag
- frontend commit/tag
- DB seed/snapshot version
- smoke run timestamp

---

## 🧭 Core End-to-End Patient Journey Validation

Baseline journey to validate:
1. Authentication/security baseline
2. Reception registration + queue initiation
3. Nurse triage + vitals
4. Doctor consultation + orders
5. Lab/radiology result progression
6. Pharmacy dispense
7. Invoice generation + payment
8. Admin/managerial reporting and compliance controls

Representative edge conditions:
- duplicate national ID conflict (`409`)
- role insufficiency (`403`)
- invalid transition rejection (`400/409` with transition semantics)

---

## 👥 Role-Based Smoke Compliance Suite

Minimum role coverage:
- Receptionist
- Nurse
- Chief Nurse
- Doctor
- Laborantin
- Pharmacist
- Cashier
- Accountant
- Sys Admin
- Clinical Director

### Must-cover role smoke capabilities
- Reception: register patient + initiate encounter
- Nurse: triage + routing + guardrail checks
- Chief Nurse: consultation add/remove regression scenarios
- Doctor: SOAP + downstream orders + discount request deferral behavior
- Laborantin: acknowledge/submit/verify lab result transitions
- Pharmacist: receive stock + dispense/serve idempotency behavior
- Cashier: payment posting + discharge gate enforcement
- Clinical Director: approve/reject discount/void decisions
- Accountant: report visibility
- Sys Admin: user/tariff controls and policy boundary checks

---

## 🚨 Critical Regression: Discharge Blocking (TC-CSH-002)

Goal: ensure discharge is blocked when unpaid invoices exist and allowed after settlement.

### Fixture-oriented path (preferred)
Fixture references from smoke documentation include a deterministic patient/invoice/admission set used to verify unpaid-discharge gating.

Expected sequence:
1. Confirm fixture patient/admission/invoice visible in UI
2. Attempt discharge while invoice unpaid → **must block**
3. Post full payment
4. Retry discharge → **must succeed**
5. Verify audit trail and resulting statuses (admission discharged, bed available, invoice paid)

If fixture is not visible, execute equivalent manual fallback:
- create patient
- admit patient
- create unpaid invoice
- attempt discharge (block expected)
- settle invoice
- retry discharge (success expected)

---

## 🔌 API Validation Matrix (Smoke-Level)

Representative endpoints and expected behavior:

- `GET /actuator/health` (anonymous) → `200`
- `GET /patients` (anonymous) → `401`
- `POST /patients` (receptionist) → create success
- `POST /encounters` (receptionist) → encounter in `Registered`
- `POST /encounters/{id}/triage` (nurse) → triage saved
- `POST /consultations` + `/finalize` (doctor) → note lifecycle enforced
- `POST /lab-orders/{id}/acknowledge` / `results/submit` / `verify` (laborantin)
- `POST /inventory/receipts` (pharmacist) → stock receipt recorded
- `POST /pharmacy/dispense` + `/serve` (pharmacist) → dispensing and serve state
- `POST /api/billing/payments` (cashier) → payment applied
- `POST /encounters/{id}/discharge-confirm` (cashier) → confirmed or blocked with explicit reason
- `POST /approvals/{id}/decision` (clinical director) → approval/rejection persisted

---

## 🛑 Negative/Critical Guardrail Tests

Mandatory negative scenarios:
- cross-role forbidden actions return `403`
- verify-without-submit for lab blocked by transition guard
- discharge confirmation blocked when unpaid obligations exist
- discount request remains pending with no premature invoice reduction
- invalid state transitions rejected with explicit transition semantics

### Critical Playwright lane

Use the focused critical lane for deterministic regression coverage of the highest-risk flows:

- `npm run test:e2e:critical`
- `critical-flows.spec.ts`: auth bootstrap, patient navigation, consultation wizard guardrails
- `critical-finance-guards.spec.ts`: doctor discount approval deferral; invoice stays unchanged until approval
- `qa-workflow.spec.ts`: reception -> nurse payment gate -> cashier settlement -> nurse success -> doctor load

This lane is intentionally narrower than the full smoke suite and is the preferred pre-refactor gate for clinical and billing workflow changes.

### Critical API smoke lane

Use the API smoke lane when you need workflow proof without depending on a local browser runtime:

- `npm run smoke:api:critical`
- verifies health, receptionist login, patient creation, tariff lookup, reception visit creation, nurse payment gate, cashier payment, and post-payment vitals
- writes a JSON evidence artifact under `/tmp/emr-qa/evidence/api-smoke/`

Useful environment overrides:

- `E2E_AUTH_API_BASE`
- `E2E_PASSWORD`
- `E2E_RECEPTIONIST_USERNAME`
- `E2E_NURSE_USERNAME`
- `E2E_CASHIER_USERNAME`

This is the preferred fallback when Playwright Chromium is blocked by local host permissions.

---

## 🧾 Evidence Capture Standards

For each test case capture:
- test ID, role, timestamp, build/tag
- UI screenshots (action + outcome)
- API request/response snippets + trace/correlation ID
- SQL read evidence (status/IDs/timestamps)
- audit/event references
- defect details for failures (severity + repro)

Sample evidence SQL domains:
- patient creation
- encounter status
- invoice/payment state
- approval state
- audit log attribution trail

---

## ⚠️ Known Issues and Current QA Risks

From recent smoke reporting, recurring blockers included:
- fixture patient display as `Unknown` in some UI contexts
- unpaid invoice visibility/filter mismatch in billing dashboard
- frontend initialization error around `canFlagInvoiceDeletion`
- search behavior inconsistencies for fixture data discovery

Risk priority guidance:
- **P0**: patient display integrity, invoice filter correctness, frontend initialization error
- **P1**: complete blocked regression path once P0 issues are resolved
- **P2**: expand E2E automation and data reset strategies

---

## ✅ Exit Criteria

Smoke run is considered PASS only when:
1. All critical test cases pass
2. No severity-1 open defects
3. No unresolved blocker in authorization or transition guarding
4. Discharge unpaid-block behavior confirmed
5. Discount deferred-application behavior confirmed
6. Evidence package complete for critical results and all failures

Final verdict must be explicitly marked PASS or FAIL.

---

## ▶️ Execution Order

Recommended run order:
1. Reception
2. Nurse
3. Chief Nurse
4. Doctor
5. Laborantin
6. Pharmacist
7. Cashier
8. Clinical Director
9. Accountant
10. Sys Admin

This order preserves stateful dependency flow and minimizes false negatives due to missing upstream actions.
