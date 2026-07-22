'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Calendar, Send, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/date'

interface Dhis2Submission {
  id: string
  period: string
  orgUnit: string
  status: 'DRY_RUN' | 'SUBMITTED' | 'FAILED'
  sentAt: string | null
  responseCode: number | null
  indicatorCount: number
  dryRun: boolean
  createdAt: string
}

export default function Dhis2AdminPage() {
  const queryClient = useQueryClient()
  const [dryRun, setDryRun] = useState(true)

  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ['dhis2', 'submissions'],
    queryFn: async (): Promise<Dhis2Submission[]> => {
      const { data } = await api.get<{ content: Dhis2Submission[] }>('/api/admin/dhis2/submissions')
      return data.content || []
    },
  })

  const triggerMutation = useMutation({
    mutationFn: async (isDryRun: boolean) => {
      const { data } = await api.post<Dhis2Submission>('/api/admin/dhis2/trigger', { dryRun: isDryRun })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dhis2', 'submissions'] })
    },
  })

  const handleTrigger = () => {
    triggerMutation.mutate(dryRun)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return <CheckCircle className="h-4 w-4 text-success" />
      case 'FAILED': return <XCircle className="h-4 w-4 text-destructive" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-success/10 text-success'
      case 'FAILED': return 'bg-destructive/10 text-destructive'
      default: return 'bg-muted/10 text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DHIS2 Export</h1>
          <p className="text-muted-foreground">
            Monitor and trigger HMIS data exports to DHIS2.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Controls</CardTitle>
          <CardDescription>
            Manually trigger HMIS data export to DHIS2. Dry run mode logs what would be sent without actual submission.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dry-run" className="text-base">Dry Run</Label>
              <p className="text-sm text-muted-foreground">
                Log what would be sent without actual submission
              </p>
            </div>
            <Switch
              id="dry-run"
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
          </div>

          <Button
            onClick={handleTrigger}
            disabled={triggerMutation.isPending}
            className="w-full sm:w-auto"
          >
            {triggerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {dryRun ? 'Running dry run...' : 'Submitting...'}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {dryRun ? 'Run Dry Run' : 'Submit to DHIS2'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submission History</CardTitle>
          <CardDescription>
            Recent DHIS2 export submissions and their status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-destructive text-sm">
              Failed to load submissions
            </div>
          )}

          {submissions && submissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Indicators</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Response</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {sub.period}
                    </TableCell>
                    <TableCell>{sub.indicatorCount}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${getStatusColor(sub.status)}`}>
                        {getStatusIcon(sub.status)}
                        {sub.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {sub.sentAt ? formatDateTime(sub.sentAt) : sub.status === 'DRY_RUN' ? 'Dry run' : '-'}
                    </TableCell>
                    <TableCell>
                      {sub.responseCode ? `HTTP ${sub.responseCode}` : sub.dryRun ? '-' : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No submissions yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}