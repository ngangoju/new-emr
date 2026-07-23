# Enforce Tenant (Row-Level) Isolation — Implementation Plan (v3, corrected)

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task. Each task is 2–5 min, TDD, frequent commits. The three design corrections from review are baked in: **(1) JWT-authoritative trust** (header only with `tenant_members` proof), **(2) fully reactive `TenantContext`** (no `.block()` in the request path), **(3) RLS-first ordering** (DB enforces every row; query rewrites shrink to insert-stamping; pool-safe `SET`/`RESET` so RLS can't become a new leak).

**Goal:** Turn tenant isolation from *scaffolded* into *enforced and proven* so Clinic A can never read or mutate Clinic B's data across HTTP, WebSocket, reactive concurrency, and bulk paths — with the database itself (Postgres RLS) as the enforcement authority, not hand-written per-query predicates.

**Architecture:**
- **Shared Postgres, row-level isolation** via `tenant_id` (already migrated in `V132`/`V133`: columns + indexes + default + backfill on 7 tables; seeded default tenant `00000000-0000-0000-0000-000000000001`).
- **JWT is the only authority for tenant.** At login, `JwtTokenProvider` stamps `tenantId` from `users.tenant_id` (server-side, never client-controlled). `TenantFilter` reads the claim and writes the resolved tenant into the **Reactor `Context`** for the whole reactive chain. The `X-Tenant-ID` header is accepted **only** when a `tenant_members` row proves the user belongs to that tenant (the deferred multi-clinic-admin case) — never as an unverified override.
- **Reactive-safe context:** `TenantContext.currentTenant()` returns `Mono<UUID>` via `Mono.deferContextual`. **No `.block()` anywhere in the request path.** Services `flatMap` it.
- **RLS is the enforcement layer (FIRST, not last).** After the connection decorator sets `app.tenant_id` per connection, we enable `FORCE ROW LEVEL SECURITY` with `USING (tenant_id = app_tenant_id())` + `WITH CHECK`. The DB then scopes **every** read and write on scoped tables — including queries nobody edited. App-layer query predicates become optional defense-in-depth, not the mechanism.
- **Pool-safe variable:** the R2DBC `ConnectionFactory` decorator does `SET app.tenant_id = $1` on acquire and **`RESET app.tenant_id` on close** (before the connection returns to the pool). Plain `SET` would persist on the pooled connection → tenant bleed; `RESET` on close prevents it.
- **WebSocket parity:** the WS auth path resolves the tenant from the JWT claim, stores it per session, wraps reactive calls with `TenantContext.withTenant`, and scopes broadcasts by tenant.
- **DB-per-tenant seam preserved:** a `TenantDatabaseRouter` abstraction routes to the single shared DB today but is the extension point for Neon DB-per-tenant later.
- **Rollout safety:** `app_tenant_id()` `COALESCE`s to the default tenant when unset, and all existing rows already live in the default tenant, so enabling RLS is behavior-preserving for the current single-tenant deployment. **Do not onboard a second real clinic until the Task 10 two-tenant isolation tests pass.**

**Tech Stack:** Java 21, Spring WebFlux (reactive), R2DBC (reactive Postgres driver), jjwt, Postgres 15+. Frontend: Next.js + axios, React Query. Backend repo `new-emr-backend`, frontend repo `new-emr`.

---

## Verified current state (read-only reconnaissance)
- `V132`: `tenants` + `tenant_members`; adds `tenant_id` (+ indexes, NOT NULL) to **7 tables** (`patients, appointments, consultations, queue_entries, lab_orders, prescriptions, visit_tickets`); seeds default tenant `…0001`.
- `V133`: sets `DEFAULT '…0001'` on those columns so unscoped inserts still land in default tenant.
- **`TenantContext` uses a `static AtomicReference`** — NOT request-scoped → cross-request leak on the shared WebFlux event loop. Removal is the single most important fix.
- **Models: NONE of the 7 entities map `tenantId`**; `CustomPatientRepositoryImpl` INSERT/UPDATE SQL omits `tenant_id` (relies on DB default).
- **Repositories: zero `tenant_id` predicates.** Unscoped reads (`findAllEnriched`, `findTodaysAppointmentsAll`, `findByStatus`, counts) and unscoped mutations (`QueueEntryRepository.updateQueueEntryStatus WHERE id=:id`, `CustomPatientRepositoryImpl.update WHERE id=:id`).
- **JWT** has no `tenantId` claim. **`TenantFilter`** reads `X-Tenant-ID` header, 403s inactive, calls `TenantContext.setOverride` (static, wrong) — and never checks the user *belongs* to the header tenant.
- **WebSocket** `QueueWebSocketHandler` decodes JWT itself, never sets tenant, broadcasts globally.
- **Frontend:** HttpOnly-cookie auth; `/auth/me` consumed in `src/hooks/api/useAuth.ts`, `src/hooks/useSessionUser.ts`, `src/app/dashboard/layout.tsx`, `src/lib/utils/auth.ts`. No tenant header sent.
- **92 model classes** exist; many more hold PHI. A `TenantScopedTables` registry prevents whack-a-mole for later phases.

## Assumptions
- Each `User` has exactly one home tenant in `users.tenant_id` (single membership for the auth identity). `tenant_members` is for future per-tenant role overlays / multi-clinic admins.
- `users.tenant_id` may not exist — verify in Task 0; add if absent.
- `tenant_members(user_id, tenant_id)` already exists (from `V132`); we add a lookup repository.
- Default tenant `…0001` is the safe fallback; existing rows are backfilled.
- Maven quark (project memory): avoid NEW top-level DTO/record classes when a new-class resolution issue is suspected; extend existing DTOs. We extend `AuthResponse`, not create a new type.
- Reactive tests via `./mvnw test`; frontend via `npm run test -- run` + `npm run lint -- --max-warnings=0` + `npm run contract:api`.

## Risks / Tradeoffs (corrected)
- **R1 (leak via static context):** fixed by Task 1 (Reactor Context) — mandatory before any enforcement claim.
- **R2 (leak via trusting client header):** fixed by Task 2 (JWT-authoritative; header only with `tenant_members` proof).
- **R3 (blocking in WebFlux):** fixed by Task 1 fully-reactive API; services `flatMap`.
- **R4 (RLS pool bleed):** fixed by Task 4 `RESET on close`; the decorator is the linchpin.
- **R5 (RLS applies to owner):** use `FORCE ROW LEVEL SECURITY` and ensure the app DB role is **not** a superuser / has `NO BYPASSRLS` (default for non-superusers). Cross-tenant admin aggregates use a separate `BYPASSRLS` reporting role (OQ2), never a weakened policy.
- **R6 (rollout):** `app_tenant_id()` defaults to default tenant when unset → enabling RLS with the decorator live is behavior-preserving; a missed wiring bug shows default-tenant data (a correctness bug, **not** a cross-tenant leak).
- **R7 (blast radius):** only the 7 migrated tables get RLS now; `TenantScopedTables` lists them and is the registry for later PHI tables.

## Open questions (flagged, non-blocking)
- **OQ1 Multi-clinic admins:** the `X-Tenant-ID` + `tenant_members` path in Task 2 is the *only* sanctioned switch; it requires a real tenant-switcher UI (deferred). Until then the header is ignored.
- **OQ2 Cross-tenant admin dashboards:** build as a separate service/role with `BYPASSRLS` (e.g. analytics replica), not by weakening the per-tenant policy.
- **OQ3 DB-per-tenant:** remains the recommended architecture for paying clinics (Neon, scale-to-zero, physical isolation, per-customer backup/export, data-sovereignty story). RLS is the defense-in-depth *inside* each DB and what makes the cheap shared tier safe for small clinics. `TenantDatabaseRouter` (Task 9) is the seam.

---

# TASK 0 — Registry, `users.tenant_id`, `tenant_members` lookup
**Objective:** Source of truth for a user's tenant + a single list of scoped tables + the membership lookup the filter needs.

**Files:**
- Read: `V133__tenant_id_defaults.sql`
- Possibly create: `src/main/resources/db/migration/V134__users_tenant_id.sql`
- Modify: `src/main/java/com/emr/newemrbackend/model/User.java`
- Create: `src/main/java/com/emr/newemrbackend/security/TenantScopedTables.java`
- Create: `src/main/java/com/emr/newemrbackend/repository/TenantMemberRepository.java`

**Step 1: inspect**
```
cd new-emr-backend
grep -rn "tenant" src/main/resources/db/migration/ | grep -i user
grep -n "tenantId\|tenant_id" src/main/java/com/emr/newemrbackend/model/User.java
```
**Step 2 (if `users.tenant_id` missing):** `V134__users_tenant_id.sql`
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
UPDATE users SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE users ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
```
**Step 3:** `User.java` add (with existing `@Column` import):
```java
@Column("tenant_id")
private UUID tenantId;
```
**Step 4:** registry
```java
package com.emr.newemrbackend.security;
import java.util.Set;
public final class TenantScopedTables {
    public static final Set<String> TABLES = Set.of(
        "patients","appointments","consultations","queue_entries",
        "lab_orders","prescriptions","visit_tickets"
        // later phases append: patient_vitals, insurance_claims, admissions, ...
    );
    private TenantScopedTables(){}
}
```
**Step 5:** membership lookup
```java
package com.emr.newemrbackend.repository;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;
import java.util.UUID;
@Repository
public interface TenantMemberRepository extends R2dbcRepository<TenantMember, UUID> {
    Mono<Boolean> existsByUserIdAndTenantId(UUID userId, UUID tenantId);
}
```
(Add `TenantMember` model if absent, mapping `tenant_members`.)
**Step 6: verify** `./mvnw -q compile` → SUCCESS. **Step 7: commit** `git add -A && git commit -m "feat(tenant): users.tenant_id + TenantScopedTables + TenantMemberRepository"`

---

# TASK 1 — `TenantContext` fully reactive (no `.block()`) — CRITICAL
**Objective:** Replace the static `AtomicReference` with a Reactor-`Context`-keyed, fully non-blocking API.

**Files:** Rewrite `src/main/java/com/emr/newemrbackend/security/TenantContext.java`

**Step 1: write failing test** `src/test/java/com/emr/newemrbackend/security/TenantContextReactiveTest.java`
```java
package com.emr.newemrbackend.security;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

class TenantContextReactiveTest {
    @Test void withTenantWinsOverContextPut() {
        UUID a = UUID.randomUUID(), b = UUID.randomUUID();
        UUID r = TenantContext.withTenant(a, Mono.defer(TenantContext::currentTenantId))
                    .contextWrite(ctx -> ctx.put(TenantContext.KEY, b)).blockFirst();
        assertEquals(a, r);
    }
    @Test void absentFallsBackToDefault() {
        assertEquals(TenantContext.DEFAULT_TENANT_ID,
            TenantContext.currentTenantId().blockFirst().toString());
    }
    @Test void concurrentTenantsDoNotLeak() {
        UUID a = UUID.randomUUID(), b = UUID.randomUUID();
        String r1 = TenantContext.withTenant(a, Mono.just("A").subscribeOn(Schedulers.parallel())).block();
        String r2 = TenantContext.withTenant(b, Mono.just("B").subscribeOn(Schedulers.parallel())).block();
        assertEquals("A", r1); assertEquals("B", r2);
        assertEquals(TenantContext.DEFAULT_TENANT_ID,
            TenantContext.currentTenantId().blockFirst().toString());
    }
}
```
> These tests use `.blockFirst()` only in the *test*. Production code must never block.
**Step 2: run, expect FAIL** `./mvnw -q test -Dtest=TenantContextReactiveTest`
**Step 3: rewrite**
```java
package com.emr.newemrbackend.security;

import reactor.core.publisher.Mono;
import reactor.util.context.ContextView;
import java.util.UUID;

public final class TenantContext {

    public static final String DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";
    public static final Class<UUID> KEY = UUID.class;

    private TenantContext() {}

    /** Fully reactive tenant read from the Reactor Context. Default if absent. NEVER blocks. */
    public static Mono<UUID> currentTenantId() {
        return Mono.deferContextual(ctx ->
            Mono.just(ctx.getOrEmpty(KEY).orElse(UUID.fromString(DEFAULT_TENANT_ID))));
    }

    /** Wrap a chain so tenant is set for its entire duration. */
    public static <T> Mono<T> withTenant(UUID tenantId, Mono<T> mono) {
        return mono.contextWrite(ctx -> ctx.put(KEY, tenantId));
    }

    /** Read tenant from an already-available ContextView (e.g. inside a subscriber). */
    public static UUID fromContext(ContextView ctx) {
        return ctx.getOrEmpty(KEY).orElse(null);
    }

    // DEPRECATED: setOverride/clearOverride (static, leaking) removed.
    // A non-reactive escape hatch is intentionally absent — every caller is reactive.
}
```
**Step 4: run** `./mvnw -q test -Dtest=TenantContextReactiveTest` → PASS; full `./mvnw test` green (318+). **Step 5: commit** `git add -A && git commit -m "fix(tenant): reactive-safe TenantContext via Reactor Context (no blocking)"`

---

# TASK 2 — `TenantFilter`: JWT-authoritative, header only with membership proof
**Objective:** Resolve tenant from the JWT claim (server-side authority). Honor `X-Tenant-ID` *only* when `tenant_members` proves the user belongs to it. Write the resolved tenant into the Reactor Context. 403 inactive targets. Never trust an unverified header.

**Files:** Rewrite `src/main/java/com/emr/newemrbackend/security/TenantFilter.java`; requires `TenantMemberRepository` (Task 0).

**Step 1: failing test** `src/test/java/com/emr/newemrbackend/security/TenantFilterTest.java` (WebFlux `MockServerWebExchange` + stub repos):
```java
// A) JWT claim tenant=A, no header           -> chain runs with A
// B) JWT claim A, header=B, NO membership    -> chain runs with A (header ignored, no leak)
// C) JWT claim A, header=B, membership YES, B active -> chain runs with B
// D) JWT claim A, header=B, membership YES, B INACTIVE -> 403, chain not run
// E) JWT claim A, header=B, membership YES, B unknown -> chain runs with A (default fallback)
```
**Step 2: run, expect FAIL.**
**Step 3: rewrite**
```java
package com.emr.newemrbackend.security;

import com.emr.newemrbackend.repository.TenantMemberRepository;
import com.emr.newemrbackend.repository.TenantRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import java.util.UUID;

@Component
@ConditionalOnBean(TenantRepository.class)
public class TenantFilter implements WebFilter {

    private final TenantRepository tenantRepository;
    private final TenantMemberRepository tenantMemberRepository;

    public TenantFilter(TenantRepository tenantRepository, TenantMemberRepository tenantMemberRepository) {
        this.tenantRepository = tenantRepository;
        this.tenantMemberRepository = tenantMemberRepository;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        return org.springframework.security.core.context.ReactiveSecurityContextHolder.getContext()
            .map(ctx -> (Jwt) ctx.getAuthentication().getPrincipal())
            .flatMap(jwt -> {
                UUID jwtTenant = parseClaim(jwt);              // authoritative
                String header = exchange.getRequest().getHeaders().getFirst("X-Tenant-ID");
                if (header == null || header.isBlank() || header.equals(jwtTenant.toString())) {
                    return TenantContext.withTenant(jwtTenant, chain.filter(exchange));
                }
                UUID headerTenant = parse(header);
                // ONLY honor the header if the user is a verified member of that tenant.
                UUID userId = parse(jwt.getClaimAsString("userId"));
                return tenantMemberRepository.existsByUserIdAndTenantId(userId, headerTenant)
                    .flatMap(isMember -> {
                        if (Boolean.FALSE.equals(isMember)) {
                            return TenantContext.withTenant(jwtTenant, chain.filter(exchange)); // ignore header
                        }
                        return tenantRepository.findById(headerTenant)
                            .flatMap(t -> {
                                if (!"active".equalsIgnoreCase(t.getStatus())) {
                                    exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                                    return exchange.getResponse().setComplete();
                                }
                                return TenantContext.withTenant(headerTenant, chain.filter(exchange));
                            })
                            .switchIfEmpty(TenantContext.withTenant(jwtTenant, chain.filter(exchange)));
                    });
            })
            // Unauthenticated/public path (e.g. login, public ticket): default tenant context.
            .switchIfEmpty(TenantContext.withTenant(UUID.fromString(DEFAULT_TENANT_ID), chain.filter(exchange)));
    }

    private UUID parseClaim(Jwt jwt) {
        String c = jwt.getClaimAsString("tenantId");
        return (c != null && !c.isBlank()) ? parse(c) : UUID.fromString(DEFAULT_TENANT_ID);
    }
    private UUID parse(String s) { return UUID.fromString(s); }
}
```
**Step 4: run** `./mvnw -q test -Dtest=TenantFilterTest` → PASS; full suite green. **Step 5: commit** `git add -A && git commit -m "fix(tenant): TenantFilter JWT-authoritative; header only with membership proof"`

---

# TASK 3 — JWT `tenantId` claim + `/auth/me` exposes it (server-side)
**Objective:** The claim is set at login from `users.tenant_id` (server-controlled). `/auth/me` returns it so the frontend can cache it for the future switcher.

**Files:**
- Modify `src/main/java/com/emr/newemrbackend/security/JwtTokenProvider.java` (`generateAccessToken`)
- Modify `src/main/java/com/emr/newemrbackend/dto/AuthResponse.java` (add `tenantId`)
- Modify the `/auth/me` handler (in `AuthController`/`UserController`) to set `tenantId` from `User.getTenantId()`

**Step 1:** in `generateAccessToken`, after the `wardId` claim:
```java
.claim("tenantId", user.getTenantId() != null ? user.getTenantId().toString() : null)
```
**Step 2:** `AuthResponse` add `private UUID tenantId;` (+ getter/setter, or record component).
**Step 3:** me-endpoint: `response.setTenantId(user.getTenantId());`
**Step 4: contract/integration** `cd new-emr && npm run contract:api` → passed (update snapshot if it asserts shape).
**Step 5: commit** `git add -A && git commit -m "feat(tenant): embed tenantId in JWT (server-side) + /auth/me"`

---

# TASK 4 — Connection-level `app.tenant_id` (pool-safe) + `app_tenant_id()` function
**Objective:** Every R2DBC connection runs with `app.tenant_id` set to the current tenant, and is **reset on close** so pooled connections never leak a tenant to the next request. This is the linchpin that makes RLS safe.

**Files:**
- Create `src/main/resources/db/migration/V135__app_tenant_id_fn.sql` (`app_tenant_id()` function)
- Create `src/main/java/com/emr/newemrbackend/config/TenantAwareConnectionFactory.java` (decorator)
- Wire it in the R2DBC config (find `ConnectionFactory` bean / `application*.yml` `r2dbc` config)

**Step 1: migration**
```sql
CREATE OR REPLACE FUNCTION app_tenant_id() RETURNS uuid
  LANGUAGE sql STABLE AS $$
    SELECT COALESCE(
      NULLIF(current_setting('app.tenant_id', true), '')::uuid,
      '00000000-0000-0000-0000-000000000001'::uuid
    );
$$;
```
**Step 2: decorator** (sets on acquire, **RESET on close** — the anti-bleed fix)
```java
package com.emr.newemrbackend.config;

import com.emr.newemrbackend.security.TenantContext;
import io.r2dbc.spi.Connection;
import io.r2dbc.spi.ConnectionFactory;
import io.r2dbc.spi.ConnectionFactoryMetadata;
import reactor.core.publisher.Mono;
import java.util.UUID;

public class TenantAwareConnectionFactory implements ConnectionFactory {

    private final ConnectionFactory delegate;
    public TenantAwareConnectionFactory(ConnectionFactory delegate) { this.delegate = delegate; }

    @Override
    public Mono<Connection> create() {
        return delegate.create().flatMap(conn ->
            TenantContext.currentTenantId()
                .flatMap(tid -> conn.createStatement("SET app.tenant_id = $1")
                    .bind(0, tid).execute().then(Mono.just(conn)))
                .switchIfEmpty(conn.createStatement("SET app.tenant_id = $1")
                    .bind(0, UUID.fromString(TenantContext.DEFAULT_TENANT_ID)).execute().then(Mono.just(conn)))
                .map(c -> (Connection) new ResetOnCloseConnection(c))
        );
    }

    @Override public ConnectionFactoryMetadata getMetadata() { return delegate.getMetadata(); }

    // Wraps close() to RESET before returning the physical conn to the pool.
    static class ResetOnCloseConnection implements Connection {
        private final Connection delegate;
        ResetOnCloseConnection(Connection delegate) { this.delegate = delegate; }
        @Override public Mono<Void> close() {
            return delegate.createStatement("RESET app.tenant_id").execute()
                .then(delegate.close());
        }
        // Delegate every other Connection method to `delegate`
        // (implement the ~20 remaining methods via IDE delegate / r2dbc-proxy if preferred).
        @Override public io.r2dbc.spi.Batch createBatch() { return delegate.createBatch(); }
        @Override public io.r2dbc.spi.Statement createStatement(String sql) { return delegate.createStatement(sql); }
        @Override public io.r2dbc.spi.TransactionDefinition getTransactionDefinition() { return delegate.getTransactionDefinition(); }
        @Override public Mono<Void> beginTransaction() { return delegate.beginTransaction(); }
        @Override public Mono<Void> beginTransaction(io.r2dbc.spi.TransactionDefinition def) { return delegate.beginTransaction(def); }
        @Override public Mono<Void> commitTransaction() { return delegate.commitTransaction(); }
        @Override public Mono<Void> rollbackTransaction() { return delegate.rollbackTransaction(); }
        @Override public Mono<Void> setTransactionIsolationLevel(io.r2dbc.spi.IsolationLevel lvl) { return delegate.setTransactionIsolationLevel(lvl); }
        @Override public Mono<io.r2dbc.spi.IsolationLevel> getTransactionIsolationLevel() { return delegate.getTransactionIsolationLevel(); }
        @Override public boolean isAutoCommit() { return delegate.isAutoCommit(); }
        @Override public Mono<Void> setAutoCommit(boolean ac) { return delegate.setAutoCommit(ac); }
        @Override public java.util.concurrent.CompletableFuture<Void> closeLater() { return delegate.closeLater(); }
        @Override public java.util.concurrent.CompletionStage<Void> getClosedStage() { return delegate.getClosedStage(); }
        @Override public java.util.concurrent.CompletionStage<Boolean> getCloseCount() { return delegate.getCloseCount(); }
    }
}
```
> Implementation note: the delegating methods are mechanical; the subagent may use `io.r2dbc:r2dbc-proxy`'s `ProxyConnectionFactory` with an `onClose` handler instead of hand-writing them — same correctness, less boilerplate. The **required** behaviors are: set `app.tenant_id` at acquire (from Reactor Context), and `RESET app.tenant_id` on close. **Do NOT use a plain `SET` without the reset** — that is the pool-bleed trap.
**Step 3: wire** the Spring config to wrap the real factory:
```java
@Bean
public ConnectionFactory connectionFactory(ConnectionFactory real) {
    return new TenantAwareConnectionFactory(real);
}
```
(Adjust to whatever currently builds the `ConnectionFactory` bean — likely a `ConnectionFactory` `@Bean` or `application.yml` r2dbc; wrap that bean.)
**Step 4: anti-bleed test** `src/test/java/com/emr/newemrbackend/config/TenantAwareConnectionFactoryTest.java`
```java
// acquire conn while context = A; close it; acquire another from same POOL;
// assert current_setting('app.tenant_id') on the second conn is RESET (not A).
```
**Step 5: verify** `./mvnw -q test -Dtest=TenantAwareConnectionFactoryTest` → PASS; full suite green. **Step 6: commit** `git add -A && git commit -m "feat(tenant): pool-safe app.tenant_id SET on acquire + RESET on close"`

---

# TASK 5 — Postgres RLS (the enforcement layer, FIRST)
**Objective:** The database enforces isolation on every read and write of scoped tables. This is the strong, cheap mechanism — applied before any app-layer query edits.

**Files:** Create `src/main/resources/db/migration/V136__enable_rls.sql`

**Step 1: migration**
```sql
-- Strong, DB-enforced isolation. App role must NOT be superuser / must have NO BYPASSRLS.
CREATE OR REPLACE FUNCTION app_tenant_id() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::uuid,
                  '00000000-0000-0000-0000-000000000001'::uuid);
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'patients','appointments','consultations','queue_entries',
    'lab_orders','prescriptions','visit_tickets'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);  -- even owner is scoped
    EXECUTE format(
      'DROP POLICY IF EXISTS tenant_isolation ON %I; ' ||
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = app_tenant_id()) ' ||
      'WITH CHECK (tenant_id = app_tenant_id())', t, t);
  END LOOP;
