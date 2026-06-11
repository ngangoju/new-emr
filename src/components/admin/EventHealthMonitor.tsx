'use client'

import { useOutboxEntries, useRetryOutbox, OutboxEntry } from '@/hooks/useOutbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, CheckCircle2, Clock, ServerCrash } from 'lucide-react'
import { format } from 'date-fns'
import { useSocketEvent } from '@/hooks/useSocket'
import { useQueryClient } from '@tanstack/react-query'

export function EventHealthMonitor() {
  const { data: entries, isLoading, isError } = useOutboxEntries()
  const { retry, retrying } = useRetryOutbox()
  const queryClient = useQueryClient()

  useSocketEvent('outbox:update', () => {
    queryClient.invalidateQueries({ queryKey: ['outbox'] })
  })

  const getStatusBadge = (status: OutboxEntry['status']) => {
    switch (status) {
      case 'PROCESSED':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Processed</Badge>
      case 'FAILED':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Failed (DLQ)</Badge>
      case 'PENDING':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) return <div className="p-4 text-center">Loading event health logs...</div>

  if (isError) {
    return (
      <Card className="border-t-4 border-t-destructive">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Domain Event Health</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Monitor transactional outbox and event-driven consistency (HIPAA Requirement: S5-AC3)</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <ServerCrash className="w-10 h-10 text-destructive" />
            <p className="text-base font-semibold text-destructive">Backend Unavailable</p>
            <p className="text-sm text-center max-w-sm">
              Cannot reach the server at <code className="text-xs bg-muted px-1 py-0.5 rounded">localhost:8888</code>.
              Start the backend to view domain event health.
            </p>
            <div className="mt-2 rounded-md bg-muted px-4 py-3 text-xs font-mono text-left space-y-1 w-full max-w-sm">
              <p className="text-muted-foreground font-semibold mb-1">To start the backend:</p>
              <p>cd new-emr-backend</p>
              <p>docker compose up -d</p>
              <p>./mvnw spring-boot:run</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-t-4 border-t-primary">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold">Domain Event Health</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Monitor transactional outbox and event-driven consistency (HIPAA Requirement: S5-AC3)</p>
        </div>
        <Badge variant="outline" className="text-xs uppercase tracking-wider">{entries?.length || 0} Total Events</Badge>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Aggregate</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries?.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>{getStatusBadge(entry.status)}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm">{entry.eventType}</div>
                    {entry.lastError && (
                      <div className="text-[10px] text-destructive truncate max-w-[200px]" title={entry.lastError}>
                        {entry.lastError}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {entry.aggregateType}:{entry.aggregateId.split('-')[0]}...
                  </TableCell>
                  <TableCell>
                    <span className={entry.retryCount > 0 ? "text-orange-600 font-bold" : ""}>
                      {entry.retryCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {format(new Date(entry.createdAt), 'HH:mm:ss MMM dd')}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.status === 'FAILED' && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => retry(entry.id)}
                        disabled={retrying}
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${retrying ? 'animate-spin' : ''}`} />
                        Retry
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!entries || entries.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                    No domain events found in the outbox logs.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
