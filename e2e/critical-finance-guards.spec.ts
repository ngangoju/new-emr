import { test, expect, type APIResponse, type Page } from '@playwright/test'

const API = process.env.E2E_AUTH_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'
const PASSWORD = process.env.E2E_PASSWORD || 'password123'

async function apiAs(page: Page, user: string): Promise<(method: string, path: string, body?: unknown) => Promise<APIResponse>> {
    await page.request.post(`${API}/auth/login`, {
        data: { username: user, password: PASSWORD },
    })

    const cookies = await page.context().cookies()
    const xsrf = cookies.find((cookie) => cookie.name === 'XSRF-TOKEN')?.value ?? ''

    return (method: string, path: string, body?: unknown) =>
        page.request.fetch(`${API}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': xsrf,
            },
            data: body as object | undefined,
        })
}

test('critical finance guard: discount request stays deferred until approval', async ({ page }) => {
    const receptionistApi = await apiAs(page, 'receptionist')

    const stamp = Date.now()
    const patientResp = await receptionistApi('POST', '/patients', {
        firstName: 'QADiscount',
        lastName: `Guard${stamp}`,
        dateOfBirth: '1992-02-02',
        gender: 'FEMALE',
        phone: `+2507${String(stamp).slice(-8)}`,
        email: `qa-discount-${stamp}@emr.test`,
    })
    expect(patientResp.status(), 'patient created').toBeLessThan(300)
    const patient = await patientResp.json()

    const doctorsResp = await receptionistApi('GET', '/api/users/clinical-staff?role=DOCTOR&page=0&size=20')
    expect(doctorsResp.status(), 'doctor list available').toBeLessThan(300)
    const doctors = await doctorsResp.json()
    const doctorId = (Array.isArray(doctors) ? doctors : doctors?.data)?.[0]?.id
    expect(doctorId, 'doctor id available for reception visit').toBeTruthy()

    const tariffResp = await receptionistApi('GET', '/api/tariffs/category/CONSULTATION')
    expect(tariffResp.status(), 'consultation tariff list available').toBeLessThan(300)
    const tariffs = await tariffResp.json()
    const tariff = (Array.isArray(tariffs) ? tariffs : tariffs?.data)?.[0]
    expect(tariff, 'consultation tariff available').toBeTruthy()

    const total = Number(tariff.basePrice)
    const visitResp = await receptionistApi('POST', '/api/reception/visits', {
        invoice: {
            patientId: patient.id,
            doctorId,
            items: JSON.stringify([
                {
                    billing_code: tariff.billingCode,
                    quantity: 1,
                    unit_price: tariff.basePrice,
                    description: tariff.serviceName,
                    tariffId: tariff.id,
                },
            ]),
            total,
        },
        queue: {
            patientId: patient.id,
            doctorId,
            priority: 1,
            notes: 'Critical discount guard flow',
        },
    })
    expect(visitResp.status(), 'reception visit created').toBeLessThan(300)
    const visit = await visitResp.json()
    const invoiceId = visit?.invoice?.id
    expect(invoiceId, 'invoice created from reception visit').toBeTruthy()

    const beforeInvoiceResp = await receptionistApi('GET', `/invoices/${invoiceId}`)
    expect(beforeInvoiceResp.status(), 'invoice readable before request').toBeLessThan(300)
    const beforeInvoice = await beforeInvoiceResp.json()
    const beforePatientDue = Number(beforeInvoice.patientDue ?? beforeInvoice.patient_due ?? 0)
    const beforeDiscountAmount = Number(beforeInvoice.discountAmount ?? beforeInvoice.discount_amount ?? 0)

    const doctorApi = await apiAs(page, 'matt')
    const discountResp = await doctorApi(
        'POST',
        `/api/approvals/discount?invoiceId=${invoiceId}&patientId=${patient.id}`,
        {
            amount: 2500,
            reason: 'Critical regression guard: defer invoice discount until approval',
        },
    )
    expect(discountResp.status(), 'discount request accepted').toBeLessThan(300)
    const discountRequest = await discountResp.json()
    expect(discountRequest?.status).toBe('pending')
    expect(discountRequest?.targetId).toBe(invoiceId)

    const myApprovalsResp = await doctorApi('GET', '/api/approvals/mine?type=discount')
    expect(myApprovalsResp.status(), 'doctor can read their own discount requests').toBeLessThan(300)
    const myApprovals = await myApprovalsResp.json()
    const matchingRequest = (Array.isArray(myApprovals) ? myApprovals : []).find((request) => request.targetId === invoiceId)
    expect(matchingRequest?.status, 'requested invoice appears in requester-scoped approval history').toBe('pending')

    const afterInvoiceResp = await doctorApi('GET', `/invoices/${invoiceId}`)
    expect(afterInvoiceResp.status(), 'invoice readable after request').toBeLessThan(300)
    const afterInvoice = await afterInvoiceResp.json()
    const afterPatientDue = Number(afterInvoice.patientDue ?? afterInvoice.patient_due ?? 0)
    const afterDiscountAmount = Number(afterInvoice.discountAmount ?? afterInvoice.discount_amount ?? 0)

    expect(afterPatientDue, 'patient due remains unchanged while request is pending').toBe(beforePatientDue)
    expect(afterDiscountAmount, 'discount amount is not prematurely applied to invoice').toBe(beforeDiscountAmount)
})