END $$;
```
**Step 2: RLS test** `src/test/java/com/emr/newemrbackend/security/RlsIsolationTest.java` (`@DataR2dbcTest`):
```java
// Under context tenant=A, insert a row (tenant_id stamped = A).
// Switch connection var to B (SET app.tenant_id = B), read -> empty result.
// Attempt insert with tenant_id forced to B while var=A -> WITH CHECK rejects (error).
```
**Step 3: verify** `./mvnw -q test -Dtest=RlsIsolationTest` → PASS. **Step 4: commit** `git add -A && git commit -m "feat(tenant): FORCE RLS on scoped tables (USING + WITH CHECK app_tenant_id)"`

---

# TASK 6 — Map `tenantId` onto 7 models + stamp on inserts (reactive)
**Objective:** Because RLS `WITH CHECK` requires the row's `tenant_id` to match `app.tenant_id`, every insert MUST stamp the current tenant. Reads need **no** manual predicate (RLS handles them). Updates must not alter `tenant_id`.

**Files:**
- Modify `Patient.java, Appointment.java, Consultation.java, QueueEntry.java, LabOrder.java, Prescription.java, VisitTicket.java` (add field)
- Modify `src/main/java/com/emr/newemrbackend/repository/CustomPatientRepositoryImpl.java` (bind `tenant_id` in INSERT + UPDATE)
- Modify the 7 services to stamp tenant reactively on create/save

**Step 1: add to each model** (with other `@Column` fields):
```java
@Column("tenant_id")
private UUID tenantId;
```
**Step 2: `CustomPatientRepositoryImpl`** — add `tenant_id` to INSERT column/list + binds; add to UPDATE `SET` (and keep `AND tenant_id = :tenantId` in WHERE for defense); bind `patient.getTenantId()`.
**Step 3: services stamp reactively** (never blocking):
```java
return TenantContext.currentTenantId().flatMap(tid -> {
    entity.setTenantId(tid);
    return repo.save(entity);
});
```
For updates, do NOT change `tenant_id` (leave as loaded). 
**Step 4: stamping test** `src/test/java/com/emr/newemrbackend/repository/PatientTenantStampTest.java`:
```java
// under context tenant=A, save a Patient -> assert stored tenant_id == A
// (and RLS allows the read back)
```
**Step 5: verify** `./mvnw -q test` (318+ pass, incl. RLS + stamping). **Step 6: commit** `git add -A && git commit -m "feat(tenant): map tenantId on 7 models + reactive insert stamping"`

---

# TASK 7 — WebSocket tenant parity (JWT-authoritative)
**Objective:** `QueueWebSocketHandler` resolves tenant from the JWT claim, scopes reactive queries, and scopes broadcasts per tenant.

**Files:** Modify `src/main/java/com/emr/newemrbackend/websocket/QueueWebSocketHandler.java`, `WebSocketService.java`, `QueueService.java` (WS-driven queries).

**Step 1:** At WS auth (`extractUserId`), also extract `tenantId` from the JWT claim (reuse `TenantContext` parsing) and store `sessionTenantMap.put(sessionId, tenantId)`; default if absent.
**Step 2:** Wrap every reactive DB call in the handler with `TenantContext.withTenant(tenantId, mono)` so repo queries auto-scope under RLS.
**Step 3:** Broadcasts: maintain `tenantSessions: Map<UUID, Set<String>>`; a queue/patient message for tenant T is sent only to `tenantSessions.get(T)`. Global control messages (server shutdown) may bypass; all PHI is tenant-scoped.
**Step 4: WS isolation test** — two sessions with JWTs of different tenants; publish an event for tenant A; assert only A's session receives it, B does not.
**Step 5: commit** `git add -A && git commit -m "feat(tenant): scope WebSocket handler + broadcasts by tenant (JWT-authoritative)"`

---

# TASK 8 — Frontend: NO header interceptor; capture `tenantId` for future switcher
**Objective:** Per review, the `X-Tenant-ID` axios interceptor is dropped (the backend is JWT-authoritative; an unverified header would be a vulnerability). The frontend only records `tenantId` from `/auth/me` so a future tenant-switcher UI has the value.

**Files:**
- Modify `src/hooks/api/useAuth.ts` (add `tenantId?: string` to `User` interface; capture from `/auth/me`)
- (No change to `src/lib/api.ts` — do NOT add `X-Tenant-ID` there.)

**Step 1:** extend the `User` interface:
```ts
export interface User { id: string; username: string; email?: string; role?: string; permissions?: string[]; active?: boolean; tenantId?: string; }
```
**Step 2:** wherever `/auth/me` resolves the user (`useSessionUser`/`useAuth`/`dashboard/layout`), capture `data.tenantId` (store locally for the future switcher; do not send it as a header).
**Step 3: lint + typecheck**
```
npm run lint -- --max-warnings=0
npx tsc --noEmit
```
Expected: 0/0. **Step 4: commit** `git add -A && git commit -m "feat(tenant): frontend captures tenantId from /auth/me (no header sent)"`

---

# TASK 9 — DB-per-tenant routing seam
**Objective:** Preserve the extension point so Neon DB-per-tenant can slot in later without rewrites. Today it routes everything to the single shared DB.

**Files:** Create `src/main/java/com/emr/newemrbackend/config/TenantDatabaseRouter.java`

**Step 1:**
```java
package com.emr.newemrbackend.config;
import io.r2dbc.spi.ConnectionFactory;
import java.util.UUID;

