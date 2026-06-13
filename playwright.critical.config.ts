import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const shouldLaunchLocalDevServer = !process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
    testDir: './e2e',
    testMatch: ['critical-*.spec.ts', 'qa-workflow.spec.ts'],
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
    use: {
        baseURL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: shouldLaunchLocalDevServer
        ? {
              command: 'npm run dev',
              url: baseURL,
              reuseExistingServer: !process.env.CI,
          }
        : undefined,
})
