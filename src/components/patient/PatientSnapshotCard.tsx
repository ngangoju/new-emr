'use client'

import { usePatientSnapshot, type PatientSnapshot } from '@/hooks/api/usePatients'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Calendar, FileText, Pill, AlertTriangle, Wallet } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/date'

interface PatientSnapshotCardProps {
    patientId: string
    patientName: string
}

function SectionLabel({ icon: Icon, title }: { icon: React.ElementType, title: string }) {
    return (
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <Icon className="h-3.5 w-3.5" />
            {title}
        </div>
    )
}

function PillField({ label, value }: { label: string, value?: string }) {
    return (
        <div className="rounded-md border bg-muted/20 p-2">
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-foreground break-all">{value || '—'}</p>
        </div>
    )
}

export function PatientSnapshotCard({ patientId, patientName }: PatientSnapshotCardProps) {
    const { data: snapshot, isLoading, isError } = usePatientSnapshot(patientId)

    if (!patientId) return null

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Patient Snapshot
                </CardTitle>
                <CardDescription>
                    One-page summary for {patientName}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="space-y-3 animate-pulse">
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                )}

                {isError && (
                    <p className="text-sm text-destructive">Unable to load snapshot.</p>
                )}

                {snapshot && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <PillField label="Name" value={snapshot.fullName} />
                            <PillField label="Gender" value={snapshot.gender} />
                            <PillField label="Age" value={snapshot.age} />
                            <PillField label="Phone" value={snapshot.phone} />
                        </div>

                        <div className="border-t my-2" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <SectionLabel icon={Activity} title="Clinical" />
                                <div className="grid grid-cols-2 gap-2">
                                    <PillField label="Latest Vitals" value={snapshot.latestVitals} />
                                    <PillField label="Conditions" value={snapshot.activeConditions} />
                                    <PillField label="Allergies" value={snapshot.activeAllergies} />
                                    <PillField label="Prescriptions" value={snapshot.activePrescriptions} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <SectionLabel icon={Calendar} title="Schedule & Billing" />
                                <div className="grid grid-cols-2 gap-2">
                                    <PillField label="Latest Visit" value={snapshot.latestVisit} />
                                    <PillField label="Next Appointment" value={snapshot.nextAppointment} />
                                    <PillField label="Balance" value={snapshot.outstandingBalance} />
                                </div>
                            </div>
                        </div>

                        <p className="text-[10px] text-muted-foreground">
                            Updated {snapshot.updatedAt ? formatDateTime(snapshot.updatedAt) : '—'}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
