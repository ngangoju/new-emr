import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface PatientThroughputReport {
    startDate: string
    endDate: string

    // Summary metrics
    totalEncounters: number
    completedEncounters: number
    activeEncounters: number
    cancelledEncounters: number
    pendingConsultations: number

    // Breakdown by status
    encountersByStatus: Array<{ status: string; count: number }>

    // Time-series data
    hourlyDistribution: Array<{ hour: number; count: number }>

    // Recent encounters
    recentEncounters: Array<{
        encounterId: string
        patientName: string
        status: string
        createdAt: string
        completedAt?: string
        durationMinutes?: number
    }>

    // Average metrics
    averageEncounterDurationMinutes?: number
}

export interface RevenueReport {
    startDate: string
    endDate: string
    totalRevenue: number
    totalCollected: number
    totalOutstanding: number
    patientShare: number
    insuranceShare: number
    revenueByInsurance: Array<{ insuranceType: string; amount: number; invoiceCount: number }>
    revenueByCategory: Array<{ category: string; amount: number; invoiceCount: number }>
    paymentStatusBreakdown: Array<{ status: string; count: number; amount: number }>
    agingReport: Array<{ bucket: string; count: number; amount: number }>
    recentInvoices: Array<{
        invoiceId: string
        patientName: string
        total: number
        paymentStatus: string
        createdAt: string
        daysOutstanding: number
    }>
}

export interface PendingItemsReport {
    openEncounterCount: number
    unsignedConsultationCount: number
    unreportedImagingOrderCount: number
    pendingLabOrderCount: number
    unservedPrescriptionCount: number
    pendingEncounters: Array<{
        encounterId: string
        patientName: string
        status: string
        createdAt: string
        hoursOpen: number
        isOverdue: boolean
    }>
    pendingConsultations: Array<{
        consultationId: string
        encounterId: string
        patientName: string
        doctorName: string
        createdAt: string
        hoursUnsigned: number
        isOverdue: boolean
    }>
    pendingImagingOrders: Array<{
        orderId: string
        patientName: string
        imagingType: string
        status: string
        completedAt: string
        hoursAwaitingReport: number
        isOverdue: boolean
    }>
    pendingLabOrders: Array<{
        orderId: string
        patientName: string
        testName: string
        status: string
        orderedAt: string
        hoursPending: number
        isOverdue: boolean
    }>
    pendingPrescriptions: Array<{
        prescriptionId: string
        patientName: string
        medicationName: string
        prescribedAt: string
        hoursPending: number
        isOverdue: boolean
    }>
}


export function usePatientThroughputReport(startDate: string, endDate: string) {
    return useQuery({
        queryKey: ['hmis-reports', 'throughput', startDate, endDate],
        queryFn: async () => {
            const { data } = await api.get<PatientThroughputReport>('/hmis/reports/throughput', {
                params: { startDate, endDate }
            })
            return data
        }
    })
}

export function useRevenueReport(startDate: string, endDate: string) {
    return useQuery({
        queryKey: ['hmis-reports', 'revenue', startDate, endDate],
        queryFn: async () => {
            const { data } = await api.get<RevenueReport>('/hmis/reports/revenue', {
                params: { startDate, endDate }
            })
            return data
        }
    })
}

export function usePendingItemsReport() {
    return useQuery({
        queryKey: ['hmis-reports', 'pending-items'],
        queryFn: async () => {
            const { data } = await api.get<PendingItemsReport>('/hmis/reports/pending-items')
            return data
        },
        refetchInterval: 60000 // Auto-refresh every 60 seconds
    })
}
