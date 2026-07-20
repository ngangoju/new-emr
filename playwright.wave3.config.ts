import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

export default defineConfig({
    testDir: './e2e',
    testMatch: 'wave3-security.spec.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 4,
    timeout: 30000,
    reporter: [['list'], ['json', { outputFile: 'test-results/wave3-results.json' }]],
    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
})
