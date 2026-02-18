'use client'

import React from 'react'
import { useQueue, QueueEntry } from '@/hooks/useQueue'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle, Clock, Timer, User, Activity } from 'lucide-react'
import { useSocketEvent } from '@/hooks/useSocket'
import { useQueryClient } from '@tanstack/react-query'

export function TriageQueue() {
  const { data: queue, isLoading } = useQueue()
  const queryClient = useQueryClient()

  useSocketEvent('queue:update', () => {
    queryClient.invalidateQueries({ queryKey: ['queue'] })
  })

  const getPriorityConfig = (priority: number) => {
    switch (priority) {
      case 4:
        return { label: 'EMERGENCY', color: 'bg-red-500 text-white animate-emergency', icon: AlertCircle }
      case 3:
        return { label: 'URGENT', color: 'bg-orange-500 text-white', icon: Activity }
      case 2:
        return { label: 'PRIORITY', color: 'bg-yellow-500 text-black', icon: Timer }
      default:
        return { label: 'ROUTINE', color: 'bg-slate-200 text-slate-700', icon: Clock }
    }
  }

  const formatWaitTime = (minutes: number | null | undefined, checkedInAt: string | null | undefined) => {
    let mins = minutes ?? 0

    // If backend didn't provide it or it's absurdly large, calculate from checkedInAt  
    if (!minutes || minutes > 1440) {
      if (checkedInAt) {
        const checkedIn = new Date(checkedInAt)
        const now = new Date()
        const diffMs = now.getTime() - checkedIn.getTime()
        // Sanity check: within last 24h
        if (diffMs > 0 && diffMs < 86400000) {
          mins = Math.floor(diffMs / 60000)
        } else {
          mins = 0
        }
      } else {
        mins = 0
      }
    }

    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} min`
    const hours = Math.floor(mins / 60)
    const remainMins = mins % 60
    if (remainMins === 0) return `${hours}h`
    return `${hours}h ${remainMins}m`
  }

  const getStatusBadge = (status: QueueEntry['status']) => {
    switch (status) {
      case 'WAITING':
        return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Waiting</Badge>
      case 'CALLED':
        return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 animate-bounce">Called</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="default" className="bg-primary text-primary-foreground">In Consultation</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return <div className="p-12 text-center animate-pulse text-muted-foreground italic">Updating live triage queue...</div>
  }

  return (
    <Card className="border-none shadow-xl overflow-hidden bg-white/50 backdrop-blur-md">
      <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-red-400" />
              Live ER Triage Dashboard
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium tracking-wide">
              Real-time monitoring of patient flow and triage priority (S5-AC1)
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="text-center px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Waiting</p>
              <p className="text-xl font-bold">{queue?.filter(q => q.status === 'WAITING').length || 0}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[80px] text-center">#</TableHead>
              <TableHead>Patient Details</TableHead>
              <TableHead>Priority / Triage</TableHead>
              <TableHead>Assigned Doctor</TableHead>
              <TableHead>Wait Time</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue?.map((entry) => {
              const priority = getPriorityConfig(entry.priority)
              return (
                <TableRow key={entry.id} className={`group hover:bg-slate-50 transition-colors ${entry.priority >= 3 ? 'bg-red-50/30' : ''}`}>
                  <TableCell className="text-center font-mono font-bold text-slate-500">
                    {entry.queueNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${entry.priority >= 3 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                        {entry.patientName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{entry.patientName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-tighter ${priority.color}`}>
                      <priority.icon className="h-3.5 w-3.5" />
                      {priority.label}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      {entry.doctorName || 'Not Assigned'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                      <Clock className={`h-4 w-4 ${entry.waitTimeMinutes > 30 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                      {formatWaitTime(entry.waitTimeMinutes, entry.checkedInAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(entry.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <a href={`/dashboard/doctor/consultations/new?patientId=${entry.patientId}`}>
                      <Badge className="cursor-pointer bg-primary hover:bg-primary/90">
                        Start Triage
                      </Badge>
                    </a>
                  </TableCell>
                </TableRow>
              )
            })}
            {(!queue || queue.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <Activity className="h-12 w-12" />
                    <p className="text-lg font-bold">No patients in the active queue</p>
                    <p className="text-sm">New registrations will appear here in real-time</p>
                  </div>
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
