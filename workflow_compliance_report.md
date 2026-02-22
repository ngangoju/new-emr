# Workflow Compliance Audit Report

## Scope and scoring

- Codebases audited: [`new-emr`](new-emr) and [`new-emr-backend`](new-emr-backend)
- End-to-end check required for each workflow item: UI → API call → backend controller → service → database/migration → response wiring
- Binary compliance rule used: **Implemented = 1**, **Partial = 0**, **Missing = 0**
- Date: 2026-02-18

---

## Compact endpoint coverage matrix

| Workflow capability | Frontend call evidence | Backend endpoint evidence | E2E status |
|---|---|---|---|
| Register patient | [`useCreatePatient()`](new-emr/src/hooks/api/usePatients.ts:68) → `POST /patients` | [`@PostMapping` in `PatientController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/PatientController.java:32) | ✅ |
| Admit patient to ward/bed | [`useCreateAdmission()`](new-emr/src/hooks/useAdmissions.ts:118) → `POST /api/admissions` | [`@PostMapping` in `AdmissionController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/AdmissionController.java:82) + [`V46__hospitalization_workflow.sql`](new-emr-backend/src/main/resources/db/migration/V46__hospitalization_workflow.sql) | ✅ |
| Nurse billing multi-tariff | [`NurseBilling`](new-emr/src/components/nurse/NurseBilling.tsx) → [`useCreateInvoice()`](new-emr/src/hooks/useInvoices.ts:70) → `POST /api/billing/invoices` | [`InvoiceController#createInvoice`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/InvoiceController.java:50) + [`InvoiceService`](new-emr-backend/src/main/java/com/emr/newemrbackend/service/InvoiceService.java:319) | ✅ |
| Drug request submission | [`DrugRequestForm`](new-emr/src/components/nurse/DrugRequestForm.tsx) → [`useCreateDrugRequest()`](new-emr/src/hooks/useDrugRequests.ts:53) | [`DrugRequestController#createDrugRequest`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/DrugRequestController.java:52) + [`V45__drug_requests_and_approvals.sql`](new-emr-backend/src/main/resources/db/migration/V45__drug_requests_and_approvals.sql) | ✅ |
| Lab result submission | [`useUploadResult()`](new-emr/src/hooks/useLabOrders.ts:56) uses `POST /lab-orders/{id}/results/submit` | Backend exposes `POST /lab-orders/{id}/results` in [`LabOrderController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/LabOrderController.java:74) | ⚠️ |
| Cashier payment posting | [`useCreatePayment()`](new-emr/src/hooks/usePayments.ts:20) → `POST /api/billing/payments` | [`BillingController#createPayment`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/BillingController.java:127) + [`PaymentService#createPayment`](new-emr-backend/src/main/java/com/emr/newemrbackend/service/PaymentService.java:54) | ✅ |
| Cash close report | [`useCreateCashClose()`](new-emr/src/hooks/usePayments.ts:42) | [`BillingController#createCashCloseReport`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/BillingController.java:149) + [`V47__cash_close_reports.sql`](new-emr-backend/src/main/resources/db/migration/V47__cash_close_reports.sql) | ✅ |
| Invoice deletion request | [`useRequestInvoiceVoid()`](new-emr/src/hooks/useApprovals.ts:111) | [`ApprovalController#requestInvoiceVoid`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ApprovalController.java:64) | ✅ |
| Approve discount | [`useApproveRequest()`](new-emr/src/hooks/useApprovals.ts:69) | [`ApprovalController#approve`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ApprovalController.java:122) + [`ApprovalService#applyApprovedDiscount`](new-emr-backend/src/main/java/com/emr/newemrbackend/service/ApprovalService.java:238) + [`V51__discount_approval_workflow.sql`](new-emr-backend/src/main/resources/db/migration/V51__discount_approval_workflow.sql) | ✅ |
| Pharmacist stock intake | [`useCreateDrugStock()`](new-emr/src/hooks/useDrugStock.ts:15) hits `POST /api/pharmacy/stock` | No controller endpoint for `/api/pharmacy/stock`; available stock endpoints are under [`PharmacyController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/PharmacyController.java:171) and `POST /api/pharmacy/stock/in` | ⚠️ |
| Tariff management writes | [`useTariffManagement`](new-emr/src/hooks/useTariffManagement.ts) calls `/api/billing/tariffs/*` | Write endpoints exist in [`TariffController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/TariffController.java:41) under `/api/tariffs/*` | ⚠️ |

---

## Role-by-role audit

## Receptionist

### ✅ Implemented
- **Register first-time patients**
  - UI: [`PatientsPage`](new-emr/src/app/dashboard/doctor/patients/page.tsx) registration dialog
  - API hook: [`useCreatePatient()`](new-emr/src/hooks/api/usePatients.ts:68)
  - Backend: [`PatientController#create`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/PatientController.java:32)
  - Auth: route/role access in [`policy.ts`](new-emr/src/lib/authz/policy.ts:18)

### ⚠️ Partial
- None

### ❌ Missing
- **Admit existing patients**
  - Gap: receptionist UI has triage/check-in in [`ReceptionPage`](new-emr/src/app/dashboard/reception/page.tsx) but no admission workflow tied to wards/beds for receptionist role
  - Backend currently restricts admission to nurse/chief nurse/admin in [`AdmissionController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/AdmissionController.java:81)

**Fix specification**
- Frontend files:
  - Add admission action in [`ReceptionPage`](new-emr/src/app/dashboard/reception/page.tsx)
  - Reuse admission form in [`AdmissionForm`](new-emr/src/components/nurse/AdmissionForm.tsx) via receptionist route
- Backend files:
  - Update role guard in [`AdmissionController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/AdmissionController.java:81)
  - Align global security matcher in [`SecurityConfig`](new-emr-backend/src/main/java/com/emr/newemrbackend/config/SecurityConfig.java:106)
- DB migration: no new table required
- Endpoint required: `POST /api/admissions`
- Permission changes:
  - Add receptionist admission capability in [`auth.ts`](new-emr/src/lib/utils/auth.ts:41)
  - Add receptionist route access in [`policy.ts`](new-emr/src/lib/authz/policy.ts:22)

**Compliance score**: **50%** (1/2)

---

## Nurse

### ✅ Implemented
- **Bill the patient using multi-select tariff items**
  - UI: [`NurseBilling`](new-emr/src/components/nurse/NurseBilling.tsx)
  - API: [`useCreateInvoice()`](new-emr/src/hooks/useInvoices.ts:70)
  - Backend: [`InvoiceController#createInvoice`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/InvoiceController.java:50)
- **Submit drug requests to pharmacy**
  - UI: [`DrugRequestForm`](new-emr/src/components/nurse/DrugRequestForm.tsx)
  - API: [`useCreateDrugRequest()`](new-emr/src/hooks/useDrugRequests.ts:53)
  - Backend: [`DrugRequestController#createDrugRequest`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/DrugRequestController.java:52)
- **Hospitalize a patient to ward/bed**
  - UI: [`NurseAdmissionsPage`](new-emr/src/app/dashboard/nurse/admissions/page.tsx)
  - API: [`useCreateAdmission()`](new-emr/src/hooks/useAdmissions.ts:118)
  - Backend+DB: [`AdmissionController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/AdmissionController.java:82), [`V46__hospitalization_workflow.sql`](new-emr-backend/src/main/resources/db/migration/V46__hospitalization_workflow.sql)

### ⚠️ Partial
- **Record patient vital signs**
  - UI exists in consultation wizard vitals step: [`NewConsultationPage`](new-emr/src/app/dashboard/doctor/consultations/new/page.tsx)
  - But no direct write through `POST /patients/{id}/vitals` despite backend support in [`PatientController#createVitals`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/PatientController.java:88)
  - Patient detail also shows partially static vitals rendering in [`PatientDetailPage`](new-emr/src/app/dashboard/doctor/patients/[id]/page.tsx)
- **Send patient to doctor add/change consultation assignment**
  - UI for add consultation exists in [`NurseDashboardPage`](new-emr/src/app/dashboard/nurse/page.tsx)
  - API call uses [`useCreateConsultation()`](new-emr/src/hooks/api/useConsultations.ts:50)
  - Backend denies nurse create/update in [`ConsultationController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ConsultationController.java:34)

### ❌ Missing
- None

**Fix specification**
1) Vitals capture completion
- Frontend files:
  - Add dedicated vitals submit in [`NewConsultationPage`](new-emr/src/app/dashboard/doctor/consultations/new/page.tsx)
  - Add hook method in [`usePatients.ts`](new-emr/src/hooks/api/usePatients.ts)
- Backend files: reuse [`PatientController#createVitals`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/PatientController.java:88)
- DB migration: none required
- Endpoint required: `POST /patients/{id}/vitals`
- Permission changes: ensure nurse permissions include vitals write in [`auth.ts`](new-emr/src/lib/utils/auth.ts:28)

2) Consultation assignment authority
- Frontend files: keep current add/change UI in [`NurseDashboardPage`](new-emr/src/app/dashboard/nurse/page.tsx)
- Backend files:
  - Add nurse assignment endpoint or expand existing create/update authorization in [`ConsultationController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ConsultationController.java:34)
- DB migration: none required
- Endpoint required: `POST /consultations` and `PUT /consultations/{id}` for nurse assignment use-case
- Permission changes:
  - Update backend `@PreAuthorize` roles in [`ConsultationController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ConsultationController.java:34)
  - Keep/confirm `CAN_MANAGE_CONSULTATIONS` mapping in [`auth.ts`](new-emr/src/lib/utils/auth.ts:43)

**Compliance score**: **60%** (3/5)

---

## Chief Nurse

### ✅ Implemented
- None (binary scoring)

### ⚠️ Partial
- **Add or delete consultations**
  - UI path present via [`NurseDashboardPage`](new-emr/src/app/dashboard/nurse/page.tsx)
  - Backend allows `CHIEF_NURSE` in [`ConsultationController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ConsultationController.java:34)
  - Role naming mismatch risk: frontend uses `CHIEF-NURSE` in [`auth.ts`](new-emr/src/lib/utils/auth.ts:16), backend uses `CHIEF_NURSE`
- **Generate HMIS reports**
  - UI report pages exist in [`/dashboard/reports`](new-emr/src/app/dashboard/reports/page.tsx)
  - Backend HMIS controller uses `CHIEF_NURSE` in [`HmisReportController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/HmisReportController.java:33)
  - Same role naming mismatch can block access

### ❌ Missing
- None

**Fix specification**
- Frontend files:
  - Normalize role canonicalization in [`auth.ts`](new-emr/src/lib/utils/auth.ts:192)
  - Align route policies in [`policy.ts`](new-emr/src/lib/authz/policy.ts:23)
- Backend files:
  - Standardize role names in [`SecurityConfig`](new-emr-backend/src/main/java/com/emr/newemrbackend/config/SecurityConfig.java:80)
  - Standardize `@PreAuthorize` roles in [`ConsultationController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ConsultationController.java:34) and [`HmisReportController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/HmisReportController.java:33)
- DB migration:
  - Add role normalization seed/fix migration in [`db/migration`](new-emr-backend/src/main/resources/db/migration)
- Endpoints impacted:
  - `POST /consultations`, `DELETE /consultations/{id}`, `GET /hmis/reports/*`
- Permission changes:
  - Unify `CHIEF_NURSE` vs `CHIEF-NURSE` in frontend auth maps and backend authorities

**Compliance score**: **0%** (0/2)

---

## Doctor

### ✅ Implemented
- None (binary scoring)

### ⚠️ Partial
- **Create and complete SOAP notes**
  - Creation flow exists via [`NewConsultationPage`](new-emr/src/app/dashboard/doctor/consultations/new/page.tsx)
  - Completion/sign endpoint exists in [`ConsultationController#sign`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ConsultationController.java:124)
  - No frontend sign/finalize wiring for completion lifecycle
- **Request imaging and additional charges**
  - Imaging order UI exists but is explicitly demo scaffolding in [`ImagingOrdersPage`](new-emr/src/app/dashboard/doctor/imaging-orders/page.tsx)
  - Additional charges via tariff-backed invoice generation exists in [`InvoiceGenerator`](new-emr/src/components/billing/InvoiceGenerator.tsx)
  - Lab test ordering UI/API mutation from doctor context is absent
- **Apply discount to patient**
  - Doctor can request approval from invoice table in [`InvoicesTable`](new-emr/src/components/billing/InvoicesTable.tsx)
  - Final apply is approved by approval service in [`ApprovalService`](new-emr-backend/src/main/java/com/emr/newemrbackend/service/ApprovalService.java:238)
  - No direct doctor-side discount application completion state in doctor workflow
- **Schedule and manage appointments**
  - Backend full endpoints exist in [`AppointmentController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/AppointmentController.java)
  - Frontend schedule page is placeholder in [`SchedulePage`](new-emr/src/app/dashboard/doctor/schedule/page.tsx)

### ❌ Missing
- **View lab results for a patient** (doctor-specific patient context screen not wired)
- **Track full patient medical history** (records page empty scaffold)

**Fix specification**
1) Consultation completion
- Frontend: add finalize action in [`NewConsultationPage`](new-emr/src/app/dashboard/doctor/consultations/new/page.tsx)
- Backend: use existing [`POST /consultations/{id}/sign`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ConsultationController.java:125)
- Permission changes: none if doctor-only; ensure role normalization consistency in [`SecurityConfig`](new-emr-backend/src/main/java/com/emr/newemrbackend/config/SecurityConfig.java:95)

2) Lab/imaging/charges completeness
- Frontend:
  - Add lab order request UI in doctor consultation flow under [`/dashboard/doctor/consultations`](new-emr/src/app/dashboard/doctor/consultations/page.tsx)
  - Replace demo patient hardcoding in [`ImagingOrdersPage`](new-emr/src/app/dashboard/doctor/imaging-orders/page.tsx)
- Backend:
  - Support frontend path contract for result submit and order lifecycle in [`LabOrderController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/LabOrderController.java:74)
- Endpoints required:
  - `POST /lab-orders`
  - `GET /lab-orders/{id}`
  - `POST /imaging/orders`

3) History + lab viewing
- Frontend:
  - Implement records and timeline in [`RecordsPage`](new-emr/src/app/dashboard/doctor/records/page.tsx)
  - Wire lab data in patient details [`PatientDetailPage`](new-emr/src/app/dashboard/doctor/patients/[id]/page.tsx)
- Backend:
  - Add patient-scoped lab and consultation history aggregation endpoint
- Endpoint required:
  - `GET /patients/{id}/history`
  - `GET /patients/{id}/lab-results`
- Permission changes:
  - Add history-view capability mapping in [`auth.ts`](new-emr/src/lib/utils/auth.ts)

**Compliance score**: **0%** (0/7)

---

## Cashier

### ✅ Implemented
- **Receive and record payments** via [`BillingDashboard`](new-emr/src/components/billing/BillingDashboard.tsx) + [`useCreatePayment()`](new-emr/src/hooks/usePayments.ts:20) + [`BillingController#createPayment`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/BillingController.java:127)
- **Multiple invoices per patient per day** supported by invoice model/index strategy in [`V48__invoice_doctor_and_date.sql`](new-emr-backend/src/main/resources/db/migration/V48__invoice_doctor_and_date.sql)
- **Separate invoice per doctor** supported by doctor selector in [`InvoiceGenerator`](new-emr/src/components/billing/InvoiceGenerator.tsx) and persisted doctor linkage in [`InvoiceService`](new-emr-backend/src/main/java/com/emr/newemrbackend/service/InvoiceService.java:65)
- **Daily closing report** via [`CashierClosePage`](new-emr/src/app/dashboard/cashier/close/page.tsx) and [`V47__cash_close_reports.sql`](new-emr-backend/src/main/resources/db/migration/V47__cash_close_reports.sql)
- **Discharge patient** from billing/payment dialog through [`useDischargePatient()`](new-emr/src/hooks/useAdmissions.ts:138) and [`AdmissionController#dischargePatient`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/AdmissionController.java:91)

### ⚠️ Partial
- None

### ❌ Missing
- None

**Compliance score**: **100%** (5/5)

---

## Laborantin

### ✅ Implemented
- None (binary scoring)

### ⚠️ Partial
- **View pending lab test requests**
  - UI exists in [`LabDashboard`](new-emr/src/components/lab/LabDashboard.tsx)
  - Role mismatch risk: frontend roles use `LABORANTIN`/`LAB_TECH` in [`auth.ts`](new-emr/src/lib/utils/auth.ts:8), controller guards use `LAB` in [`LabOrderController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/LabOrderController.java:39)
- **Record and submit lab results**
  - Frontend posts `/results/submit` in [`useLabOrders.ts`](new-emr/src/hooks/useLabOrders.ts:74)
  - Backend exposes `/results` in [`LabOrderController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/LabOrderController.java:74)

### ❌ Missing
- None

**Fix specification**
- Frontend files:
  - Align endpoint path in [`useLabOrders.ts`](new-emr/src/hooks/useLabOrders.ts:74)
  - Add robust role map in [`auth.ts`](new-emr/src/lib/utils/auth.ts:8)
- Backend files:
  - Add compatible submit endpoint `POST /lab-orders/{id}/results/submit` in [`LabOrderController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/LabOrderController.java)
  - Harmonize LAB roles in [`SecurityConfig`](new-emr-backend/src/main/java/com/emr/newemrbackend/config/SecurityConfig.java:97)
- DB migration: none required
- Permission changes:
  - Ensure `LABORANTIN` and `LAB_TECH` map to backend authorities consistently

**Compliance score**: **0%** (0/2)

---

## Sys Admin

### ✅ Implemented
- **View invoices and flag for deletion request**
  - UI action in [`InvoicesTable`](new-emr/src/components/billing/InvoicesTable.tsx)
  - Approval request API in [`useRequestInvoiceVoid()`](new-emr/src/hooks/useApprovals.ts:111)
  - Backend in [`ApprovalController#requestInvoiceVoid`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ApprovalController.java:64)

### ⚠️ Partial
- **Manage users create edit suspend activate**
  - Backend exists in [`UserController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/UserController.java)
  - Frontend admin links to `/dashboard/admin/users` in [`AdminPage`](new-emr/src/app/dashboard/admin/page.tsx:37), but page is absent
- **Manage tariff items add/edit/delete**
  - Frontend writes to `/api/billing/tariffs` in [`useTariffManagement`](new-emr/src/hooks/useTariffManagement.ts)
  - Backend write endpoints are under `/api/tariffs` in [`TariffController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/TariffController.java:41)

### ❌ Missing
- None

**Fix specification**
1) Admin user management UI
- Frontend files:
  - Create [`new-emr/src/app/dashboard/admin/users/page.tsx`](new-emr/src/app/dashboard/admin/users/page.tsx)
  - Reuse [`UserManagementTable`](new-emr/src/components/admin/UserManagementTable.tsx)
- Backend endpoint required:
  - `GET /users`, `POST /users`, `PUT /users/{id}`
- Permission changes:
  - Ensure admin-only edit/suspend in backend `@PreAuthorize` in [`UserController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/UserController.java:31)

2) Tariff endpoint unification
- Frontend files:
  - Update hooks in [`useTariffs.ts`](new-emr/src/hooks/useTariffs.ts:14) and [`useTariffManagement.ts`](new-emr/src/hooks/useTariffManagement.ts:33)
- Backend files:
  - Either add write endpoints under `/api/billing/tariffs` in [`BillingController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/BillingController.java)
  - Or switch frontend to `/api/tariffs`
- Permission changes:
  - Align roles for tariff writes across frontend and backend

**Compliance score**: **33%** (1/3)

---

## Pharmacist

### ✅ Implemented
- **View nurse drug requests and fulfill serve them**
  - UI: [`DrugRequestQueue`](new-emr/src/components/pharmacy/DrugRequestQueue.tsx)
  - API: [`useDrugRequests()`](new-emr/src/hooks/useDrugRequests.ts)
  - Backend: [`DrugRequestController#updateDrugRequest`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/DrugRequestController.java:63)

### ⚠️ Partial
- **Receive and log incoming drug stock**
  - UI/hook call `/api/pharmacy/stock` in [`useDrugStock.ts`](new-emr/src/hooks/useDrugStock.ts:9)
  - No matching backend endpoint exists; stock receive API available as `/api/pharmacy/stock/in` in [`PharmacyController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/PharmacyController.java:181)
  - DB schema is ready in [`V52__pharmacy_stock_receiving_workflow.sql`](new-emr-backend/src/main/resources/db/migration/V52__pharmacy_stock_receiving_workflow.sql)

### ❌ Missing
- None

**Fix specification**
- Frontend files:
  - Update stock hooks in [`useDrugStock.ts`](new-emr/src/hooks/useDrugStock.ts)
  - Adjust receiving form payload in [`PharmacyDashboard`](new-emr/src/components/pharmacy/PharmacyDashboard.tsx)
- Backend files:
  - Option A: add `/api/pharmacy/stock` compatibility controller
  - Option B: keep `/api/pharmacy/stock/in` and align frontend only
- Endpoint required:
  - Preferred: `POST /api/pharmacy/stock/in` and `GET /api/pharmacy/stock/movements`
- Permission changes:
  - none beyond pharmacist/admin already present

**Compliance score**: **50%** (1/2)

---

## Accountant

### ✅ Implemented
- None (binary scoring)

### ⚠️ Partial
- **Generate management and financial reports**
  - Revenue and report pages exist in [`RevenueReportPage`](new-emr/src/app/dashboard/reports/revenue/page.tsx) and [`ReportsDashboard`](new-emr/src/app/dashboard/reports/page.tsx)
  - Not all management datasets exposed in frontend despite backend availability in [`ReportController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ReportController.java)
- **View system-wide statistics**
  - Backend supports usage stats in [`ReportController#getSystemUsage`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ReportController.java:40)
  - No dedicated frontend system-wide stats screen for accountant role

### ❌ Missing
- None

**Fix specification**
- Frontend files:
  - Add accountant statistics screen under [`new-emr/src/app/dashboard/reports`](new-emr/src/app/dashboard/reports)
  - Wire `/reports/usage`, `/reports/financial`
- Backend files:
  - Reuse existing [`ReportController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ReportController.java)
- Endpoint required:
  - `GET /reports/financial`
  - `GET /reports/usage`
- Permission changes:
  - confirm accountant route/menu visibility in [`policy.ts`](new-emr/src/lib/authz/policy.ts:79)

**Compliance score**: **0%** (0/2)

---

## Clinical Director

### ✅ Implemented
- **Approve or reject invoice deletion requests**
  - UI: [`ApprovalsPage`](new-emr/src/app/dashboard/approvals/page.tsx)
  - API: [`useApproveRequest()`](new-emr/src/hooks/useApprovals.ts:69), [`useDenyRequest()`](new-emr/src/hooks/useApprovals.ts:90)
  - Backend: [`ApprovalController#approve`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ApprovalController.java:122), [`#deny`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ApprovalController.java:152)
- **Approve or reject patient discount requests**
  - Backend apply flow in [`ApprovalService#approveDiscount`](new-emr-backend/src/main/java/com/emr/newemrbackend/service/ApprovalService.java:191)

### ⚠️ Partial
- **View and update tariffs**
  - Frontend tariff page permission includes clinical director in [`auth.ts`](new-emr/src/lib/utils/auth.ts:39)
  - But frontend write API targets `/api/billing/tariffs/*` while backend write endpoints are `/api/tariffs/*`
  - Billing tariff GET endpoint role list in [`BillingController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/BillingController.java:58) excludes `CLINICAL_DIRECTOR`

### ❌ Missing
- None

**Fix specification**
- Frontend files:
  - Align tariff hooks in [`useTariffManagement.ts`](new-emr/src/hooks/useTariffManagement.ts)
- Backend files:
  - Add clinical director to tariff read/write authorization in [`BillingController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/BillingController.java:58) or consolidate to [`TariffController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/TariffController.java:41)
- Endpoint required:
  - `GET /api/billing/tariffs`
  - `POST|PUT|DELETE /api/billing/tariffs/{id}` or unified `/api/tariffs/*`
- Permission changes:
  - Add backend role authorization for `CLINICAL_DIRECTOR`

**Compliance score**: **67%** (2/3)

---

## Prioritized remediation list

## P0 blockers
- [ ] **Lab result endpoint contract mismatch**
   - FE uses `/lab-orders/{id}/results/submit`; BE exposes `/lab-orders/{id}/results`
   - Files: [`useLabOrders.ts`](new-emr/src/hooks/useLabOrders.ts:74), [`LabOrderController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/LabOrderController.java:74)
- [ ] **Pharmacy stock receiving endpoint missing for frontend contract**
   - Files: [`useDrugStock.ts`](new-emr/src/hooks/useDrugStock.ts:9), [`PharmacyController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/PharmacyController.java:181)
- [ ] **Tariff write-path split `/api/billing/tariffs` vs `/api/tariffs`**
   - Files: [`useTariffManagement.ts`](new-emr/src/hooks/useTariffManagement.ts:33), [`TariffController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/TariffController.java:41), [`BillingController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/BillingController.java:56)
- [ ] **Role naming inconsistency across frontend and backend authorities**
   - `CHIEF-NURSE` vs `CHIEF_NURSE`, `LABORANTIN` vs `LAB`
   - Files: [`auth.ts`](new-emr/src/lib/utils/auth.ts:1), [`SecurityConfig`](new-emr-backend/src/main/java/com/emr/newemrbackend/config/SecurityConfig.java:80), [`LabOrderController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/LabOrderController.java:39)
- [ ] **Nurse consultation assignment blocked by backend policy**
   - Files: [`NurseDashboardPage`](new-emr/src/app/dashboard/nurse/page.tsx), [`ConsultationController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ConsultationController.java:34)

## P1 important
- [ ] Build real doctor appointment management UI using existing endpoints
   - Files: [`SchedulePage`](new-emr/src/app/dashboard/doctor/schedule/page.tsx), [`AppointmentController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/AppointmentController.java)
- [ ] Implement doctor lab-results-by-patient and longitudinal history screens
   - Files: [`PatientDetailPage`](new-emr/src/app/dashboard/doctor/patients/[id]/page.tsx), [`RecordsPage`](new-emr/src/app/dashboard/doctor/records/page.tsx)
- [ ] Add receptionist admission workflow and permission wiring
   - Files: [`ReceptionPage`](new-emr/src/app/dashboard/reception/page.tsx), [`AdmissionController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/AdmissionController.java:81)
- [ ] Create missing admin users page and management actions
   - Files: [`AdminPage`](new-emr/src/app/dashboard/admin/page.tsx:37), new [`/dashboard/admin/users/page.tsx`](new-emr/src/app/dashboard/admin/users/page.tsx)

## P2 enhancements
- [ ] Replace demo scaffolding in imaging orders with encounter-context integration
   - File: [`ImagingOrdersPage`](new-emr/src/app/dashboard/doctor/imaging-orders/page.tsx)
- [ ] Wire export actions on report pages to backend export endpoints
   - Files: [`RevenueReportPage`](new-emr/src/app/dashboard/reports/revenue/page.tsx), [`PatientThroughputReportPage`](new-emr/src/app/dashboard/reports/throughput/page.tsx), [`ReportController`](new-emr-backend/src/main/java/com/emr/newemrbackend/controller/ReportController.java:46)
- [ ] Replace dashboard placeholder quick insights with live API data
   - File: [`ReportsDashboard`](new-emr/src/app/dashboard/reports/page.tsx)

---

## Compliance percentages

| Role | Implemented / Total | Compliance |
|---|---:|---:|
| Receptionist | 1 / 2 | 50% |
| Nurse | 3 / 5 | 60% |
| Chief Nurse | 0 / 2 | 0% |
| Doctor | 0 / 7 | 0% |
| Cashier | 5 / 5 | 100% |
| Laborantin | 0 / 2 | 0% |
| Sys Admin | 1 / 3 | 33% |
| Pharmacist | 1 / 2 | 50% |
| Accountant | 0 / 2 | 0% |
| Clinical Director | 2 / 3 | 67% |

**Overall compliance**: **13 / 33 = 39%**

---

## Notes on evidence quality

- Any UI-only feature without matching backend endpoint or role authorization has been marked **Partial**, not implemented.
- Any backend-only feature without frontend workflow exposure has been marked **Partial** for workflow compliance.
- Role naming mismatches were treated as real production blockers where route policy and `@PreAuthorize` can diverge.
