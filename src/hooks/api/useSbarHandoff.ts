'use client'

import { api } from '@/lib/api'

export interface SbarHandoffItem {
    admissionId: string
    patientId: string
    patientName: string
    bedLabel: string
    situation: string
    background: string
    mewsScore: number
    mewsColor: string
    assessment: string
    recommendation: string
}

export interface SbarHandoff {
    wardId: string
    wardName: string
    patientCount: number
    generatedAt: string
    items: SbarHandoffItem[]
}

export function useSbarHandoff() {
    const fetchHandoff = async (wardId: string): Promise<SbarHandoff> => {
        const { data } = await api.get<SbarHandoff>(`/api/wards/${wardId}/handoff`)
        return data
    }
    return { fetchHandoff }
}
