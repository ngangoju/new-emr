'use client'

import { ParsedCommand, summarizeParsedCommand } from '@/lib/clinical/smart-bar-parser'
import { Activity, Pill, FlaskConical, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SmartBarPreviewCardProps {
    result: ParsedCommand
    onSubmit: (parsed: ParsedCommand) => void
    onDismiss: () => void
    isSubmitting?: boolean
}

const typeConfig = {
    vitals: { icon: Activity, label: 'Vitals to Record', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    prescription: { icon: Pill, label: 'Prescription Draft', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    lab: { icon: FlaskConical, label: 'Lab Order', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    note: { icon: StickyNote, label: 'Clinical Note', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
}

export function SmartBarPreviewCard({ result, onSubmit, onDismiss, isSubmitting }: SmartBarPreviewCardProps) {
    const config = typeConfig[result.type]
    const Icon = config.icon
    const summary = summarizeParsedCommand(result)

    return (
        <div className={cn('rounded-lg border-2 p-4 space-y-3', config.border, config.bg)}>
            <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', config.color)} />
                <span className={cn('text-xs font-semibold uppercase tracking-wide', config.color)}>
                    {config.label}
                </span>
            </div>

            <div className="text-sm font-medium text-foreground">
                {summary}
            </div>

            {result.type === 'vitals' && (
                <div className="flex flex-wrap gap-2">
                    {result.bloodPressure && (
                        <Badge label="BP" value={result.bloodPressure} />
                    )}
                    {result.heartRate && (
                        <Badge label="HR" value={`${result.heartRate} bpm`} />
                    )}
                    {result.temperature && (
                        <Badge label="Temp" value={`${result.temperature}°C`} />
                    )}
                    {result.respiratoryRate && (
                        <Badge label="RR" value={`${result.respiratoryRate}/min`} />
                    )}
                    {result.spo2 && (
                        <Badge label="SpO₂" value={`${result.spo2}%`} />
                    )}
                </div>
            )}

            {result.type === 'prescription' && (
                <div className="space-y-1 text-xs text-muted-foreground">
                    {result.drug && <div>Drug: <span className="font-medium text-foreground">{result.drug}</span></div>}
                    {result.dose && <div>Dose: <span className="font-medium text-foreground">{result.dose}</span></div>}
                    {result.frequency && <div>Frequency: <span className="font-medium text-foreground">{result.frequency}</span></div>}
                    {result.duration && <div>Duration: <span className="font-medium text-foreground">{result.duration}</span></div>}
                </div>
            )}

            {result.type === 'lab' && (
                <div className="flex flex-wrap gap-2">
                    {result.tests.map((test: string, i: number) => (
                        <Badge key={i} label="" value={test} />
                    ))}
                </div>
            )}

            <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => onSubmit(result)} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                    Dismiss
                </Button>
            </div>
        </div>
    )
}

function Badge({ label, value }: { label: string; value: string }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs">
            {label && <span className="text-muted-foreground font-medium">{label}:</span>}
            <span className="font-semibold">{value}</span>
        </span>
    )
}
