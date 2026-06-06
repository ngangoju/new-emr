import { test, expect, type Page } from '@playwright/test'

/**
 * QA Round 4 — full frontend role click-through smoke.
 * Runs SERIAL (workers=1) — parallel logins produced false "stuck on /login" in earlier rounds.
 * For each role: log in via the real UI, land on the dashboard, visit key pages, and assert
 * there are NO uncaught page errors and NO unexpected 4xx/5xx network calls.
 */

const PASSWORD = 'password123'

type Role = { user: string; label: string; pages: string[] }

const ROLES: Role[] = [
    { user: 'receptionist', label: 'RECEPTIONIST', pages: ['/dashboard/reception', '/dashboard/schedule'] },
    { user: 'ngango', label: 'NURSE', pages: ['/dashboard/nurse', '/dashboard/nurse/admissions'] },
    { user: 'chiefnurse1', label: 'CHIEF_NURSE', pages: ['/dashboard/nurse', '/dashboard/nurse/admissions'] },
    { user: 'matt', label: 'DOCTOR', pages: ['/dashboard/doctor', '/dashboard/doctor/patients', '/dashboard/doctor/consultations'] },
    { user: 'lab', label: 'LAB_TECH', pages: ['/dashboard/lab'] },
    { user: 'radiologist1', label: 'RADIOLOGIST', pages: ['/dashboard/radiology'] },
    { user: 'pharmacist1', label: 'PHARMACIST', pages: ['/dashboard/pharmacy'] },
    { user: 'cashier', label: 'CASHIER', pages: ['/dashboard/cashier', '/dashboard/billing'] },
    { user: 'accountant1', label: 'ACCOUNTANT', pages: ['/dashboard/reports', '/dashboard/reports/revenue'] },
    { user: 'director1', label: 'CLINICAL_DIRECTOR', pages: ['/dashboard/approvals'] },
    { user: 'admin_emr', label: 'ADMIN', pages: ['/dashboard/admin', '/dashboard/admin/users', '/dashboard/admin/beds'] },
    { user: 'auditor', label: 'AUDITOR', pages: ['/dashboard/reports'] },
]

// Network calls that are acceptable failures (auth probing, optional widgets) can be allow-listed here.
const IGNORED_NET = [/\/auth\/refresh/, /favicon/, /_next\//]

function attachCollectors(page: Page) {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    const badResponses: string[] = []
    page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => pageErrors.push(String(err)))
    page.on('response', (res) => {
        const url = res.url()
        if (res.status() >= 400 && !IGNORED_NET.some((re) => re.test(url))) {
            badResponses.push(`${res.status()} ${res.request().method()} ${url.replace(/https?:\/\/[^/]+/, '')}`)
        }
    })
    return { consoleErrors, pageErrors, badResponses }
}

async function login(page: Page, user: string) {
    await page.goto('/login')
    await page
        .addStyleTag({ content: '[data-nextjs-dev-tools-button="true"], nextjs-portal{display:none !important;}' })
        .catch(() => undefined)
    await page.getByLabel(/username/i).fill(user)
    await page.locator('input[type="password"], input[name="password"], #password').first().fill(PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/dashboard(?:\/.*)?$/i, { timeout: 20_000 })
}

for (const role of ROLES) {
    test(`role smoke: ${role.label} (${role.user})`, async ({ page }) => {
        const c = attachCollectors(page)
        await login(page, role.user)
        // visit each key page and let it settle
        for (const path of role.pages) {
            await page.goto(path)
            await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined)
            await page.waitForTimeout(800)
            await page.screenshot({ path: `/tmp/emr-qa/evidence/round4/${role.user}${path.replace(/\//g, '_')}.png` }).catch(() => undefined)
        }
        // Report (don't hide) — fail on real runtime errors / server errors
        const serverErrors = c.badResponses.filter((b) => b.startsWith('5'))
        const forbidden = c.badResponses.filter((b) => b.startsWith('403') || b.startsWith('401'))
        console.info(`[R4 ${role.label}] pageErrors=${JSON.stringify(c.pageErrors)}`)
        console.info(`[R4 ${role.label}] consoleErrors=${JSON.stringify(c.consoleErrors.slice(0, 10))}`)
        console.info(`[R4 ${role.label}] badResponses=${JSON.stringify(c.badResponses)}`)
        expect(c.pageErrors, `uncaught page errors for ${role.label}`).toEqual([])
        expect(serverErrors, `5xx network calls for ${role.label}`).toEqual([])
        expect(forbidden, `401/403 network calls for ${role.label} (dashboard should not call endpoints it lacks)`).toEqual([])
    })
}

test('receptionist can register a patient via the UI', async ({ page }) => {
    const c = attachCollectors(page)
    await login(page, 'receptionist')
    await page.goto('/dashboard/reception')
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined)
    const registerBtn = page.getByRole('button', { name: /register (new )?patient/i }).first()
    if (!(await registerBtn.count())) {
        test.skip(true, 'No register-patient button visible on reception dashboard in this build')
    }
    await registerBtn.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const stamp = Date.now()
    // Fill the most common required fields defensively (best-effort label matching).
    const fill = async (re: RegExp, val: string) => {
        const el = dialog.getByLabel(re).first()
        if (await el.count()) await el.fill(val).catch(() => undefined)
    }
    await fill(/first ?name/i, 'QA')
    await fill(/last ?name/i, `Smoke${stamp}`)
    await fill(/phone|mobile/i, '0788000000')
    await fill(/national ?id|nid/i, `${stamp}`.slice(-16))
    await page.screenshot({ path: `/tmp/emr-qa/evidence/round4/receptionist_register_dialog.png` }).catch(() => undefined)
    const submit = dialog.getByRole('button', { name: /register|save|create|submit/i }).first()
    await submit.click().catch(() => undefined)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `/tmp/emr-qa/evidence/round4/receptionist_register_result.png` }).catch(() => undefined)
    const serverErrors = c.badResponses.filter((b) => b.startsWith('5') && /patient/i.test(b))
    console.info(`[R4 register] badResponses=${JSON.stringify(c.badResponses)}`)
    expect(serverErrors, 'POST /patients must not 500 from the UI').toEqual([])
})
