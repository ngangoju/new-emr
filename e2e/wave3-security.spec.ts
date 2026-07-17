import { test, expect, type Page } from '@playwright/test'

/**
 * Wave 3 - Security & Access Control
 *
 * Cross-references UI/API behaviour against the RBAC oracle:
 *  - V88__seed_default_role_permissions.sql  (authorization oracle)
 *  - Backend "Authorization blocked" log lines (intentional 403 vs real bug)
 *
 * Flags:
 *  - Privilege escalation (lower role reaching higher-role endpoint)
 *  - Cross-role data leakage (role A reads role B-scoped data via API)
 */

const API_URL = process.env.E2E_AUTH_API_BASE || 'http://localhost:8888'
const PASSWORD = 'password123'

async function loginAs(page: Page, username: string) {
    await page.goto('/login')
    await page.locator('input[name="username"], input[placeholder="username"]').fill(username)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/dashboard.*/, { timeout: 20000 }).catch(async () => {
        await page.getByText(/portal|dashboard|welcome back/i, { exact: false }).first().waitFor({ timeout: 5000 }).catch(() => {})
    })
    await page.waitForFunction(() => !location.pathname.includes('/login'), { timeout: 5000 }).catch(() => {})
}

// Expected 403 map derived from V88 role->permission grants.
// If a call returns 200 where the oracle says the role lacks the permission, that's a finding.
const EXPECTED_FORBIDDEN: Array<{ role: string; user: string; endpoint: string; reason: string }> = [
    { role: 'CASHIER', user: 'cashier_emr', endpoint: '/api/users', reason: 'cashier lacks admin:user:read' },
    { role: 'DOCTOR', user: 'doctor_emr', endpoint: '/api/users', reason: 'doctor lacks admin:user:read' },
    { role: 'NURSE', user: 'nurse_emr', endpoint: '/api/users', reason: 'nurse lacks admin:user:read' },
    { role: 'PHARMACIST', user: 'pharmacist_emr', endpoint: '/consultations', reason: 'pharmacist lacks consultation:read' },
    { role: 'LABORANTIN', user: 'laborantin_emr', endpoint: '/api/billing/invoices', reason: 'lab lacks billing:invoice:read' },
    { role: 'RECEPTIONIST', user: 'receptionist_emr', endpoint: '/api/billing/invoices', reason: 'receptionist lacks billing:invoice:read' },
]

test.describe('Wave 3 - Security & Access Control', () => {

    test.describe('RBAC Oracle Conformance (API-level 403s)', () => {
        for (const c of EXPECTED_FORBIDDEN) {
            test(`${c.role} MUST be blocked from ${c.endpoint} (${c.reason})`, async ({ page }) => {
                await loginAs(page, c.user)
                const res = await page.request.get(`${API_URL}${c.endpoint}`)
                expect(res.status()).toBe(403)
            })
        }
    })

    test.describe('Privilege Escalation Probes', () => {
        test('SECURITY role cannot read other-role scoped admin endpoints', async ({ page }) => {
            await loginAs(page, 'security_emr')
            const res = await page.request.get(`${API_URL}/api/users`)
            expect(res.status()).toBe(403)
        })

        test('USER (demo) role cannot reach clinical data', async ({ page }) => {
            await loginAs(page, 'user_emr')
            const res = await page.request.get(`${API_URL}/patients`)
            // USER has only dashboard:read + notification:read per V88
            expect([403, 401]).toContain(res.status())
        })

        test('CUSTOMER_CARE cannot create invoices (no billing:invoice:create)', async ({ page }) => {
            await loginAs(page, 'customer_care_emr')
            const res = await page.request.post(`${API_URL}/api/billing/invoices`, {
                data: { patientId: '00000000-0000-0000-0000-000000000000', items: [] },
            })
            expect(res.status()).toBe(403)
        })
    })

    test.describe('Cross-Role Data Leakage (API)', () => {
        test('non-admin cannot list all users (no cross-role directory leak)', async ({ page }) => {
            await loginAs(page, 'laborantin_emr')
            const res = await page.request.get(`${API_URL}/api/users`)
            expect(res.status()).toBe(403)
        })

        test('receptionist cannot read radiology reports they are not scoped for', async ({ page }) => {
            await loginAs(page, 'receptionist_emr')
            const res = await page.request.get(`${API_URL}/imaging`)
            // receptionist route policy does NOT include /radiology; backend should 403
            expect([403, 404]).toContain(res.status())
        })
    })

    test.describe('Auth Token / Session Security', () => {
        test('protected API without cookie returns 401 not 403', async ({ page }) => {
            const res = await page.request.get(`${API_URL}/api/patients`)
            expect(res.status()).toBe(401)
        })

        test('logout invalidates session (subsequent protected call 401)', async ({ page }) => {
            await loginAs(page, 'doctor_emr')
            // Call backend logout
            const logoutRes = await page.request.post(`${API_URL}/auth/logout`)
            expect([200, 204, 401, 403]).toContain(logoutRes.status())
            // After logout, a protected call should fail
            const after = await page.request.get(`${API_URL}/api/patients`)
            expect([401, 403]).toContain(after.status())
        })
    })

    test.describe('URL-Based Access Control (UI redirect)', () => {
        const blockedRoutes: Array<{ user: string; path: string }> = [
            { user: 'cashier_emr', path: '/dashboard/admin' },
            { user: 'nurse_emr', path: '/dashboard/admin/roles' },
            { user: 'pharmacist_emr', path: '/dashboard/doctor/consultations' },
            { user: 'laborantin_emr', path: '/dashboard/approvals' },
            { user: 'receptionist_emr', path: '/dashboard/reports/usage' },
        ]
        for (const r of blockedRoutes) {
            test(`${r.user} blocked from ${r.path}`, async ({ page }) => {
                await loginAs(page, r.user)
                await page.goto(r.path)
                const forbidden = await page.locator('text=403, text=forbidden, text=access denied').count()
                const redirected = !page.url().includes(r.path.split('/').slice(0, 3).join('/'))
                expect(forbidden > 0 || redirected).toBeTruthy()
            })
        }
    })
})
