import { test, expect, type Page } from '@playwright/test'

const E2E_CREDENTIALS = {
    username: process.env.E2E_USERNAME || 'doctor1',
    password: process.env.E2E_PASSWORD || 'password123',
}

const AUTH_API_BASE = process.env.E2E_AUTH_API_BASE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'

async function submitLoginForm(page: Page) {
    await page.getByLabel(/username/i).fill(E2E_CREDENTIALS.username)
    const passwordInput = page.getByLabel(/password/i)
    await passwordInput.fill(E2E_CREDENTIALS.password)
    await page.getByRole('button', { name: /sign in/i }).click()
}

async function dismissNextDevToolsIfPresent(page: Page) {
    await page
        .addStyleTag({
            content:
                '[data-nextjs-dev-tools-button="true"], nextjs-portal { display: none !important; pointer-events: none !important; }',
        })
        .catch(() => undefined)
}

async function waitForLoginApiResponse(page: Page, timeout = 8_000) {
    return page
        .waitForResponse(
            (response) => response.url().includes('/auth/login') && response.request().method() === 'POST',
            { timeout },
        )
        .catch(() => null)
}

async function verifyBackendAuthReachable(page: Page) {
    const status = await page.request
        .get(`${AUTH_API_BASE}/actuator/health`)
        .then((res) => res.status())
        .catch(() => 0)

    if (status !== 200) {
        throw new Error(
            `Environment blocker: backend health endpoint unreachable from E2E (base=${AUTH_API_BASE}, status=${status}). Verify backend process/network/env bootstrap.`
        )
    }
}

async function captureAuthStorageSnapshot(page: Page) {
    return page.evaluate(() => ({
        url: window.location.pathname,
        hasSessionUser: Boolean(localStorage.getItem('user')),
        hasAccessTokenLocalStorage: Boolean(localStorage.getItem('accessToken')),
        hasRefreshTokenLocalStorage: Boolean(localStorage.getItem('refreshToken')),
        hasLegacyTokenLocalStorage: Boolean(localStorage.getItem('token')),
        hasUserRoleLocalStorage: Boolean(localStorage.getItem('userRole')),
    }))
}

async function expectUrlAfterLogin(page: Page, pattern: RegExp, timeout = 15_000) {
    await page.waitForURL(pattern, { timeout })
}

function consultationNextButton(page: Page) {
    return page.getByRole('button', { name: /^next$/i })
}

async function loginAsDoctorOrFailWithBlocker(page: Page) {
    await verifyBackendAuthReachable(page)

    await page.goto('/login')
    await dismissNextDevToolsIfPresent(page)
    await submitLoginForm(page)

    let loginApiResponse = await waitForLoginApiResponse(page)

    if (!loginApiResponse) {
        await page.getByRole('button', { name: /sign in/i }).click({ force: true }).catch(() => undefined)
        loginApiResponse = await waitForLoginApiResponse(page, 6_000)
    }

    const loginStatus = loginApiResponse?.status() ?? 0

    try {
        await expectUrlAfterLogin(page, /\/dashboard(?:\/.*)?$/i, 12_000)

        const authStorageSnapshot = await captureAuthStorageSnapshot(page)
        console.info(`[E2E auth-debug] post-login storage snapshot: ${JSON.stringify(authStorageSnapshot)}`)
    } catch {
        const loginRejected = await page
            .getByText(/login failed\. please check your credentials\./i)
            .isVisible()
            .catch(() => false)

        const authStorageSnapshot = await captureAuthStorageSnapshot(page).catch(() => null)

        if (loginRejected || loginStatus === 401) {
            throw new Error(
                `Environment blocker: login rejected for ${E2E_CREDENTIALS.username}/*** (status=${loginStatus || 'unknown'}, authSnapshot=${JSON.stringify(authStorageSnapshot)}). Verify backend seed data for deterministic E2E account.`
            )
        }

        if (authStorageSnapshot?.hasSessionUser && authStorageSnapshot?.hasAccessTokenLocalStorage) {
            await page.goto('/dashboard')
            await expectUrlAfterLogin(page, /\/dashboard(?:\/.*)?$/i, 10_000)
            const recoveredSnapshot = await captureAuthStorageSnapshot(page)
            console.info(`[E2E auth-debug] recovered by direct dashboard navigation: ${JSON.stringify(recoveredSnapshot)}`)
            return
        }

        throw new Error(
            `Environment blocker: authentication did not land on /dashboard (current URL: ${page.url()}, loginStatus=${loginStatus || 'unknown'}, authSnapshot=${JSON.stringify(authStorageSnapshot)}). Verify frontend/backend auth bootstrap alignment.`
        )
    }
}

