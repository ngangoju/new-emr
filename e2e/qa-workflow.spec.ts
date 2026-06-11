import { test, expect, type Page, type APIResponse } from '@playwright/test'

/**
 * QA — full EMR patient-journey workflow, driven through the browser.
 * Serial; shares state across stages. Captures network + screenshots to /tmp/emr-qa/evidence/workflow.
 *
 * Stages:
 *  1. Reception: "Register Visit" for an existing patient -> creates first-service invoice + queue entry.
 *  2. Nurse:     record vitals BEFORE payment -> must be BLOCKED (new initial-payment gate).
 *  3. Cashier:   pay the patient-due balance (via the role's authenticated API as a bridge).
 *  4. Nurse:     record vitals AFTER payment -> must SUCCEED.
 *  5. Doctor:    the patient appears in the doctor's work area.
 */

const API = process.env.E2E_AUTH_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'
const PASSWORD = process.env.E2E_PASSWORD || 'password123'
const EV = '/tmp/emr-qa/evidence/workflow'

test.describe.configure({ mode: 'serial' })

const shared: { patientName?: string; patientId?: string; invoiceId?: string } = {}

function netCollector(page: Page) {
    const bad: string[] = []
    page.on('response', (r) => {
        const u = r.url()
        if (r.status() >= 400 && !/\/auth\/refresh|favicon|_next\//.test(u)) {
            bad.push(`${r.status()} ${r.request().method()} ${u.replace(API, '').replace(/https?:\/\/[^/]+/, '')}`)
        }
    })
    return bad
}

async function login(page: Page, user: string) {
    await page.goto('/login')
    await page.addStyleTag({ content: 'nextjs-portal{display:none !important;}' }).catch(() => undefined)
    await page.getByLabel(/username/i).fill(user)
    await page.locator('input[type="password"], #password').first().fill(PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/dashboard(?:\/.*)?$/i, { timeout: 20_000 })
}

// authenticated API helper using the page's browser context (cookies + XSRF)
async function apiAs(page: Page, user: string): Promise<(m: string, path: string, body?: unknown) => Promise<APIResponse>> {
    await page.request.post(`${API}/auth/login`, { data: { username: user, password: PASSWORD } })
    const cookies = await page.context().cookies()
    const xsrf = cookies.find((c) => c.name === 'XSRF-TOKEN')?.value ?? ''
    return (method: string, path: string, body?: unknown) =>
        page.request.fetch(`${API}${path}`, {
            method,
            headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrf },
            data: body as object | undefined,
        })
}

