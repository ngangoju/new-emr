# Critical API Smoke Evidence — 2026-06-18

**Date:** 2026-06-18  
**Environment:** local stack (`new-emr` on port `3000`, `new-emr-backend` on port `8888`, Docker `postgres` + `redis` + `minio`)  
**Command:** `node scripts/run-critical-api-smoke.mjs`  
**Evidence artifact:** `/tmp/emr-qa/evidence/api-smoke/critical-api-smoke-2026-06-18T18-44-41-779Z.json`

## Result

**Status:** passed

The critical API smoke lane completed successfully against the live local stack. The run verified:

1. backend health endpoint is `UP`
2. receptionist login succeeds
3. patient creation succeeds
4. doctor lookup succeeds
5. consultation tariff lookup succeeds
6. reception visit creation succeeds and returns an invoice
7. nurse login succeeds
8. vitals submission is blocked before payment
9. cashier login succeeds
10. payment posting succeeds
11. vitals submission succeeds after payment

## Captured values

- `patientId`: `30c1e7e6-b6b1-43c4-a980-dba4cb660d12`
- `doctorId`: `31d98b5e-e745-4738-b0c0-68c4a2a2a68e`
- `tariffId`: `a775f1fd-7686-4b83-b428-ab9cf7046780`
- `billingCode`: `CPT99213`
- `invoiceId`: `1f81087a-9b74-4534-8706-1802ebace06d`
- `paymentAmount`: `15000`
- `vitalsId`: `14308229-bb2d-4279-a671-8900e4ea8b61`

## Notes

- The smoke runner was updated to use `axios` rather than Undici/`fetch` for more reliable cookie-aware local probing in this harness.
- The command required local-network permission in the Codex sandbox. Before rerunning with permission, the script failed with `EPERM` on loopback connections even though the backend itself was healthy. That was an execution-environment restriction, not an application failure.
- This evidence proves the **API critical path** locally. Browser-critical Playwright coverage is still a separate proof lane and remains pending on a host or CI environment where Chromium launches successfully.
