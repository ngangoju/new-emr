import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUploadResult } from '@/hooks/useLabOrders'
import { useCreatePayment } from '@/hooks/usePayments'
import { useExportReport } from '@/hooks/useReports'

vi.mock('@/lib/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
    },
}))

vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}))

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    })

    return function Wrapper({ children }: { children: React.ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }
}

async function getApiMock() {
    const { api } = await import('@/lib/api')
    return api as unknown as {
        get: ReturnType<typeof vi.fn>
        post: ReturnType<typeof vi.fn>
    }
}

beforeAll(() => {
    Object.defineProperty(URL, 'createObjectURL', {
        writable: true,
        value: vi.fn(() => 'blob:mock-url'),
    })

    Object.defineProperty(URL, 'revokeObjectURL', {
        writable: true,
        value: vi.fn(),
    })

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { })
})

beforeEach(() => {
    vi.clearAllMocks()
})

describe('A5 frontend critical action integrations', () => {
    it('billing success: uses POST /api/billing/payments and never uses mock endpoint', async () => {
        const apiMock = await getApiMock()
        apiMock.post.mockResolvedValueOnce({
            data: {
                id: 'PAY-1',
                invoiceId: 'INV-100',
                paymentMethod: 'CASH',
                amount: 3500,
                paidAt: new Date().toISOString(),
            },
        })

        const { result } = renderHook(() => useCreatePayment(), {
            wrapper: createWrapper(),
        })

        await act(async () => {
            await result.current.createPayment({
                invoiceId: 'INV-100',
                amount: 3500,
                paymentMethod: 'CASH',
                paidBy: 'Cashier A',
            })
        })

        expect(apiMock.post).toHaveBeenCalledTimes(1)
        const [url, payload] = apiMock.post.mock.calls[0]
        expect(url).toBe('/api/billing/payments')
        expect(String(url)).not.toContain('mock')
        expect(payload).toMatchObject({
            invoiceId: 'INV-100',
            amount: 3500,
            paymentMethod: 'CASH',
            paidBy: 'Cashier A',
        })
    })

    it('billing failure: propagates API error from POST /api/billing/payments', async () => {
        const apiMock = await getApiMock()
        apiMock.post.mockRejectedValueOnce(new Error('payment failed'))

        const { result } = renderHook(() => useCreatePayment(), {
            wrapper: createWrapper(),
        })

        let thrown: unknown
        await act(async () => {
            try {
                await result.current.createPayment({
                    invoiceId: 'INV-404',
                    amount: 200,
                    paymentMethod: 'CARD',
                    paidBy: 'Cashier B',
                })
            } catch (error) {
                thrown = error
            }
        })

        expect(thrown).toBeInstanceOf(Error)
        expect((thrown as Error).message).toBe('payment failed')
        expect(apiMock.post).toHaveBeenCalledWith(
            '/api/billing/payments',
            expect.objectContaining({ invoiceId: 'INV-404' }),
        )
    })

    it('lab success: uses POST /lab-orders/{id}/results/submit (not legacy /results)', async () => {
        const apiMock = await getApiMock()
        apiMock.post.mockResolvedValueOnce({
            data: {
                orderId: 'LAB-10',
                status: 'approved',
                result: {
                    text: 'Hemoglobin normal',
                    tech: 'Tech A',
                    status: 'normal',
                },
                submittedAt: new Date().toISOString(),
            },
        })

        const { result } = renderHook(() => useUploadResult(), {
            wrapper: createWrapper(),
        })

        await act(async () => {
            await result.current.uploadResult({
                orderId: 'LAB-10',
                markAsFinal: true,
                result: {
                    text: 'Hemoglobin normal',
                    tech: 'Tech A',
                    status: 'normal',
                },
            })
        })

        expect(apiMock.post).toHaveBeenCalledTimes(1)
        const [url, payload] = apiMock.post.mock.calls[0]
        expect(url).toBe('/lab-orders/LAB-10/results/submit')
        expect(url).not.toBe('/lab-orders/LAB-10/results')
        expect(String(url)).not.toContain('mock')
        expect(payload).toMatchObject({
            markAsFinal: true,
            result: {
                text: 'Hemoglobin normal',
                tech: 'Tech A',
                status: 'normal',
            },
        })
    })

    it('lab failure: propagates API error from submit endpoint', async () => {
        const apiMock = await getApiMock()
        apiMock.post.mockRejectedValueOnce(new Error('submit failed'))

        const { result } = renderHook(() => useUploadResult(), {
            wrapper: createWrapper(),
        })

        let thrown: unknown
        await act(async () => {
            try {
                await result.current.uploadResult({
                    orderId: 'LAB-99',
                    markAsFinal: false,
                    result: {
                        text: 'Pending review',
                        tech: 'Tech B',
                        status: 'abnormal',
                    },
                })
            } catch (error) {
                thrown = error
            }
        })

        expect(thrown).toBeInstanceOf(Error)
        expect((thrown as Error).message).toBe('submit failed')
        expect(apiMock.post).toHaveBeenCalledWith(
            '/lab-orders/LAB-99/results/submit',
            expect.any(Object),
        )
    })

    it('reports success: uses GET /reports/{reportType}/export?format=... and never uses mock endpoint', async () => {
        const apiMock = await getApiMock()
        apiMock.get.mockResolvedValueOnce({
            data: {
                reportType: 'financial',
                format: 'csv',
                contentType: 'text/csv',
                fileName: 'financial-report.csv',
                download: 'month,total\nJan,1000',
            },
        })

        const { result } = renderHook(() => useExportReport(), {
            wrapper: createWrapper(),
        })

        await act(async () => {
            await result.current.exportReport({ reportType: 'financial', format: 'csv' })
        })

        expect(apiMock.get).toHaveBeenCalledTimes(1)
        const [url] = apiMock.get.mock.calls[0]
        expect(url).toBe('/reports/financial/export?format=csv')
        expect(String(url)).not.toContain('mock')
        expect(URL.createObjectURL).toHaveBeenCalledTimes(1)
    })

    it('reports failure: propagates API error from export endpoint', async () => {
        const apiMock = await getApiMock()
        apiMock.get.mockRejectedValueOnce(new Error('forbidden'))

        const { result } = renderHook(() => useExportReport(), {
            wrapper: createWrapper(),
        })

        let thrown: unknown
        await act(async () => {
            try {
                await result.current.exportReport({ reportType: 'usage', format: 'json' })
            } catch (error) {
                thrown = error
            }
        })

        expect(thrown).toBeInstanceOf(Error)
        expect((thrown as Error).message).toBe('forbidden')
        expect(apiMock.get).toHaveBeenCalledWith('/reports/usage/export?format=json')
    })
})
