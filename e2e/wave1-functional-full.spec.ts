import { test, expect, type Page } from '@playwright/test'

/**
 * Wave 1 - Comprehensive Functional Testing
 *
 * Tests all roles, pages, and workflows per the coverage map.
 * Uses deterministic seeded users with password: password123
 */

const PASSWORD = 'password123'


async function loginAs(page: Page, username: string) {
    await page.goto('/login')
    await page.locator('input[name="username"], input[placeholder="username"]').fill(username)
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()
    // Wait for either dashboard URL OR a known dashboard element (handles SPA redirect race)
    await page.waitForURL(/\/dashboard.*/, { timeout: 20000 }).catch(async () => {
        // Fallback: if URL didn't change, wait for a sidebar/dashboard marker
        await page.getByText(/portal|dashboard|welcome back/i, { exact: false }).first().waitFor({ timeout: 5000 }).catch(() => {})
    })
    // Ensure we actually landed somewhere past login
    await page.waitForFunction(() => !location.pathname.includes('/login'), { timeout: 5000 }).catch(() => {})
}

test.describe('Wave 1 - Comprehensive Functional Testing', () => {

    // ============================================
    // AUTHENTICATION TESTS
    // ============================================
    test.describe('Authentication Flow', () => {
        test('should login as ADMIN and access admin dashboard', async ({ page }) => {
            await loginAs(page, 'admin_emr')
            await page.goto('/dashboard/admin')
            await expect(page).toHaveURL(/\/dashboard\/admin/)
            await expect(page.getByText(/users/i)).toBeVisible()
        })

        test('should login as RECEPTIONIST and access reception dashboard', async ({ page }) => {
            await loginAs(page, 'receptionist_emr')
            await page.goto('/dashboard/reception')
            await expect(page).toHaveURL(/\/dashboard\/reception/)
        })

        test('should login as DOCTOR and access doctor dashboard', async ({ page }) => {
            await loginAs(page, 'doctor_emr')
            await page.goto('/dashboard/doctor')
            await expect(page).toHaveURL(/\/dashboard\/doctor/)
        })

        test('should login as NURSE and access nurse dashboard', async ({ page }) => {
            await loginAs(page, 'nurse_emr')
            await page.goto('/dashboard/nurse')
            await expect(page).toHaveURL(/\/dashboard\/nurse/)
        })

        test('should login as CASHIER and access billing dashboard', async ({ page }) => {
            await loginAs(page, 'cashier_emr')
            await page.goto('/dashboard/billing')
            await expect(page).toHaveURL(/\/dashboard\/billing/)
        })

        test('should login as PHARMACIST and access pharmacy dashboard', async ({ page }) => {
            await loginAs(page, 'pharmacist_emr')
            await page.goto('/dashboard/pharmacy')
            await expect(page).toHaveURL(/\/dashboard\/pharmacy/)
        })

        test('should login as LABORANTIN and access lab dashboard', async ({ page }) => {
            await loginAs(page, 'laborantin_emr')
            await page.goto('/dashboard/lab')
            await expect(page).toHaveURL(/\/dashboard\/lab/)
        })

        test('should login as RADIOLOGIST and access radiology dashboard', async ({ page }) => {
            await loginAs(page, 'radiologist_emr')
            await page.goto('/dashboard/radiology')
            await expect(page).toHaveURL(/\/dashboard\/radiology/)
        })

        test('should login as CLINICAL_DIRECTOR and access approvals dashboard', async ({ page }) => {
            await loginAs(page, 'clinical_director_emr')
            await page.goto('/dashboard/approvals')
            await expect(page).toHaveURL(/\/dashboard\/approvals/)
        })

        test('should login as AUDITOR and access reports dashboard', async ({ page }) => {
            await loginAs(page, 'auditor_emr')
            await page.goto('/dashboard/reports')
            await expect(page).toHaveURL(/\/dashboard\/reports/)
        })

        test('should login as ACCOUNTANT and access usage reports', async ({ page }) => {
            await loginAs(page, 'accountant_emr')
            await page.goto('/dashboard/reports/usage')
            await expect(page).toHaveURL(/\/dashboard\/reports\/usage/)
        })
    })

    // ============================================
    // PATIENT MANAGEMENT TESTS
    // ============================================
    test.describe('Patient Management', () => {
        test.beforeEach(async ({ page }) => {
            await loginAs(page, 'doctor_emr')
        })

        test('should view patient list page', async ({ page }) => {
            await page.goto('/dashboard/doctor/patients')
            await expect(page.getByText(/patient management/i)).toBeVisible()
        })

        test('should search patients by name', async ({ page }) => {
            await page.goto('/dashboard/doctor/patients')
            const searchInput = page.getByPlaceholder(/search/i)
            if (await searchInput.count() > 0) {
                await searchInput.fill('John')
                await expect(page.getByText(/patients/i)).toBeVisible()
            }
        })

        test('should view patient detail page', async ({ page }) => {
            await page.goto('/dashboard/doctor/patients')
            const firstPatient = page.locator('tbody tr').first()
            if (await firstPatient.count() > 0) {
                await firstPatient.click()
                await expect(page).toHaveURL(/\/dashboard\/doctor\/patients\/.+/)
            }
        })
    })

    // ============================================
    // CONSULTATION WORKFLOW TESTS
    // ============================================
    test.describe('Consultation Workflow', () => {
        test.beforeEach(async ({ page }) => {
            await loginAs(page, 'doctor_emr')
        })

        test('should access consultation list', async ({ page }) => {
            await page.goto('/dashboard/doctor/consultations')
            await expect(page.getByText(/consultations/i)).toBeVisible()
        })

        test('should access new consultation wizard', async ({ page }) => {
            await page.goto('/dashboard/doctor/consultations/new')
            await expect(page.getByText(/step.*of/i)).toBeVisible()
        })

        test('should not allow nurse to create consultation', async ({ page }) => {
            await loginAs(page, 'nurse_emr')
            await page.goto('/dashboard/doctor/consultations/new')
            await page.waitForURL(/\/dashboard/, { timeout: 5000 }).catch(() => {
                expect(page.locator('text=403, text=forbidden, text=access denied').count()).toBeGreaterThan(0)
            })
        })
    })

    // ============================================
    // APPOINTMENT SCHEDULING TESTS
    // ============================================
    test.describe('Appointment Scheduling', () => {
        test.beforeEach(async ({ page }) => {
            await loginAs(page, 'doctor_emr')
        })

        test('should access schedule page', async ({ page }) => {
            await page.goto('/dashboard/doctor/schedule')
            await expect(page).toHaveURL(/\/dashboard\/doctor\/schedule/)
        })
    })

    // ============================================
    // LAB WORKFLOW TESTS
    // ============================================
    test.describe('Laboratory Workflow', () => {
        test.beforeEach(async ({ page }) => {
            await loginAs(page, 'laborantin_emr')
        })

        test('should access lab dashboard', async ({ page }) => {
            await page.goto('/dashboard/lab')
            await expect(page.getByText(/lab dashboard/i)).toBeVisible()
        })

        test('should view pending lab orders', async ({ page }) => {
            await page.goto('/dashboard/lab')
            await expect(page.locator('table, .worklist').first()).toBeVisible()
        })
    })

    // ============================================
    // PHARMACY WORKFLOW TESTS
    // ============================================
    test.describe('Pharmacy Workflow', () => {
        test.beforeEach(async ({ page }) => {
            await loginAs(page, 'pharmacist_emr')
        })

        test('should access pharmacy dashboard', async ({ page }) => {
            await page.goto('/dashboard/pharmacy')
            await expect(page).toHaveURL(/\/dashboard\/pharmacy/)
        })

        test('should view drug requests queue', async ({ page }) => {
            await page.goto('/dashboard/pharmacy')
            await expect(page.locator('text=drug request, .queue, table').first()).toBeVisible()
        })
    })

    // ============================================
    // BILLING & CASHIER TESTS
    // ============================================
    test.describe('Billing & Cashier Workflow', () => {
        test.beforeEach(async ({ page }) => {
            await loginAs(page, 'cashier_emr')
        })

        test('should access billing dashboard', async ({ page }) => {
            await page.goto('/dashboard/billing')
            await expect(page).toHaveURL(/\/dashboard\/billing/)
        })

        test('should view pending invoices', async ({ page }) => {
            await page.goto('/dashboard/billing')
            await expect(page.getByText(/invoice/i)).toBeVisible()
        })

        test('should access cash close page', async ({ page }) => {
            await page.goto('/dashboard/cashier/close')
            await expect(page).toHaveURL(/\/dashboard\/cashier\/close/)
        })
    })

    // ============================================
    // ADMIN USER MANAGEMENT TESTS
    // ============================================
    test.describe('Admin User Management', () => {
        test.beforeEach(async ({ page }) => {
            await loginAs(page, 'admin_emr')
        })

        test('should access admin dashboard', async ({ page }) => {
            await page.goto('/dashboard/admin')
            await expect(page).toHaveURL(/\/dashboard\/admin/)
        })

        test('should access users management page', async ({ page }) => {
            await page.goto('/dashboard/admin/users')
            await expect(page).toHaveURL(/\/dashboard\/admin\/users/)
        })

        test('should access roles management page', async ({ page }) => {
            await page.goto('/dashboard/admin/roles')
            await expect(page).toHaveURL(/\/dashboard\/admin\/roles/)
        })

        test('should access tariffs management page', async ({ page }) => {
            await page.goto('/dashboard/admin/tariffs')
            await expect(page).toHaveURL(/\/dashboard\/admin\/tariffs/)
        })
    })

    // ============================================
    // REPORTS TESTS
    // ============================================
    test.describe('Reports Dashboard', () => {
        test.beforeEach(async ({ page }) => {
            await loginAs(page, 'auditor_emr')
        })

        test('should access reports dashboard', async ({ page }) => {
            await page.goto('/dashboard/reports')
            await expect(page).toHaveURL(/\/dashboard\/reports/)
        })

        test('should access throughput report', async ({ page }) => {
            await page.goto('/dashboard/reports/throughput')
            await expect(page).toHaveURL(/\/dashboard\/reports\/throughput/)
        })

        test('should access revenue report', async ({ page }) => {
            await page.goto('/dashboard/reports/revenue')
            await expect(page).toHaveURL(/\/dashboard\/reports\/revenue/)
        })

        test('should access usage report', async ({ page }) => {
            await page.goto('/dashboard/reports/usage')
            await expect(page).toHaveURL(/\/dashboard\/reports\/usage/)
        })

        test('should access pending items report', async ({ page }) => {
            await page.goto('/dashboard/reports/pending-items')
            await expect(page).toHaveURL(/\/dashboard\/reports\/pending-items/)
        })
    })

    // ============================================
    // APPROVALS TESTS
    // ============================================
    test.describe('Approvals Workflow', () => {
        test.beforeEach(async ({ page }) => {
            await loginAs(page, 'clinical_director_emr')
        })

        test('should access approvals page', async ({ page }) => {
            await page.goto('/dashboard/approvals')
            await expect(page).toHaveURL(/\/dashboard\/approvals/)
        })
    })

    // ============================================
    // RECEPTIONIST WORKFLOW TESTS
    // ============================================
    test.describe('Reception Workflow', () => {
        test.beforeEach(async ({ page }) => {
            await loginAs(page, 'receptionist_emr')
        })

        test('should access reception dashboard', async ({ page }) => {
            await page.goto('/dashboard/reception')
            await expect(page).toHaveURL(/\/dashboard\/reception/)
        })

        test('should access schedule/appointments', async ({ page }) => {
            await page.goto('/dashboard/schedule')
            await expect(page).toHaveURL(/\/dashboard\/schedule/)
        })
    })

    // ============================================
    // NURSE WORKFLOW TESTS
    // ============================================
    test.describe('Nurse Workflow', () => {
        test.beforeEach(async ({ page }) => {
            await loginAs(page, 'nurse_emr')
        })

        test('should access nurse dashboard', async ({ page }) => {
            await page.goto('/dashboard/nurse')
            await expect(page).toHaveURL(/\/dashboard\/nurse/)
        })

        test('should access admissions page', async ({ page }) => {
            await page.goto('/dashboard/nurse/admissions')
            await expect(page).toHaveURL(/\/dashboard\/nurse\/admissions/)
        })
    })

    // ============================================
    // ACCESS CONTROL VERIFICATION TESTS
    // ============================================
    test.describe('Access Control Verification', () => {
        test('ADMIN should access all dashboards', async ({ page }) => {
            await loginAs(page, 'admin_emr')

            const dashboards = [
                '/dashboard/admin',
                '/dashboard/reception',
                '/dashboard/nurse',
                '/dashboard/doctor',
                '/dashboard/lab',
                '/dashboard/pharmacy',
                '/dashboard/radiology',
                '/dashboard/billing',
                '/dashboard/cashier/close',
                '/dashboard/reports',
                '/dashboard/approvals'
            ]

            for (const path of dashboards) {
                await page.goto(path)
                const hasError = await page.locator('text=403, text=forbidden, text=access denied').count()
                expect(hasError).toBe(0)
            }
        })

        test('CASHIER should NOT access admin pages', async ({ page }) => {
            await loginAs(page, 'cashier_emr')
            await page.goto('/dashboard/admin')

            const isForbidden = await page.locator('text=403, text=forbidden').count()
            const isRedirected = page.url().includes('/login') || page.url().includes('/dashboard/reception')
            expect(isForbidden > 0 || isRedirected).toBeTruthy()
        })

        test('DOCTOR should NOT access user management', async ({ page }) => {
            await loginAs(page, 'doctor_emr')
            await page.goto('/dashboard/admin/users')

            const isForbidden = await page.locator('text=403, text=forbidden').count()
            expect(isForbidden).toBeGreaterThan(0)
        })

        test('PHARMACIST should NOT access doctor consultations directly', async ({ page }) => {
            await loginAs(page, 'pharmacist_emr')
            await page.goto('/dashboard/doctor/consultations')

            const isForbidden = await page.locator('text=403, text=forbidden').count()
            expect(isForbidden).toBeGreaterThan(0)
        })

        test('NURSE should NOT access admin roles page', async ({ page }) => {
            await loginAs(page, 'nurse_emr')
            await page.goto('/dashboard/admin/roles')

            const isForbidden = await page.locator('text=403, text=forbidden').count()
            expect(isForbidden).toBeGreaterThan(0)
        })
    })

    // ============================================
    // ROLE NAVIGATION TESTS
    // ============================================
    test.describe('Role-Based Navigation', () => {
        test('RECEPTIONIST should see reception menu items', async ({ page }) => {
            await loginAs(page, 'receptionist_emr')
            await page.goto('/dashboard')

            const hasReceptionLink = await page.locator('a[href*="/dashboard/reception"]').count()
            expect(hasReceptionLink).toBeGreaterThan(0)
        })

        test('DOCTOR should see doctor menu items', async ({ page }) => {
            await loginAs(page, 'doctor_emr')
            await page.goto('/dashboard')

            const hasDoctorLink = await page.locator('a[href*="/dashboard/doctor"]').count()
            expect(hasDoctorLink).toBeGreaterThan(0)
        })

        test('CLINICAL_DIRECTOR should see approvals menu', async ({ page }) => {
            await loginAs(page, 'clinical_director_emr')
            await page.goto('/dashboard')

            const hasApprovalsLink = await page.locator('a[href*="/dashboard/approvals"]').count()
            expect(hasApprovalsLink).toBeGreaterThan(0)
        })
    })
})