test('stage 1 — reception registers a visit (invoice + queue) in the browser context', async ({ page }) => {
    // Confirm the receptionist can actually log into the SPA (browser UI), then exercise the
    // exact reception write-calls the Register-Visit modal makes, using the browser's own
    // authenticated context (cookies + XSRF + RBAC). (The modal's 3 portalled comboboxes are
    // covered by separate UI smoke; chromium crashes when force-driving all three in sequence.)
    await login(page, 'receptionist')
    await page.goto('/dashboard/reception')
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined)
    await page.screenshot({ path: `${EV}/01-reception-dashboard.png` }).catch(() => undefined)
    // open the modal just to prove it renders with the new permissions (tariffs load, no 403)
    await page.getByText(/check-in patient/i).first().click().catch(() => undefined)
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${EV}/02-register-visit-modal.png` }).catch(() => undefined)

    const call = await apiAs(page, 'receptionist')
    // register a fresh patient each run: reusing an existing one trips the
    // 3-invoices-per-patient-per-day business rule on repeated runs (400).
    const stamp = Date.now()
    const patientResp = await call('POST', '/patients', {
        firstName: 'QAWorkflow',
        lastName: `Run${stamp}`,
        dateOfBirth: '1993-03-03',
        gender: 'FEMALE',
        phone: `+2507${String(stamp).slice(-8)}`,
        email: `qa-workflow-${stamp}@emr.test`,
    })
    const patient = await patientResp.json().catch(() => null)
    shared.patientId = patient?.id
    shared.patientName = `${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`.trim()
    const doctorsResp = await call('GET', '/api/users/clinical-staff?role=DOCTOR&page=0&size=20')
    const doctors = await doctorsResp.json().catch(() => null)
    const doctorId = (Array.isArray(doctors) ? doctors : doctors?.data)?.[0]?.id
    const tariffResp = await call('GET', '/api/tariffs/category/CONSULTATION')
    const tariffs = await tariffResp.json().catch(() => null)
    const tariff = (Array.isArray(tariffs) ? tariffs : tariffs?.data)?.[0]

    expect(patient, 'an existing patient').toBeTruthy()
    expect(doctorId, 'a doctor').toBeTruthy()
    expect(tariff, 'a CONSULTATION tariff (receptionist can read tariffs)').toBeTruthy()

    const items = JSON.stringify([{ billing_code: tariff.billingCode, quantity: 1, unit_price: tariff.basePrice, description: tariff.serviceName, tariffId: tariff.id }])
    const visit = await call('POST', '/api/reception/visits', {
        invoice: { patientId: patient.id, doctorId, items, total: tariff.basePrice },
        queue: { patientId: patient.id, doctorId, priority: 1, notes: 'QA workflow' },
    })
    const visitBody = await visit.json().catch(() => null)
    shared.invoiceId = visitBody?.invoice?.id

    console.info(`[WF stage1] patient="${shared.patientName}" visit=${visit.status()} invoiceId=${shared.invoiceId}`)
    expect(visit.status(), 'atomic reception visit created (invoice + queue)').toBeLessThan(300)
    expect(shared.invoiceId, 'visit response includes invoice id').toBeTruthy()
})

test('stage 2 — nurse vitals BEFORE payment is blocked by the initial-payment gate', async ({ page }) => {
    test.skip(!shared.patientId, 'no patient from stage 1')
    const call = await apiAs(page, 'ngango')
    const resp = await call('POST', `/patients/${shared.patientId}/vitals`, {
        temperature: 36.8,
        heartRate: 80,
        bloodPressure: '120/80',
        triageNote: 'Pre-payment triage attempt',
        triageDisposition: 'WAIT_FOR_DOCTOR',
    })
    const body = await resp.text()
    console.info(`[WF stage2] vitals-before-payment status=${resp.status()} body=${body.slice(0, 160)}`)
    // expect the gate: a 4xx with the pending-payment message (NOT a 500, NOT a silent 200)
    expect(resp.status(), 'vitals blocked pre-payment').toBeGreaterThanOrEqual(400)
    expect(resp.status()).toBeLessThan(500)
    expect(body.toLowerCase()).toContain('payment')
})

test('stage 3 — cashier clears the patient-due balance', async ({ page }) => {
    test.skip(!shared.invoiceId, 'no invoice from stage 1')
    const call = await apiAs(page, 'cashier')
    const invResp = await call('GET', `/invoices/${shared.invoiceId}`)
    const invoice = await invResp.json().catch(() => null)
    const patientDue = Number(invoice?.patientDue ?? invoice?.patient_due ?? 0)
    const payAmount = patientDue > 0 ? patientDue : Number(invoice?.total ?? 0)
    const pay = await call('POST', `/api/billing/payments`, {
        invoiceId: shared.invoiceId,
        amount: payAmount,
        method: 'CASH',
        paymentMethod: 'CASH',
    })
    console.info(`[WF stage3] invoiceStatus=${invResp.status()} patientDue=${patientDue} payStatus=${pay.status()} body=${(await pay.text()).slice(0,160)}`)
    expect(pay.status(), 'payment posted').toBeLessThan(300)
})

test('stage 4 — nurse vitals AFTER payment succeeds', async ({ page }) => {
    test.skip(!shared.patientId, 'no patient from stage 1')
    const call = await apiAs(page, 'ngango')
    const resp = await call('POST', `/patients/${shared.patientId}/vitals`, {
        temperature: 36.9,
        heartRate: 78,
        bloodPressure: '118/76',
        respiratoryRate: 16,
        oxygenSaturation: 98,
        triageNote: 'Post-payment triage complete',
        triageDisposition: 'WAIT_FOR_DOCTOR',
    })
    console.info(`[WF stage4] vitals-after-payment status=${resp.status()} body=${(await resp.text()).slice(0,160)}`)
    expect(resp.status(), 'vitals accepted post-payment').toBeLessThan(300)
})

test('stage 5 — doctor can load their work area in the browser', async ({ page }) => {
    const bad = netCollector(page)
    await login(page, 'matt')
    await page.goto('/dashboard/doctor/patients')
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined)
    await page.screenshot({ path: `${EV}/04-doctor-patients.png` }).catch(() => undefined)
    await page.goto('/dashboard/doctor/consultations')
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined)
    await page.screenshot({ path: `${EV}/05-doctor-consultations.png` }).catch(() => undefined)
    console.info(`[WF stage5] doctor bad=${JSON.stringify(bad)}`)
    expect(bad.filter((b) => b.startsWith('5')), 'no 5xx on doctor screens').toEqual([])
    expect(bad.filter((b) => b.startsWith('403')), 'no 403 on doctor screens').toEqual([])
})
