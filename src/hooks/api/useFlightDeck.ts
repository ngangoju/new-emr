'use client'

import { api } from '@/lib/api'

export interface FlightDeckSnapshot {
    activeQueueCount: number
    highMewsCount: number
    bedOccupancyPercent: number
    todayRevenue: number
    theatreCasesCount: number
    timestamp: string
}

export function useFlightDeck() {
    const fetchSnapshot = async (): Promise<FlightDeckSnapshot> => {
        const { data } = await api.get<FlightDeckSnapshot>('/api/dashboard/flight-deck')
        return data
    }
    return { fetchSnapshot }
}