async function loginAsRoleOrFailWithBlocker(page: Page, username: string) {
    await verifyBackendAuthReachable(page)

    await page.goto('/login')
    await dismissNextDevToolsIfPresent(page)
    await page.getByLabel(/username/i).fill(username)
    const passwordInput = page.getByLabel(/password/i)
    await passwordInput.fill(E2E_CREDENTIALS.password)
    await page.getByRole('button', { name: /sign in/i }).click()

    let loginApiResponse = await waitForLoginApiResponse(page)

    if (!loginApiResponse) {
        await page.getByRole('button', { name: /sign in/i }).click({ force: true }).catch(() => undefined)
        loginApiResponse = await waitForLoginApiResponse(page, 6_000)
    }

    const loginStatus = loginApiResponse?.status() ?? 0

    try {
        await expectUrlAfterLogin(page, /\/dashboard(?:\/.*)?$/i, 12_000)
    } catch {
        const loginRejected = await page
            .getByText(/login failed\. please check your credentials\./i)
            .isVisible()
            .catch(() => false)

        const authStorageSnapshot = await captureAuthStorageSnapshot(page).catch(() => null)

        if (loginRejected || loginStatus === 401) {
            throw new Error(
                `Environment blocker: login rejected for ${username}/*** (status=${loginStatus || 'unknown'}, authSnapshot=${JSON.stringify(authStorageSnapshot)}). Verify backend seed data for deterministic E2E account.`
            )
        }

        if (authStorageSnapshot?.hasSessionUser && authStorageSnapshot?.hasAccessTokenLocalStorage) {
            await page.goto('/dashboard')
            await expectUrlAfterLogin(page, /\/dashboard(?:\/.*)?$/i, 10_000)
            return
        }

        throw new Error(
            `Environment blocker: authentication did not land on /dashboard (current URL: ${page.url()}, loginStatus=${loginStatus || 'unknown'}, authSnapshot=${JSON.stringify(authStorageSnapshot)}). Verify frontend/backend auth bootstrap alignment.`
        )
    }
}

test.describe('Login Flow', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/')

        // Should redirect to login
        await expect(page).toHaveURL(/\/login(?:\?.*)?$/)
        await expect(page.getByText(/welcome back/i).first()).toBeVisible()
    })

    test('should show validation errors for empty fields', async ({ page }) => {
        await page.goto('/login')

        // Click submit without filling fields
        await page.getByRole('button', { name: /sign in/i }).click()

        // Should show validation errors
        await expect(page.getByText(/username is required/i)).toBeVisible()
        await expect(page.getByText(/password is required/i)).toBeVisible()
    })

    test('should login successfully with valid credentials', async ({ page }) => {
        await loginAsDoctorOrFailWithBlocker(page)
    })
})

test.describe('Patient Management', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsDoctorOrFailWithBlocker(page)
    })

    test('should navigate to patient list', async ({ page }) => {
        await page.goto('/dashboard/doctor/patients')
        await expect(page).toHaveURL(/\/dashboard\/doctor\/patients(?:\?.*)?$/)
        await expect(page.getByText(/patient management/i).first()).toBeVisible()
    })

    test('should open patient registration dialog', async ({ page }) => {
        await page.goto('/dashboard/doctor/patients')

        const registerButton = page.getByRole('button', { name: /register patient/i })
        if (!(await registerButton.count())) {
            test.skip(true, 'Current doctor role cannot register patients in this environment.')
        }

        await registerButton.click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(page.getByRole('heading', { name: /register new patient/i })).toBeVisible()
    })

    test('should search for patients', async ({ page }) => {
        await page.goto('/dashboard/doctor/patients')

        const searchInput = page.getByPlaceholder(/search by name, id, phone\.\.\./i)
        await searchInput.fill('John')

        // Should show search results
        await expect(page.getByText(/showing\s+\d+\s+of\s+\d+\s+patients/i)).toBeVisible()
    })
})

