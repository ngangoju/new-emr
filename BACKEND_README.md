# 🧠 Modern EMR Backend — Consolidated README

This document consolidates backend-oriented architecture, contracts, implementation plans, and sprint handoff details relevant to the EMR platform that the `new-emr` frontend integrates with.

It logically merges backend-related content from planning, sprint summaries, workflow compliance analysis, and pricing/compliance notes.

---

## 📑 Table of Contents
1. [Backend Scope & Purpose](#-backend-scope--purpose)
2. [Canonical Domain Model](#-canonical-domain-model)
3. [Encounter State Machine & Workflow Guarding](#-encounter-state-machine--workflow-guarding)
4. [Core API Contract Direction](#-core-api-contract-direction)
5. [Cross-Cutting Reliability & Governance](#-cross-cutting-reliability--governance)
6. [Reporting/HMIS Backend](#-reportinghmis-backend)
7. [Radiology Backend](#-radiology-backend)
8. [Insurance Pricing & Invoice Split Logic](#-insurance-pricing--invoice-split-logic)
9. [Role/Workflow Compliance Gaps](#-roleworkflow-compliance-gaps)
10. [Implementation Orchestration & Delivery Governance](#-implementation-orchestration--delivery-governance)
11. [Backend-Facing Acceptance Priorities](#-backend-facing-acceptance-priorities)
12. [Related Docs](#-related-docs)

---

## 🎯 Backend Scope & Purpose

The backend is the authoritative workflow engine for EMR operations:
- validates transition rules server-side
- emits domain events for operational visibility
- enforces RBAC and approval policies
- maintains immutable auditability
- guarantees repeat-safe behavior for financial/critical actions

Architecture direction is monolith-first (Spring Boot), with transactional outbox + DB-backed event log as the baseline for event reliability.

---

## 🧩 Canonical Domain Model

Core entities and intent:

| Entity | Purpose | Status Model (examples) |
|---|---|---|
| PatientProfile | Long-lived patient identity and demographics | active/inactive/deceased |
| Encounter | Visit lifecycle container | Registered → Triage → Consultation → LabPharmacy → Billing → Paid → Closed |
| Admission | IPD hospitalization linked to encounter | requested/admitted/transferred/discharged |
| Triage | Initial nursing assessment | pending/in_progress/completed |
| ClinicalNote | SOAP + addenda | draft/finalized/addendum-only |
| ClinicalOrder | Lab/imaging/procedure/medication orders | pending/acknowledged/in_progress/completed/verified |
| Invoice | Financial aggregation unit | draft/issued/partial/paid/void_requested/voided |
| Payment | Atomic payment transaction | posted/reversed |
| ApprovalRequest | Governance artifact for discount/void/waiver | pending/approved/rejected/expired |
| AuditLog | Immutable compliance trail | append-only |

---

## 🔄 Encounter State Machine & Workflow Guarding

Primary encounter progression:

`Registered → Triage → Consultation → LabPharmacy → Billing → Paid → Closed`

Guarding principles:
- invalid transitions are rejected with explicit transition errors
- downstream completion gates upstream closure (e.g., mandatory lab/pharmacy work before billing readiness)
- discharge confirmation requires settlement or approved credit pathway

Operationally critical events include:
- `encounter.status.changed`
- `triage.completed`
- `consultation.finalized`
- `lab.result.verified`
- `prescription.served`
- `invoice.payment.applied`
- `discharge.blocked`
- `discharge.confirmed`

---

## 🔌 Core API Contract Direction

Representative contract families (backend source-of-truth):

### Registration/Encounter
- `POST /patients`
- `GET /patients/search`
- `POST /encounters`
- `GET /encounters/{id}`

### Triage/Consultation
- `POST /encounters/{id}/triage`
- `POST /encounters/{id}/assign-doctor`
- `POST /consultations`
- `POST /consultations/{id}/finalize`
- `POST /consultations/{id}/addendum`

### Lab/Pharmacy/Imaging
- `POST /lab-orders/{id}/acknowledge`
- `POST /lab-orders/{id}/results/submit`
- `POST /lab-orders/{id}/verify`
- `POST /inventory/receipts`
- `POST /pharmacy/dispense`
- `POST /imaging/orders`

### Billing/Approvals/Discharge
- `POST /invoices`
- `POST /api/billing/payments`
- `POST /billing/discount-requests`
- `POST /approvals/{id}/decision`
- `POST /encounters/{id}/discharge-confirm`

---

## 🛡️ Cross-Cutting Reliability & Governance

### Mandatory standards
- **Error envelope consistency** with code/message/details/trace metadata
- **Idempotency-Key enforcement** for repeat-sensitive mutations (payments, discharge, approvals, void decisions)
- **Concurrency control** for mutable resources
- **Audit attribution** (`performedBy`, `performedAt`, `sourceModule`) on writes
- **Append-only audit policy** for compliance-critical logs
- **Transition guard enforcement** for encounter/order/state changes

### Event reliability baseline
- domain mutation + outbox + event-log entry in one transaction
- DB-backed dispatcher/consumer patterns for M0–M8 delivery stages

### SLA/escalation defaults (operational)
- Registered→Triage target
- Triage→Consultation target
- Lab pending→verified target
- Invoice issued→payment target
- Discharge request→confirmed target

Escalation routing should feed command-center visibility and avoid silent bottlenecks.

---

## 📈 Reporting/HMIS Backend

### Scope
Three core report domains:
1. Daily Patient Throughput
2. Revenue Summary
3. Pending Items Dashboard

### Data sources
- `encounters`, `consultations`, `invoices`, `payments`, `lab_orders`, `imaging_orders`, `prescriptions/dispenses`
- event/audit logs for timeline/compliance context

### Throughput report
- status counts, department load, average duration, hourly arrivals
- consultation signed vs unsigned indicators

### Revenue report
- total invoiced/collected/outstanding
- insurance split + patient/insurance due breakdown
- payment-status distribution and aging logic

### Pending items report
- incomplete encounter/consultation/lab/imaging/pharmacy workflow states
- age bucketing for operational triage

### Reporting sprint handoff notes (important)
- throughput implementation foundation and dashboard path were completed first
- revenue and pending-items required strict source-of-truth discipline:
  - use mutable operational/financial tables as appropriate
  - avoid misusing event logs for legal financial aggregates

---

## 🩻 Radiology Backend

Completed workflow summary:
1. Doctor creates imaging order
2. Radiology tech acquires/uploads and transitions work states
3. Radiologist signs report
4. Billing integration consumes imaging-reported event

### Key backend decisions
- explicit state transitions: `ORDERED/SCHEDULED → IN_PROGRESS → COMPLETED → REPORTED`
- priority-sorted pending orders using CASE-based SQL ordering
- event-driven billing trigger (`imaging.reported`)
- tariff lookup from DB (no hardcoded radiology pricing)

### Migration/testing highlights
- schema and status migrations supporting radiology lifecycle
- seeded imaging tariffs migration
- billing integration test validating tariff-based invoice behavior

---

## 💳 Insurance Pricing & Invoice Split Logic

Pricing and copay logic is centralized in backend pricing services and applied during invoice creation.

### Supported payer strategy (examples)
- **MUTUELLE/CBHI**: mutuelle column/json overrides, typical patient share 10%
- **MMI/RAMA/RSSB**: RSSB/MMI tariff path, typical patient share 15%
- **RADIANT**: configured payer-specific pricing, typical 15%
- **AEQUI**: configured payer-specific pricing, typical 20%
- **PRIVATE/CASH**: private tariff path, patient pays full amount

### Data flow
1. Resolve payer from patient insurance metadata
2. Resolve tariff unit price from canonical columns/JSON overrides
3. Compute patient due vs insurance due
4. Persist split at invoice-creation time

---

## ⚠️ Role/Workflow Compliance Gaps

Compliance analysis identified high-priority backend-impact gaps:
- nurse billing entitlement + nurse drug-request pipeline completeness
- pharmacist stock receiving + request fulfillment depth
- cashier daily close and multi-invoice policy enforcement
- clinical director approval and tariff oversight completeness
- admin tariff management and invoice void governance pathways

These gaps should remain explicitly tracked in phased delivery planning.

---

## 🗺️ Implementation Orchestration & Delivery Governance

### Workstream model
- workflow engine core
- cross-cutting controls
- care-pathway UX support contracts
- command-center derivations
- vertical slice implementation (1→6)
- test strategy and release governance

### Milestone logic (critical path)
- contracts frozen → workflow baseline → controls baseline
- slices 1–6 in dependency order
- command-center readiness
- production readiness with quality gates

### Required quality gates
- RBAC deny-path tests
- invalid transition tests
- audit immutability/attribution checks
- idempotency replay tests
- error envelope contract tests
- end-to-end critical flow pass criteria

### Transitional lint policy
- changed-files-only gating during transition
- full-repo lint debt cleanup tracked as explicit follow-up

---

## ✅ Backend-Facing Acceptance Priorities

Near-term high-priority acceptance focus:
- transition guard correctness on all critical flows
- payment/discharge/approval idempotency correctness
- immutable audit completeness for financial and clinical mutations
- discharge blocking reliability when unpaid obligations exist
- deferred discount application correctness (pre-approval unchanged, post-approval applied)

---

## 📚 Related Docs

- Frontend consolidation: `README.md`
- QA/test consolidation: `QA_TEST_README.md`

