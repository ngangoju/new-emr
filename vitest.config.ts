import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        exclude: ['**/node_modules/**', '**/e2e/**', '**/dist/**'],
        coverage: {
            provider: 'v8',
            all: false,
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData',
                'dist/',
                'e2e/',
                '.next/',
                '**/.next/**',
                'coverage/',
            ],
            thresholds: {
                // Gate on a floor the current suite meets (measured with
                // all:false, i.e. coverage of code actually exercised by tests).
                // Raise over time as more components get unit tests.
                // Set conservatively below local+CI measured values
                // (local: lines 64% / funcs 49% / branches 64%) to avoid
                // flaky CI failures from minor runner-to-runner variance.
                lines: 55,
                functions: 40,
                branches: 45,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
