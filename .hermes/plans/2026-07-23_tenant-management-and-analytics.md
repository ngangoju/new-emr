# Tenant Management + Secure Cross-Tenant Admin Analytics — Implementation Plan (v1)

> **For Hermes:** Implement via subagent-driven-development, task-by-task, TDD, frequent commits, verify each task with a clean build + tests before moving on. Same execution pattern as `2026-07-22_163000-enforce-tenant-isolation.md`.
>
> **Guiding security principle (NON-NEGOTIABLE):** RLS is the enforcement authority. Cross-tenant admin oversight is built as a **deliberately scoped, audited, RLS-exempt reporting path** — NEVER by weakening the per-tenant policy or granting admins blanket `BYPASSRLS` on the live app role. A leak here is a multi-clinic data breach.

**Goal:** Make the multi-tenant system *operable* — let an authorized admin (a) create/manage tenants, (b) assign users to tenants (set their home clinic + multi-clinic membership), (c) switch clinics safely, and (d) view aggregated per-tenant statistics in one overview — without ever weakening tenant isolation.

---

## Verified current state (read-only recon — CORRECTED, then RE-VERIFIED)

We re-read the actual code. Earlier "❌ not built" was partly wrong. A second review (the user's) caught a **critical authorization flaw** in Phase 0, which we verified against the real tree and fixed below. Real state:

**Already built:**
- `tenants` + `tenant_members` tables (`V132`); `tenant_id` + RLS `FORCE` on 7 tables (`V135`); default tenant `…0001`. (Isolation work — DONE.)
- `TenantAdminController` (`/api/admin/tenants`: POST/GET/GET{id}/PUT/DELETE) + `TenantService` (create/get/getAll/update/soft-delete) + `TenantRepository` + `CreateTenantDto`/`TenantDto`. **Guarded by `@PreAuthorize("hasAuthority('admin:tenants:manage')")`.**
- `TenantMember` model + `TenantMemberRepository` (read-side exists for the filter).
- `TenantFilter` already honors `X-Tenant-ID` **only** when `tenant_members` proves membership (the multi-clinic switch primitive — no UI yet).
- Frontend: `tenantId?: string` on `SessionUser`/`User` (captured from `/auth/me`), no header sent.

**Actually missing (the real work):**
1. **Permission `admin:tenants:manage` is NEVER granted to any role** — the existing CRUD is currently **dead** (every call 403s). No seed, no role assignment references it in the repo.
2. **No user→tenant assignment**: zero `setTenantId` / `TenantMemberRepository.save` / assignment API anywhere. `users.tenant_id` exists but is only ever set by seed (all to default). No way to onboard a user into a clinic.
3. **No tenant switcher UI** (frontend has zero `tenant` references).
4. **No cross-tenant analytics**: no `BYPASSRLS` reporting role, no aggregated-stats endpoint, no RLS-exempt read path, no audit.
5. **No frontend Tenant Admin screens** (CRUD or assignment).
6. **🔴 `tenants` table has NO RLS** (verified: `V135` applies `FORCE ROW LEVEL SECURITY` to only the 7 scoped tables — `patients, appointments, consultations, queue_entries, lab_orders, prescriptions, visit_tickets`; `tenants` is absent). So `TenantAdminController.getAllTenants()` / `deleteTenant(id)` return/act on **all** rows regardless of caller. This is why the Phase 0 flaw (below) is fully live, not blunted.

**🔴 CRITICAL AUTHORIZATION FLAW (found in review, verified):** `ADMIN` is a **per-hospital, tenant-scoped** role — `V89__admin_scope_hardening.sql` explicitly scoped it ("ADMIN becomes system/admin/report scope only") and removed the `*` wildcard; `AdminScopeAuthorities.expand()` returns a fixed scoped set and rejects `admin:*`/`*` expansion. There is **no platform-operator principal** in the system (no `PLATFORM_ADMIN`/`SUPER_ADMIN` role seeded — verified). Therefore Phase 0's original "grant `admin:tenants:manage` to ADMIN" would make **every clinic's ADMIN a cross-tenant operator** — able to list/edit/delete *all* clinics and (Phase 3) read every clinic's aggregates. That is a catastrophic cross-tenant privilege escalation — the same class of bug as the header-authoritative issue from the isolation plan: conflating a tenant-scoped identity with a tenant-transcending capability.

**Resolution (baked into Phase 0.5):** introduce a `PLATFORM_ADMIN` principal that lives *above* all tenants (a dedicated role, excluded from `tenant_members` scoping, resolved from its own claim), and grant `admin:tenants:manage` + `admin:analytics:view` **to that**, never to ADMIN. Every "admin sees all clinics" capability hangs off the platform role.

**How permissions are actually seeded (OQ-A, now answered):** via `pg_temp.seed_role_permissions(role_name, perms[])` in `V89`, writing to `rbac_permissions` + `rbac_role_permissions`; ADMIN's perms are also mirrored into `roles.permissions` JSON. Phase 0.5 seeds the platform role the **same way** — do NOT invent a new mechanism, and do NOT add the transcending permission to ADMIN.

**Key files:**
- Backend: `controller/TenantAdminController.java`, `service/TenantService.java`, `repository/TenantRepository.java`, `model/Tenant.java`, `model/TenantMember.java`, `repository/TenantMemberRepository.java`, `security/TenantFilter.java`, `model/User.java`, `controller/UserController.java`, `dto/*`, `security/JwtTokenProvider.java`, `config/*`.
- Frontend: `src/hooks/api/useAuth.ts` (`User.tenantId`), `src/lib/utils/auth.ts` (`SessionUser.tenantId`), `src/app/dashboard/*`, `src/api/*` (axios), `src/components/*`.

---

## Architecture decisions

- **🔴 Tenant-ops authority lives ABOVE tenants, not in the clinic ADMIN role.** Tenant management + cross-tenant analytics are tenant-transcending capabilities and are granted **only to a dedicated `PLATFORM_ADMIN` principal** (seeded in Phase 0.5), which lives outside the `tenant_members` model and is never assigned to clinic staff. The per-hospital `ADMIN` role is **strictly clinic-scoped** (V89) and MUST NOT receive `admin:tenants:manage` / `admin:analytics:view`. (This is the load-bearing invariant — see Phase 0 / 0.5 / Rollout. The earlier "grant to ADMIN" wording was removed as a security defect.)
- **Assignment API** (`/api/admin/tenants/{id}/members` + `/api/admin/users/{id}/tenant`): sets `users.tenant_id` (home clinic) and writes `tenant_members` (multi-clinic). Assignment is itself tenant-scoped-admin-gated; an audit row is written on every change.
- **Tenant switcher**: frontend dropdown for users with ≥1 `tenant_members` row; sends `X-Tenant-ID` header. `TenantFilter` already validates membership + active tenant. The JWT `tenantId` stays the default; the header is a verified overlay. **No client can self-promote** (filter checks `tenant_members`).
- **Cross-tenant analytics**: a dedicated **reporting role with `BYPASSRLS` on a read replica / separate connection** (never the app's write role), accessed via a new `AnalyticsReportingService` that uses a *separate* `ConnectionFactory` (the `NeonTenantDatabaseRouter` seam could later give each tenant its own, but for shared-DB analytics we read the single DB with an exempt connection). Every cross-tenant read is logged to an `audit_admin_access` table (who, when, which tenant(s), what metric). Results are **aggregated counts only** by default (no raw PHI export) unless an explicit break-glass flow is used.
- **RLS stays intact for the app role**: we do NOT add `BYPASSRLS` to the app's DB user. The reporting connection is a distinct role. This is the OQ2 design from the isolation plan, now implemented.

---

## Tasks (subagent-driven; each ends green before next)

### Phase 0 — Do NOT grant the transcending permission to ADMIN
- **Task 0.1** Document/confirm the invariant: `admin:tenants:manage` and `admin:analytics:view` are **platform-level** authorities and MUST NOT be added to the `ADMIN` role (tenant-scoped). Add a regression test asserting ADMIN's seeded permission set (from `V89`) does **not** contain `admin:tenants:manage` / `admin:analytics:view`. This locks the boundary the review caught.
- **Task 0.2** Contract test (negative): `POST /api/admin/tenants` with a normal **ADMIN** token returns **403** (not 201). Proves the boundary holds before the platform role exists. This is the "dead CRUD stays dead for clinic admins" guarantee.

### Phase 0.5 — Platform-operator principal (MUST precede any tenant-op capability)
- **Task 0.5.1** **Migration numbering (verify at build, do NOT hardcode):** Flyway applies in version order and this project has a history of misordered/duplicate migrations (duplicate V100 and V130 were renumbered earlier this session). Before creating any migration, list `src/main/resources/db/migration` and take the **next free sequential integer** above the current max (currently V135; V136–V138 are free). Assign the **lower** number to the platform-role migration (Phase 0.5) and a **higher** number to the analytics role migration (Phase 3) so ordering matches phasing. Example only: `V136__platform_admin_role.sql` (platform) then `V137__analytics_reporting_role.sql` (analytics) — but use whatever the next free numbers are at implementation time; never reuse an existing version, and never let analytics predate the platform role.
- **Task 0.5.2** Platform-identity model: **add `platform_admin BOOLEAN NOT NULL DEFAULT false` on `users`** (chosen over a separate table — simplest and hardest to get wrong on a security boundary). A platform operator is **excluded from `tenant_members` scoping** and is never assigned a home `tenant_id` in the normal clinic flow. Seed one platform admin (e.g. `platform_admin_emr`) with `platform_admin = true` — credentials out-of-band, not in repo.
- **Task 0.5.3** Authority resolution (keep ONE source of truth): `PLATFORM_ADMIN` is a **normal RBAC role** whose permissions (`admin:tenants:manage`, `admin:analytics:view`, …) are seeded in 0.5.1 and resolve through the existing `SecurityConfig` → `rbac_role_permissions` path — **no special JWT-claim gating**. The `platform_admin` flag's only job is to grant the `tenant_members` exemption in `TenantFilter` (0.5.4) and to block adding the user to `tenant_members`. Do NOT duplicate the authority check in `JwtTokenProvider`; that would create a second source of truth for "is this a platform admin." `AdminScopeAuthorities.expand()` already returns a fixed, explicit set and rejects `*`/`admin:*` — reuse that, do not reimplement.
- **Task 0.5.4** TenantFilter: platform admin (flag `true`) is exempt from the `users.tenant_id` home-clinic binding (operates across tenants by explicit selection); clinic `ADMIN` remains strictly home-clinic scoped. Verify platform admin cannot be added to `tenant_members` (rejects clinic-scoped membership). **Platform admin is NOT surfaced in the Phase 2 membership-driven switcher** (it has no `tenant_members` rows by design) — platform operators use the all-tenants analytics overview (Phase 4.3), not the per-clinic switcher. State this explicitly so nobody wires a platform admin into the membership switcher.
- **Task 0.5.5** Contract tests: (a) platform admin → `POST /api/admin/tenants` returns 201; (b) clinic ADMIN → 403; (c) platform admin not present in `tenant_members` for any clinic.
- **Task 0.5.6** Security review gate: confirm `admin:tenants:manage` / `admin:analytics:view` appear **only** for `PLATFORM_ADMIN` in the seeded/authority data; grep audit that no migration adds them to `ADMIN`.

### Phase 1 — User ↔ Tenant assignment (onboarding)
- **Task 1.1** `TenantMemberService` + `TenantMemberController` (`/api/admin/tenants/{tenantId}/members`): list/add/remove members; writes `tenant_members`. Add/remove validated (user exists, tenant active).
- **Task 1.2** `UserTenantAdminController` (`/api/admin/users/{userId}/tenant`): set a user's home `users.tenant_id` (reassign clinic); requires `admin:tenants:manage`. On change, also upsert a `tenant_members` row so the user can switch back. Audit row required.
- **Task 1.3** Audit: `audit_tenant_changes` table + writer; every assignment/reassign logged (actor, target_user, old_tenant, new_tenant, ts). Unit + integration test.
- **Task 1.4** Idempotency/migration: backfill — any user with `tenant_members` but null `users.tenant_id` gets home set; ensure FK integrity.

### Phase 2 — Tenant switcher (frontend)
- **Task 2.1** Frontend: fetch the current user's `tenant_members` via a new `/api/me/tenants` (lists tenants the user belongs to). Add `User.tenants?: {id,name}[]`.
- **Task 2.2** `TenantSwitcher` component (dropdown in dashboard header) that, on select, sends subsequent requests with `X-Tenant-ID` header. Wire into the axios instance (interceptor reading current selected tenant from session state). Type-safe, lint 0/0.
- **Task 2.3** `useAuth`/session: persist selected tenant; on switch, re-fetch `/auth/me`-scoped data. E2E-light test: two memberships → switch → data scoped to selected tenant (assert no other-tenant rows).

### Phase 3 — Secure cross-tenant admin analytics
- **Task 3.1** **Migration (next free version above the platform-role migration, per 0.5.1's numbering rule):** create a dedicated Postgres role `emr_analytics` with `BYPASSRLS` **on the read replica / a reporting connection only** (document this is NOT the app role). Provide a second R2DBC `ConnectionFactory` bean (`reportingConnectionFactory`) using that role. Guard: if replica unavailable, fall back to app role with explicit RLS (returns only admin's home tenant — safe default).
- **Task 3.2** `AnalyticsReportingService`: per-tenant aggregated stats — counts of patients, appointments (today/period), consultations, lab orders, invoices (total/revenue), active users — grouped by `tenant_id`. Pure aggregates (`COUNT`, `SUM`), no raw row export. Uses the reporting connection.
- **Task 3.3** `AdminAnalyticsController` (`/api/admin/analytics/tenants`): returns the per-tenant table; each row = one tenant's stats. Gated by `admin:analytics:view` — which is granted **only to `PLATFORM_ADMIN`** (Phase 0.5), never to clinic `ADMIN`. **Every call logged** to `audit_admin_access` (actor, ts, endpoint, tenant_ids touched).
- **Task 3.4** Break-glass (optional, deferred unless requested): explicit raw-PHI export behind MFA + stronger audit. Out of scope for v1.
- **Task 3.5** Integration test: with 2 seeded tenants + data, the analytics endpoint returns correct separate counts and **zero cross-tenant leakage** (a tenant's row never contains another's patients), using the same Testcontainers + `app_user` (NOBYPASSRLS) pattern as `TenantIsolationIntegrationTest`.

### Phase 4 — Frontend Tenant Admin + Analytics UI
- **Task 4.1** Tenant Admin page (`/dashboard/admin/tenants`): list/create/edit/soft-delete tenants (calls existing CRUD). Table + form. Lint 0/0, contract test.
- **Task 4.2** Tenant Members page: list/add/remove members per tenant; reassign a user's home clinic. Calls Phase 1 APIs.
- **Task 4.3** Admin Analytics Overview (`/dashboard/admin/analytics`): per-tenant stats table from `/api/admin/analytics/tenants`, sortable, with a "totals" row. Clearly labeled "aggregated, no patient-identifiable data."

### Phase 5 — DB-per-tenant wiring (OQ3, deferred until a paying clinic exists)
- **Task 5.1** Promote `NeonTenantDatabaseRouter` into the live path: when `app.tenant-databases` has an entry for a tenant, `DatabaseConfig` (or a new `RoutingConnectionFactory` `@Primary`) resolves that tenant's factory; default tenants keep the shared DB. RLS still applied per connection via `TenantAwareConnectionFactory`. Add integration test proving a configured tenant hits its own DB.
- **Task 5.2** Neon provisioning playbook (docs + optional API to create a Neon branch per tenant) — infra, not code in this repo; documented, not auto-run.

### Out of scope (explicitly deferred)
- Per-tenant **branding / subdomain routing** (DNS + route resolution). Separate epic.
- Per-tenant **billing / quotas / plan enforcement**. Separate epic.
- Self-serve tenant signup (only admin-created for now).

---

## Risks / Tradeoffs (baked corrections)
- **R1 (admin becomes a leak):** cross-tenant reads use a *separate BYPASSRLS reporting role on a replica*, never the app role. App RLS is untouched. (OQ2.)
- **R2 (self-promotion via header):** `X-Tenant-ID` still requires `tenant_members` proof (existing filter) — switcher can't reach clinics the user isn't a member of.
- **R3 (dead CRUD):** Phase 0.1/0.2 lock the invariant that `admin:tenants:manage` is **NOT** granted to tenant-scoped `ADMIN` (negative contract test asserts 403 for clinic ADMIN). The CRUD is unblocked only for `PLATFORM_ADMIN` in Phase 0.5.
- **R7 (cross-tenant escalation — the review-caught flaw):** tenant management + analytics are tenant-transcending capabilities. They are granted **only to the `PLATFORM_ADMIN` principal** (Phase 0.5), which lives above all tenants and is excluded from `tenant_members` scoping. ADMIN remains strictly home-clinic scoped. `tenants` table has no RLS (verified) — so without this separation, `getAllTenants()`/`deleteTenant(id)` would be a live escalation the moment the permission touched ADMIN. Phase 0.5.6 is a review gate that greps the seeded/authority data to prove the transcending perms appear only for `PLATFORM_ADMIN`.
- **R8 (wildcard creep):** platform-admin authorities are a fixed, explicit set emitted only for the platform flag/claim — mirroring `AdminScopeAuthorities.expand()` which rejects `*`/`admin:*` expansion. No role ever gets a wildcard that silently spans tenants.
- **R4 (audit gap):** every assignment + every analytics call is logged; analytics returns aggregates only (no PHI).
- **R5 (replica fallback):** if the reporting connection is unavailable, analytics falls back to the app role (RLS on) → returns only admin's home tenant, never a leak.
- **R6 (blast radius):** analytics counts only the 7 scoped tables + users; `TenantScopedTables` registry reused.

## Verification gates (every task)
- Backend: `./mvnw test` (green) + `./mvnw checkstyle:check` (0 violations). Phase 3 task gets a Testcontainers integration test reusing `app_user` (NOBYPASSRLS) to prove zero leakage.
- Frontend: `npm run lint -- --max-warnings=0`, `npm run test -- run`, `npm run contract:api` (alignment with backend DTOs).
- Security review after each phase: confirm no `@PreAuthorize` removed, no `BYPASSRLS` added to app role, no raw PHI in analytics.

## Open questions (flagged, non-blocking)
- **OQ-A** ~~How is `roles.permissions` actually stored/parsed?~~ **ANSWERED:** seeded via `pg_temp.seed_role_permissions(...)` in `V89` into `rbac_permissions` + `rbac_role_permissions`, mirrored into `roles.permissions` JSON. Phase 0.5 uses the same mechanism; do not invent a new one, and do not add `admin:tenants:manage`/`admin:analytics:view` to `ADMIN`.
- **OQ-B** Should non-ADMIN clinic-admins manage *their own* tenant's users? Deferred; v1 restricts tenant ops to platform `PLATFORM_ADMIN`. (Clinic ADMIN manages its own clinic's users via existing `admin:user:*` scoped perms — already tenant-scoped by RLS.)
- **OQ-C** Analytics replica: does the deployment have a read replica? If yes, analytics uses a replica; if no, it uses a dedicated exempt role on the primary (still separate from the app role). Confirm infra in Task 3.1.
- **OQ-D (new, from review):** `tenants` table has no RLS (verified). Confirm whether platform-admin tenant management should run on the app connection (safe, since it's a platform principal, not RLS-bounded) or the reporting/exempt connection. Decision: platform-admin management uses the **app connection** (it legitimately spans tenants by explicit selection); only the **analytics read path** uses the BYPASSRLS reporting connection. Do not add RLS to `tenants` (it would break "operator sees all clinics"); instead gate it purely by the `PLATFORM_ADMIN` authority.

## Rollout safety
- Tenant CRUD/assignment are additive; existing `admin_emr` (home = default tenant, **clinic-scoped ADMIN**) is unaffected and **must remain unable** to manage other tenants (Phase 0.2 negative test).
- **`admin:tenants:manage` / `admin:analytics:view` are granted ONLY to `PLATFORM_ADMIN`** (Phase 0.5). This is the load-bearing security invariant; Phase 0.5.6 verifies it and Phase 0.1 locks ADMIN's seeded set against regression.
- Analytics is read-only aggregates; no writes to tenant data.
- Do NOT grant `BYPASSRLS` to the app's DB role under any circumstance.
- Do NOT add RLS to the `tenants` table — gate it by `PLATFORM_ADMIN` authority instead (OQ-D).
