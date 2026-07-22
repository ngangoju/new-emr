'use client'

import { useState } from 'react'
import { usePatientSnapshot } from '@/hooks/api/usePatientSnapshot'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Brain, AlertCircle, Copy } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/date'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface PatientAiSnapshotCardProps {
    patientId: string
    patientName: string
}

export function PatientAiSnapshotCard({ patientId, patientName }: PatientAiSnapshotCardProps) {
    const [showExpanded, setShowExpanded] = useState(false)
    const { data: snapshot, isLoading, isError, refetch } = usePatientSnapshot(patientId)

    if (!patientId) return null

    return (
        <TooltipProvider>
            <Card className="border-secondary/20 bg-secondary/5 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Brain className="h-4 w-4 text-secondary" />
                                AI Clinical Summary
                            </CardTitle>
                            <CardDescription>
                                Draft summary for {patientName}
                            </CardDescription>
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => refetch()}
                                    disabled={isLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Refresh summary</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    )}

                    {isError && (
                        <div className="flex items-start gap-3 p-3 rounded-md bg-destructive/10 text-destructive">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p className="text-sm">Unable to load AI summary. Try refreshing.</p>
                        </div>
                    )}

                    {snapshot && (
                        <>
                            <div
                                className={`text-sm text-foreground transition-all duration-200 ${
                                    showExpanded ? 'whitespace-pre-wrap' : 'line-clamp-3'
                                }`}
                            >
                                {snapshot.summary}
                            </div>

                            {snapshot.summary.length > 200 && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 h-auto text-secondary"
                                    onClick={() => setShowExpanded(!showExpanded)}
                                >
                                    {showExpanded ? 'Show less' : 'Show more'}
                                </Button>
                            )}

                            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                                <Badge
                                    variant="outline"
                                    className="bg-secondary/10 text-secondary-foreground border-secondary/20"
                                >
                                    {snapshot.model}
                                </Badge>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span>Generated: {formatDateTime(snapshot.generatedAt)}</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(snapshot.summary)
                                                }}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Copy summary</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>

                            <div className="mt-2 text-xs text-muted-foreground/70">
                                <Badge variant="outline" className="text-xs bg-amber-50/50 text-amber-700 border-amber-200">
                                    AI Summary — draft, not verified. Clinical review required.
                                </Badge>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </TooltipProvider>
    )
}