/** Seam for DB-per-tenant. Currently returns the single shared factory for all tenants.
 *  Later: resolve a per-tenant ConnectionFactory (Neon branch) by tenantId. */
public interface TenantDatabaseRouter {
    ConnectionFactory forTenant(UUID tenantId);
    // default impl returns the shared factory
}
```
Provide a `@Component` default impl returning the shared `ConnectionFactory`. The `TenantAwareConnectionFactory` (Task 4) wraps whatever this returns.
**Step 2: commit** `git add -A && git commit -m "feat(tenant): TenantDatabaseRouter seam for future DB-per-tenant"`

---

# TASK 10 — Full verification + two-tenant concurrency smoke + CI
**Backend:**
```
cd new-emr-backend
./mvnw clean test          # 318+ pass, 0 fail (incl. RLS, stamping, reactive-context, WS isolation)
./mvnw checkstyle:check    # 0 violations
```
**Frontend:**
```
cd new-emr
npm run lint -- --max-warnings=0   # 0/0
npm run test -- run                 # 256 pass
npm run contract:api                # passed
CI=true npm run build               # success
```
**Two-tenant isolation smoke (local):**
1. Seed tenant A + B, 1 patient each (different names).
2. Login as A; `GET /api/patients/search?q=<name>` → only A's patient (RLS + JWT claim).
3. Send `X-Tenant-ID: <B>` as A (no membership) → still A's data (header ignored, no leak).
4. `TenantFilter` → 403 when target tenant inactive.
5. WebSocket: publish queue event for A; only A's WS session receives it.
6. **Concurrency:** 50 parallel requests for A and B simultaneously → assert zero cross-tenant rows in any response (this is the only proof that matters — validates Task 1's reactive fix + Task 4's pool reset).
**Push both repos; confirm via `~/bin/ci-status` (both green). Do NOT onboard a second real clinic until this passes.**

---

## Coverage checklist (every gap → task)
- [x] R1 static-context leak → Task 1 (Reactor Context, no block)
- [x] R2 unverified header trust → Task 2 (JWT-authoritative; header only w/ membership)
- [x] Models unmapped → Task 6
- [x] Patient custom save omits tenant → Task 6 (`CustomPatientRepositoryImpl`)
- [x] Zero repo predicates → Task 5 (RLS enforces; reads need none) + Task 6 (insert stamp)
- [x] JWT no claim → Task 3
- [x] WS bypasses filter / global broadcast → Task 7
- [x] Frontend header leak → Task 8 (interceptor DROPPED; no header sent)
- [x] `/auth/me` no tenant → Task 3 + 8
- [x] UPDATE/DELETE unscoped → Task 5 (RLS WITH CHECK) + Task 6 (preserve tenant_id)
- [x] No DB backstop → Task 4 (var) + Task 5 (RLS FORCE) — triggers dropped per review
- [x] Pool bleed trap → Task 4 (`RESET on close`)
- [x] Registry to avoid whack-a-mole → Task 0 (`TenantScopedTables`)
- [x] DB-per-tenant seam → Task 9
- [x] Tests per layer + concurrency + WS isolation → Tasks 1,2,4,5,6,7,10
- [x] Rollout safety (default fallback) → `app_tenant_id()` COALESCE + V132 backfill
- [ ] Remaining ~85 PHI tables beyond the 7 → registered in `TenantScopedTables`, RLS applied in later phases using Tasks 4–5 patterns (explicitly out of scope; framework-ready)
