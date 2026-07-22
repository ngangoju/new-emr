'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePatientSnapshot } from '@/hooks/usePatientSnapshot'
import { Sparkles, ChevronDown, ChevronUp, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react'

interface PatientSnapshotCardProps {
  patientId: string
}

export function PatientSnapshotCard({ patientId }: PatientSnapshotCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const { data: snapshot, isLoading, error, refetch, isRefetching } = usePatientSnapshot(patientId)

  return (
    <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/40 shadow-sm overflow-hidden transition-all">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Clinical Snapshot (AI Draft)
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                {snapshot?.model || 'LLM Engine'}
              </span>
            </CardTitle>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-500 hover:text-indigo-600"
            onClick={(e) => {
              e.stopPropagation()
              refetch()
            }}
            disabled={isRefetching}
            title="Refresh AI Snapshot"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin text-indigo-600' : ''}`} />
          </Button>

          <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-3.5 px-4 text-xs text-slate-700 space-y-2.5">
          {isLoading ? (
            <div className="space-y-2 py-2">
              <div className="h-3 bg-indigo-100/60 rounded animate-pulse w-3/4"></div>
              <div className="h-3 bg-indigo-100/60 rounded animate-pulse w-full"></div>
              <div className="h-3 bg-indigo-100/60 rounded animate-pulse w-5/6"></div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-slate-500 py-1">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Snapshot currently unavailable. Use standard medical records below.</span>
            </div>
          ) : (
            <>
              <p className="leading-relaxed font-medium text-slate-800 bg-white/70 backdrop-blur p-3 rounded-xl border border-indigo-100/80 shadow-2xs">
                {snapshot?.summary}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1 text-indigo-950 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-800 inline" />
                  {snapshot?.disclaimer || 'AI-generated draft for clinical review. Verify against primary chart.'}
                </span>

                {snapshot?.generatedAt && (
                  <span className="text-[10px] text-slate-400">
                    Generated {new Date(snapshot.generatedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
