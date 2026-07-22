'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFlightDeck, FlightDeckSnapshot } from '@/hooks/api/useFlightDeck'
import { Users, Bed, AlertTriangle, Building2, DollarSign, Activity, Loader2, Maximize2, Minimize2 } from 'lucide-react'

const REFRESH_INTERVAL = 30_000
const ROTATE_INTERVAL = 8_000

type Section = 'queues' | 'beds' | 'revenue'

const mewsColor = (score: number) => {
    if (score >= 5) return 'text-red-600 bg-red-50 border-red-200'
    if (score >= 3) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-green-600 bg-green-50 border-green-200'
}

const occupancyColor = (pct: number) => {
    if (pct >= 90) return 'text-red-400'
    if (pct >= 70) return 'text-amber-400'
    return 'text-green-400'
}

export default function FlightDeckPage() {
    const { fetchSnapshot } = useFlightDeck()
    const [snapshot, setSnapshot] = useState<FlightDeckSnapshot | null>(null)
    const [loading, setLoading] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [section, setSection] = useState<Section>('queues')

    const load = useCallback(async () => {
        try {
            const data = await fetchSnapshot()
            setSnapshot(data)
        } catch {
            // ignore
        } finally {
            setLoading(false)
        }
    }, [fetchSnapshot])

    useEffect(() => {
        load()
        const refreshTimer = setInterval(load, REFRESH_INTERVAL)
        const rotateTimer = setInterval(() => {
            setSection(prev => prev === 'queues' ? 'beds' : prev === 'beds' ? 'revenue' : 'queues')
        }, ROTATE_INTERVAL)
        return () => {
            clearInterval(refreshTimer)
            clearInterval(rotateTimer)
        }
    }, [load])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsFullscreen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const toggleFullscreen = () => setIsFullscreen(!isFullscreen)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const containerClass = isFullscreen
        ? 'fixed inset-0 z-50 bg-slate-900 text-white p-8 overflow-auto'
        : 'p-6 space-y-6 bg-background'

    return (
        <div className={containerClass}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Activity className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold">Flight Deck</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                </Button>
            </div>

            {/* Always-visible MEWS alert banner */}
            {snapshot && snapshot.highMewsCount > 0 && (
                <div className={`flex items-center gap-2 rounded-md border-2 px-4 py-3 ${mewsColor(5)}`}>
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">
                        {snapshot.highMewsCount} patient{snapshot.highMewsCount > 1 ? 's' : ''} with MEWS ≥ 5 — immediate attention required
                    </span>
                </div>
            )}

            <div className={`grid gap-4 ${isFullscreen ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
                {/* Queues section */}
                <Card className={section === 'queues' ? 'ring-2 ring-primary' : ''}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5 text-blue-500" />
                            Queue / Waiting
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-5xl font-bold ${isFullscreen ? 'text-white' : ''}`}>
                            {snapshot?.activeQueueCount ?? 0}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            patients waiting
                        </p>
                    </CardContent>
                </Card>

                {/* Beds section */}
                <Card className={section === 'beds' ? 'ring-2 ring-primary' : ''}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Bed className="h-5 w-5 text-green-500" />
                            Bed Occupancy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-5xl font-bold ${isFullscreen ? 'text-white' : occupancyColor(snapshot?.bedOccupancyPercent ?? 0)}`}>
                            {snapshot?.bedOccupancyPercent?.toFixed(1) ?? 0}%
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full transition-all ${occupancyColor(snapshot?.bedOccupancyPercent ?? 0).replace('text-', 'bg-')}`}
                                style={{ width: `${snapshot?.bedOccupancyPercent ?? 0}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue section */}
                <Card className={section === 'revenue' ? 'ring-2 ring-primary' : ''}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <DollarSign className="h-5 w-5 text-amber-500" />
                            Today's Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-5xl font-bold ${isFullscreen ? 'text-white' : ''}`}>
                            RWF {(snapshot?.todayRevenue ?? 0).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            {snapshot?.theatreCasesCount ?? 0} theatre cases today
                        </div>
                    </CardContent>
                </Card>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
                Auto-refreshes every 30s · Last update: {snapshot ? new Date(snapshot.timestamp).toLocaleTimeString() : '--'}
            </p>
        </div>
    )
}
