import { test as base, expect, type Page, type APIResponse } from '@playwright/test'

export const API = process.env.E2E_AUTH_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'
export const FRONTEND = process.env.E2E_FRONTEND || 'http://localhost:3000'
export const PASSWORD = process.env.E2E_PASSWORD || 'password123'
export const EV = process.env.E2E_EVIDENCE || '/tmp/emr-qa/evidence'

export function netCollector(page: Page) {
    const bad: { status: number; method: string; url: string }[] = []
    page.on('response', (r) => {
        const u = r.url()
        if (r.status() >= 400 && !/\/auth\/refresh|favicon|_next\/|\/health/.test(u)) {
            bad.push({ status: r.status(), method: r.request().method(), url: u.replace(API, '').replace(/https?:\/\/[^/]+/, '') })
        }
    })
    return bad
}

export async function login(page: Page, user: string) {
    await page.goto('/login')
    await page.addStyleTag({ content: 'nextjs-portal{display:none !important;}' }).catch(() => undefined)
    await page.getByLabel(/username/i).fill(user)
    await page.locator('input[type="password"], #password').first().fill(PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/dashboard(?:$|\/)/i, { timeout: 20_000 })
}

// authenticated API helper using the page's browser context (cookies + XSRF).
// Assumes the browser already performed a login (so accessToken + XSRF cookies exist).
export async function apiAs(page: Page, user: string): Promise<{
    call: (m: string, path: string, body?: unknown) => Promise<APIResponse>
    token: string
}> {
    const cookies = await page.context().cookies()
    const xsrf = cookies.find((c) => c.name === 'XSRF-TOKEN')?.value ?? ''
    // Refresh XSRF if missing by hitting a harmless GET that returns the token cookie.
    if (!xsrf) {
        await page.request.get(`${API}/api/tariffs/category/CONSULTATION`).catch(() => undefined)
    }
    return {
        token: xsrf,
        call: (method: string, path: string, body?: unknown) =>
            page.request.fetch(`${API}${path}`, {
                method,
                headers: { 'Content-Type': 'application/json', ...(method !== 'GET' && xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}) },
                data: body as object | undefined,
            }),
    }
}

export async function assertNo403or5xx(page: Page, label: string) {
    const bad = netCollector(page)
    return async () => {
        const serverErrors = bad.filter((b) => b.status >= 500)
        const forbidden = bad.filter((b) => b.status === 403)
        if (serverErrors.length) console.info(`[${label}] 5xx=${JSON.stringify(serverErrors)}`)
        if (forbidden.length) console.info(`[${label}] 403=${JSON.stringify(forbidden)}`)
        expect(serverErrors, `${label}: no 5xx`).toEqual([])
        return forbidden
    }
}
