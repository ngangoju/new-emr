import { test, expect, type Page } from '@playwright/test'

/**
 * QA — access-denied popup sweep.
 * Logs in as every role, visits each dashboard page that role's navigation exposes,
 * and asserts no 403/5xx network responses and no "Action Failed" / error dialog appears.
 */

const API = 'http://localhost:8888'
const PASSWORD = 'password123'

const ROLE_PAGES: Record<string, string[]> = {
    receptionist: ['/dashboard/reception', '/dashboard/doctor/patients', '/dashboard/doctor/schedule'],
    cashier: ['/dashboard/billing', '/dashboard/cashier/close', '/dashboard/billing/claims'],
    ngango: ['/dashboard/nurse', '/dashboard/nurse/admissions', '/dashboard/doctor/patients', '/dashboard/lab', '/dashboard/pharmacy', '/dashboard/billing'],
    matt: ['/dashboard', '/dashboard/doctor/patients', '/dashboard/doctor/consultations', '/dashboard/doctor/schedule', '/dashboard/lab', '/dashboard/radiology', '/dashboard/pharmacy'],
    lab: ['/dashboard/lab', '/dashboard/doctor/patients'],
    pharmacist1: ['/dashboard/pharmacy', '/dashboard/doctor/patients'],
    radiologist1: ['/dashboard/radiology', '/dashboard/lab'],
    chiefnurse1: ['/dashboard/nurse', '/dashboard/nurse/admissions', '/dashboard/billing'],
    director1: ['/dashboard/approvals', '/dashboard/doctor/consultations', '/dashboard/reports'],
    accountant1: ['/dashboard/reports'],
    admin_emr: ['/dashboard/admin', '/dashboard/approvals', '/dashboard/reception', '/dashboard/nurse', '/dashboard/billing', '/dashboard/lab', '/dashboard/pharmacy', '/dashboard/radiology'],
}

async function login(page: Page, user: string) {
    await page.goto('/login')
    await page.locator('input[name="username"], #username').first().fill(user)
    await page.locator('input[type="password"], #password').first().fill(PASSWORD)
    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL(/\/dashboard(?:\/.*)?$/i, { timeout: 20_000 })
}

for (const [user, pages] of Object.entries(ROLE_PAGES)) {
    test(`no access-denied popups for ${user}`, async ({ page }) => {
        const bad: string[] = []
        page.on('response', (r) => {
            const status = r.status()
            if ((status === 403 || status >= 500) && !/favicon|_next\//.test(r.url())) {
                bad.push(`${status} ${r.request().method()} ${r.url().replace(API, '')}`)
            }
        })

        await login(page, user)

        for (const path of pages) {
            await page.goto(path)
            await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined)
            // any modal dialog with the error styling?
            const dialog = page.getByRole('dialog').filter({ hasText: /action failed|access denied|forbidden/i })
            await expect(dialog, `no error dialog on ${path} as ${user}`).toHaveCount(0)
        }

        expect(bad, `no 403/5xx for ${user} across ${pages.join(', ')}`).toEqual([])
    })
}
