'use client'

import { Activity, AlertTriangle, CheckCircle2, Route } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkflowStatus } from '@/hooks/useWorkflow'

const STAGE_LABELS: Record<string, string> = {
  ARRIVAL: 'Arrival',
  REGISTER: 'Register',
  TRIAGE: 'Triage',
  ENCOUNTER: 'Encounter',
  TREATMENT: 'Treatment',
  DISCHARGE: 'Discharge',
}

export function WorkflowStatusCard({ patientId }: { patientId: string }) {
  const { data, isLoading } = useWorkflowStatus(patientId)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Visit Workflow
        </CardTitle>
        <CardDescription>Current stage, owner, completed checkpoints, and blockers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!patientId ? (
          <p className="text-sm text-muted-foreground">Select a patient to view workflow status.</p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading workflow status...</p>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">No active workflow data found.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                Stage: {STAGE_LABELS[data.currentStage] ?? data.currentStage}
              </Badge>
              <Badge variant="outline">Owner: {data.stageOwnerRole.replaceAll('_', ' ')}</Badge>
              <Badge variant={data.dischargeReady ? 'default' : 'secondary'}>
                {data.dischargeReady ? 'Discharge Ready' : 'In Progress'}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Completed
                </div>
                <div className="space-y-1">
                  {data.completedCheckpoints.length ? data.completedCheckpoints.map((item) => (
                    <p key={item} className="text-sm text-muted-foreground">{item}</p>
                  )) : <p className="text-sm text-muted-foreground">No completed checkpoints yet.</p>}
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Activity className="h-4 w-4 text-amber-600" />
                  Pending
                </div>
                <div className="space-y-1">
                  {data.pendingCheckpoints.length ? data.pendingCheckpoints.map((item) => (
                    <p key={item} className="text-sm text-muted-foreground">{item}</p>
                  )) : <p className="text-sm text-muted-foreground">No pending checkpoints.</p>}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Blockers
              </div>
              <div className="space-y-1">
                {data.blockers.length ? data.blockers.map((item) => (
                  <p key={item} className="text-sm text-red-700">{item}</p>
                )) : <p className="text-sm text-emerald-700">No blockers at the moment.</p>}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
