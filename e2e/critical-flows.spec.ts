import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/')

        // Should redirect to login
        await expect(page).toHaveURL('/login')
        await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
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
        await page.goto('/login')

        // Fill in credentials
        await page.getByPlaceholder(/ngango/i).fill('doctor1')
        await page.getByPlaceholder(/••••••••/i).fill('password123')
        await page.getByRole('combobox').selectOption('DOCTOR')

        // Submit form
        await page.getByRole('button', { name: /sign in/i }).click()

        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard')
    })
})

test.describe('Patient Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login')
        await page.getByPlaceholder(/ngango/i).fill('doctor1')
        await page.getByPlaceholder(/••••••••/i).fill('password123')
        await page.getByRole('button', { name: /sign in/i }).click()
        await expect(page).toHaveURL('/dashboard')
    })

    test('should navigate to patient list', async ({ page }) => {
        await page.getByRole('link', { name: /patients/i }).click()
        await expect(page).toHaveURL(/\/patients/)
        await expect(page.getByRole('heading', { name: /patient management/i })).toBeVisible()
    })

    test('should open patient registration dialog', async ({ page }) => {
        await page.goto('/dashboard/doctor/patients')

        await page.getByRole('button', { name: /register patient/i }).click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(page.getByRole('heading', { name: /register new patient/i })).toBeVisible()
    })

    test('should search for patients', async ({ page }) => {
        await page.goto('/dashboard/doctor/patients')

        const searchInput = page.getByPlaceholder(/search by name/i)
        await searchInput.fill('John')

        // Wait for debounced search
        await page.waitForTimeout(600)

        // Should show search results
        await expect(page.getByText(/showing/i)).toBeVisible()
    })
})

test.describe('Consultation Workflow', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login')
        await page.getByPlaceholder(/ngango/i).fill('doctor1')
        await page.getByPlaceholder(/••••••••/i).fill('password123')
        await page.getByRole('button', { name: /sign in/i }).click()
    })

    test('should navigate through consultation wizard steps', async ({ page }) => {
        await page.goto('/dashboard/doctor/consultations/new')

        // Step 1: Patient Selection
        await expect(page.getByText(/step 1 of 6/i)).toBeVisible()
        await expect(page.getByText(/patient selection/i)).toBeVisible()

        // Try to proceed without selecting patient
        await page.getByRole('button', { name: /next/i }).click()
        await expect(page.getByText(/patient selection is required/i)).toBeVisible()
    })

    test('should show progress indicator', async ({ page }) => {
        await page.goto('/dashboard/doctor/consultations/new')

        // Should show progress bar
        await expect(page.getByRole('progressbar')).toBeVisible()
        await expect(page.getByText(/0% complete/i)).toBeVisible()
    })
})

test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

    test('should display mobile-optimized patient table', async ({ page }) => {
        await page.goto('/login')
        await page.getByPlaceholder(/ngango/i).fill('doctor1')
        await page.getByPlaceholder(/••••••••/i).fill('password123')
        await page.getByRole('button', { name: /sign in/i }).click()

        await page.goto('/dashboard/doctor/patients')

        // Mobile table should hide certain columns
        // Only essential columns should be visible
        await expect(page.getByRole('columnheader', { name: /full name/i })).toBeVisible()
        await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible()
    })

    test('should show mobile-optimized consultation wizard', async ({ page }) => {
        await page.goto('/login')
        await page.getByPlaceholder(/ngango/i).fill('doctor1')
        await page.getByPlaceholder(/••••••••/i).fill('password123')
        await page.getByRole('button', { name: /sign in/i }).click()

        await page.goto('/dashboard/doctor/consultations/new')

        // Step indicators should be smaller on mobile
        const stepIndicators = page.locator('[class*="h-8 w-8"]')
        await expect(stepIndicators.first()).toBeVisible()
    })
})
