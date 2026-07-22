'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWards } from '@/hooks/useWardManagement'
import { useSbarHandoff, SbarHandoff } from '@/hooks/api/useSbarHandoff'
import { Printer, Loader2, Stethoscope, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

const mewsBadgeColor = (color: string) => {
    switch (color.toUpperCase()) {
        case 'RED': return 'bg-red-100 text-red-700 border-red-300'
        case 'AMBER':
        case 'YELLOW': return 'bg-amber-100 text-amber-700 border-amber-300'
        default: return 'bg-green-100 text-green-700 border-green-300'
    }
}

export default function SbarHandoffPage() {
    const wardsQuery = useWards()
    const wards = wardsQuery.data ?? []
    const { fetchHandoff } = useSbarHandoff()
    const [selectedWard, setSelectedWard] = useState<string>('')
    const [handoff, setHandoff] = useState<SbarHandoff | null>(null)
    const [loading, setLoading] = useState(false)

    const firstWardId = wards.length > 0 ? wards[0].id : ''

    useEffect(() => {
        if (firstWardId && !selectedWard) {
            setSelectedWard(firstWardId)
        }
    }, [firstWardId, selectedWard])

    const loadHandoff = useCallback(async () => {
        if (!selectedWard) return
        setLoading(true)
        try {
            const data = await fetchHandoff(selectedWard)
            setHandoff(data)
            toast.success('Handoff generated')
        } catch {
            toast.error('Failed to generate handoff')
        } finally {
            setLoading(false)
        }
    }, [selectedWard, fetchHandoff])

    useEffect(() => {
        if (selectedWard) {
            loadHandoff()
        }
    }, [selectedWard, loadHandoff])

    return (
        <div className="space-y-6 animate-fade-in p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Stethoscope className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold">SBAR Shift Handoff</h1>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="rounded-md border bg-background px-3 py-2 text-sm"
                        value={selectedWard}
                        onChange={(e) => setSelectedWard(e.target.value)}
                    >
                        {(wards ?? []).map((w: { id: string; name: string }) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                    <Button variant="outline" onClick={() => window.print()} disabled={!handoff}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                    <Button onClick={loadHandoff} disabled={loading || !selectedWard}>
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Generate
                    </Button>
                </div>
            </div>

            {/* Summary */}
            {handoff && (
                <Card className="print:no-break">
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {handoff.wardName} — {handoff.patientCount} patients
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Generated at {new Date(handoff.generatedAt).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Patient cards */}
            {loading && !handoff && (
                <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating handoff...
                </div>
            )}

            {!loading && !handoff && (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                    <AlertCircle className="h-8 w-8" />
                    <p className="text-sm">Select a ward and click Generate to create the handoff.</p>
                </div>
            )}

            {handoff && handoff.items.length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                        No active admissions in this ward.
                    </CardContent>
                </Card>
            )}

            {handoff && handoff.items.length > 0 && (
                <div className="space-y-4">
                    {handoff.items.map((item) => (
                        <Card key={item.admissionId} className="print:break-inside-avoid">
                            <CardHeader className="bg-muted/30 print:bg-transparent">
                                <CardTitle className="flex items-center justify-between text-base">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">{item.patientName}</span>
                                        <span className="text-xs text-muted-foreground">Bed {item.bedLabel}</span>
                                    </div>
                                    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${mewsBadgeColor(item.mewsColor)}`}>
                                        MEWS {item.mewsScore}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm print:text-xs">
                                <div>
                                    <span className="font-semibold text-muted-foreground uppercase text-xs tracking-wide">S — Situation</span>
                                    <p className="mt-1">{item.situation}</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-muted-foreground uppercase text-xs tracking-wide">B — Background</span>
                                    <p className="mt-1">{item.background}</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-muted-foreground uppercase text-xs tracking-wide">A — Assessment</span>
                                    <p className="mt-1">{item.assessment}</p>
                                </div>
                                <div>
                                    <span className="font-semibold text-muted-foreground uppercase text-xs tracking-wide">R — Recommendation</span>
                                    <p className="mt-1">{item.recommendation}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
