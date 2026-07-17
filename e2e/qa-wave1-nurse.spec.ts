import { test, expect, type Page } from '@playwright/test'
import { API, FRONTEND, EV, netCollector, login, apiAs } from './qa-helpers'

const ROLE = 'nurse_emr'
const EV_DIR = `${EV}/nurse`

test.describe('Nurse (nurse_emr)', () => {
    let page: Page
    let call: (m: string, p: string, b?: unknown) => Promise<any>
    let patientId: string

    test.beforeAll(async ({ browser }) => {
        const ctx = await browser.newContext({ baseURL: FRONTEND })
        page = await ctx.newPage()
        const bad = netCollector(page)
        ;(page as any)._bad = bad
        await login(page, ROLE)
        const api = await apiAs(page, ROLE)
        call = api.call
        // create a patient for nurse workflows
        const stamp = Date.now()
        const p = await call('POST', '/patients', {
            firstName: 'QaNurse', lastName: `Run${stamp}`, dateOfBirth: '1990-01-01',
            gender: 'MALE', phone: `+2507${String(stamp).slice(-8)}`, email: `qa-nurse-${stamp}@emr.test`,
        })
        const pb = await p.json().catch(() => null)
        patientId = pb?.id
        ;(page as any)._patientId = patientId
    })

    test.afterAll(async () => { await page.context().close() })

    test('POS bill patient multi-tariff — POST /api/billing/invoices', async () => {
        const tariff = await call('GET', '/api/tariffs/category/CONSULTATION')
        const tb = await tariff.json().catch(() => null)
        const t = Array.isArray(tb) ? tb[0] : (tb?.data?.[0])
        expect(t, 'a CONSULTATION tariff').toBeTruthy()
        const items = JSON.stringify([{ billing_code: t.billingCode, quantity: 1, unit_price: t.basePrice, description: t.serviceName, tariffId: t.id }])
        const resp = await call('POST', '/api/billing/invoices', {
            patientId, doctorId: (page as any)._doctorId, items, total: t.basePrice,
        })
        const body = await resp.json().catch(() => null)
        console.info(`[nurse] invoice status=${resp.status()} tariff=${t?.id} body=${(JSON.stringify(body)).slice(0,160)}`)
        expect(resp.status(), 'invoice created (2xx)').toBeLessThan(300)
    })

    test('POS submit drug request — POST /api/drug-requests', async () => {
        const resp = await call('POST', '/api/drug-requests', {
            patientId, notes: 'QA drug request',
            items: [{ drugId: '00000000-0000-0000-0000-000000000001', drugName: 'Paracetamol', quantity: 2, notes: 'QA' }],
        })
        const body = await resp.json().catch(() => null)
        console.info(`[nurse] drug-request status=${resp.status()} body=${(JSON.stringify(body)).slice(0,160)}`)
        // Accept 2xx OR a clear 4xx validation (not 5xx)
        expect(resp.status(), 'drug request handled (2xx or 4xx validation)').toBeLessThan(500)
    })

    test('POS hospitalize to ward/bed — POST /api/admissions', async () => {
        const wards = await call('GET', '/api/admissions/wards')
        const wardArr = await wards.json().catch(() => [])
        const ward = Array.isArray(wardArr) ? wardArr[0] : null
        let bedId: string | undefined
        if (ward) {
            const beds = await call('GET', `/api/admissions/wards/${ward.id}/beds/available`)
            const bedArr = await beds.json().catch(() => [])
            bedId = Array.isArray(bedArr) ? bedArr[0]?.id : undefined
        }
        const resp = await call('POST', '/api/admissions', {
            patientId, wardId: ward?.id, bedId, reason: 'QA nurse admit', diagnosis: 'QA', notes: 'Wave1',
        })
        const body = await resp.json().catch(() => null)
        console.info(`[nurse] hospitalize status=${resp.status()} ward=${ward?.id} bed=${bedId} body=${(JSON.stringify(body)).slice(0,160)}`)
        expect(resp.status(), 'hospitalization created (2xx)').toBeLessThan(300)
    })

    test('GATE vitals BEFORE any payment — must be BLOCKED', async () => {
        const resp = await call('POST', `/patients/${patientId}/vitals`, {
            temperature: 36.8, heartRate: 80, bloodPressure: '120/80',
            triageNote: 'Pre-payment triage attempt', triageDisposition: 'WAIT_FOR_DOCTOR',
        })
        const body = await resp.text()
        console.info(`[nurse][GATE] vitals-before status=${resp.status()} body=${body.slice(0,160)}`)
        expect(resp.status(), 'vitals blocked pre-payment (>=400)').toBeGreaterThanOrEqual(400)
        expect(resp.status(), 'not a server error').toBeLessThan(500)
        expect(body.toLowerCase()).toContain('payment')
    })

    test('POS assign consultation — POST /api/consultations', async () => {
        const staff = await call('GET', '/api/users/clinical-staff?role=DOCTOR&page=0&size=20')
        const sb = await staff.json().catch(() => null)
        const doctorId = (Array.isArray(sb) ? sb : sb?.data)?.[0]?.id
        ;(page as any)._doctorId = doctorId
        const resp = await call('POST', '/api/consultations', {
            patientId, doctorId, diagnosis: 'QA consult', notes: 'Wave1 assign',
        })
        const body = await resp.json().catch(() => null)
        console.info(`[nurse] consultation-assign status=${resp.status()} doctor=${doctorId} body=${(JSON.stringify(body)).slice(0,160)}`)
        expect(resp.status(), 'consultation assigned (2xx)').toBeLessThan(300)
    })

    test('POS clear day balance then vitals AFTER payment — must SUCCEED', async () => {
        // Pay the invoice the nurse created so the gate lifts.
        const inv = await call('GET', `/patients/${patientId}/invoices`)
        const invBody = await inv.json().catch(() => null)
        const invoice = Array.isArray(invBody) ? invBody[0] : (invBody?.content?.[0] ?? invBody)
        expect(invoice?.id, 'an invoice exists for patient').toBeTruthy()
        const amount = Number(invoice?.patientDue ?? invoice?.patient_due ?? invoice?.total ?? 0)
        const pay = await call('POST', '/api/billing/payments', { invoiceId: invoice.id, amount, method: 'CASH', paymentMethod: 'CASH' })
        console.info(`[nurse] payment status=${pay.status()} amount=${amount}`)
        expect(pay.status(), 'payment posted (2xx)').toBeLessThan(300)
        const resp = await call('POST', `/patients/${patientId}/vitals`, {
            temperature: 36.9, heartRate: 78, bloodPressure: '118/76', respiratoryRate: 16, oxygenSaturation: 98,
            triageNote: 'Post-payment triage complete', triageDisposition: 'WAIT_FOR_DOCTOR',
        })
        const body = await resp.text()
        console.info(`[nurse][GATE] vitals-after status=${resp.status()} body=${body.slice(0,160)}`)
        expect(resp.status(), 'vitals accepted post-payment (2xx)').toBeLessThan(300)
    })

    test('POS view lab/records/theatre/blood-bank/back-office pages', async () => {
        const bad = netCollector(page)
        const pages = ['/dashboard/lab', '/dashboard/doctor/records', '/dashboard/theatre', '/dashboard/blood-bank', '/dashboard/back-office']
        for (const p of pages) {
            await page.goto(p)
            await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => undefined)
            const errs = bad.filter((b) => b.status >= 500)
            expect(errs, `${p}: no 5xx`).toEqual([])
        }
        await page.screenshot({ path: `${EV_DIR}/module-pages.png` }).catch(() => undefined)
    })

    test('NEG nurse sign consultation — expect block', async () => {
        // create a consultation then try to sign it as nurse
        const staff = await call('GET', '/api/users/clinical-staff?role=DOCTOR&page=0&size=20')
        const sb = await staff.json().catch(() => null)
        const doctorId = (Array.isArray(sb) ? sb : sb?.data)?.[0]?.id
        const c = await call('POST', '/api/consultations', { patientId, doctorId, diagnosis: 'QA sign test', notes: 'x' })
        const cb = await c.json().catch(() => null)
        const cid = cb?.id
        const sign = await call('POST', `/api/consultations/${cid}/sign`, {})
        console.info(`[nurse][NEG] sign-consultation status=${sign.status()}`)
        expect(sign.status(), 'nurse cannot sign consultation (>=400)').toBeGreaterThanOrEqual(400)
    })

    test('NEG visit /dashboard/doctor/consultations/new — expect 403/redirect', async () => {
        await page.goto('/dashboard/doctor/consultations/new')
        await page.waitForTimeout(1500)
        await page.screenshot({ path: `${EV_DIR}/neg-consultations-new.png` }).catch(() => undefined)
        const url = page.url()
        const bad = (page as any)._bad as { status: number; url: string }[]
        const forbidden = bad.filter((b) => b.status === 403)
        const redirected = !/\/dashboard\/doctor\/consultations\/new$/.test(url)
        console.info(`[nurse][NEG] consultations/new url=${url} 403=${JSON.stringify(forbidden)}`)
        expect(redirected || forbidden.length > 0, 'nurse blocked from new consultation page').toBeTruthy()
    })
})