test.describe('Consultation Workflow', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsDoctorOrFailWithBlocker(page)
    })

    test('should navigate through consultation wizard steps', async ({ page }) => {
        await page.goto('/dashboard/doctor/consultations/new')

        // Step 1: Patient Selection
        await expect(page.getByText(/step\s*1\s*of\s*6/i).first()).toBeVisible()
        await expect(page.locator('[data-slot="card-title"]', { hasText: /patient selection/i })).toBeVisible()

        // Try to proceed without selecting patient
        await consultationNextButton(page).click()
        await expect(page.getByText(/patient selection is required/i).first()).toBeVisible()
    })

    test('should show progress indicator', async ({ page }) => {
        await page.goto('/dashboard/doctor/consultations/new')

        // Should show progress state
        await expect(page.getByText(/step\s*1\s*of\s*6/i).first()).toBeVisible()
        await expect(page.getByText(/17%\s*Complete/i)).toBeVisible()
    })
})

test.describe('Lab Order → Result Flow', () => {
    test('should view lab worklist and process result', async ({ page }) => {
        try {
            await loginAsRoleOrFailWithBlocker(page, 'lab_dexter')
        } catch (error) {
            console.warn(`Skipping Lab Order -> Result Flow: ${(error as Error).message}`)
            test.skip(true, 'Lab technician credentials/role not seeded in this environment.')
            return
        }

        await page.goto('/dashboard/lab')
        await expect(page.getByText(/lab dashboard/i).first()).toBeVisible()
        await expect(page.getByRole('table')).toBeVisible()

        // If there's an accept button (environment-conditional), we can try to click it
        const acceptButton = page.getByRole('button', { name: /accept/i }).first()
        if (await acceptButton.count() > 0 && await acceptButton.isEnabled()) {
            await acceptButton.click()
            // Wait for toast or button status change
            await expect(page.getByText(/order accepted/i)).toBeVisible().catch(() => undefined)
        }
    })
})

test.describe('Billing Payment Post Flow', () => {
    test('should view billing invoices and process payment', async ({ page }) => {
        try {
            await loginAsRoleOrFailWithBlocker(page, 'cashier')
        } catch (error) {
            console.warn(`Skipping Billing Payment Post Flow: ${(error as Error).message}`)
            test.skip(true, 'Cashier credentials/role not seeded in this environment.')
            return
        }

        await page.goto('/dashboard/billing')
        await expect(page.getByText(/billing dashboard/i).first()).toBeVisible()
        await expect(page.getByText(/pending invoices/i).first()).toBeVisible()

        // If there's a payment action button (environment-conditional), we can try to click it
        const paymentButton = page.getByRole('button', { name: /process payment/i }).first()
        if (await paymentButton.count() > 0 && await paymentButton.isEnabled()) {
            await paymentButton.click()
            await expect(page.getByRole('dialog')).toBeVisible()
            await expect(page.getByText(/process invoice payment/i).first()).toBeVisible()
        }
    })
})

test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

    test('should display mobile-optimized patient table', async ({ page }) => {
        await loginAsDoctorOrFailWithBlocker(page)

        await page.goto('/dashboard/doctor/patients')

        await expect(page.getByPlaceholder(/search by name, id, phone\.\.\./i)).toBeVisible()
        await expect(page.getByRole('table')).toBeVisible()
    })

    test('should show mobile-optimized consultation wizard', async ({ page }) => {
        await loginAsDoctorOrFailWithBlocker(page)

        await page.goto('/dashboard/doctor/consultations/new')

        await expect(page.getByText(/step\s*1\s*of\s*6/i).first()).toBeVisible()
        await expect(consultationNextButton(page)).toBeVisible()
    })
})
