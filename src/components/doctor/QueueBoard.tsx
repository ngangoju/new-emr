'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useQueue as useQueueAPI, useCallNextPatient, useUpdateQueueStatus } from '@/hooks/useQueue'
import type { QueueEntry } from '@/hooks/useQueue'
import { useRole } from '@/hooks/useRole'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Clock, User, Phone, Bell, Play, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { useSocketEvent } from '@/hooks/useSocket'
import { useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

export function QueueBoard() {
  const router = useRouter()
  const { isLoading: roleLoading, hasPermission } = useRole()
  // Gate the queue fetch on the actual backend permission (queue:read) rather than a
  // hardcoded role list. ADMIN was previously included here but lacks queue:read, so the
  // /api/queue/active call returned 403 (P2-010).
  const canAccessQueue = !roleLoading && hasPermission('queue:read')
  // Call/Start/Complete/No-show hit queue:manage-guarded endpoints; read-only roles
  // (e.g. ADMIN oversight) see the live board without action buttons instead of 403s.
  const canManageQueue = !roleLoading && hasPermission('queue:manage')
  const { data: queue = [] } = useQueueAPI({ enabled: canAccessQueue })
  const callNextMutation = useCallNextPatient()
  const updateStatusMutation = useUpdateQueueStatus()
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)

  // Socket.io Integration
  useSocketEvent('connect', () => {
    if (!canAccessQueue) return
    setIsConnected(true)
  })

  useSocketEvent('disconnect', () => {
    if (!canAccessQueue) return
    setIsConnected(false)
  })

  useSocketEvent('queue:update', () => {
    if (!canAccessQueue) return
    queryClient.invalidateQueries({ queryKey: ['queue'] })
    toast('Queue updated', {
      icon: '🔄',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    })
  })

  const callNext = () => {
    callNextMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Next patient called successfully')
      },
      onError: () => {
        toast.error('Failed to call next patient')
      }
    })
  }

  const startConsultation = (entry: QueueEntry) => {
    updateStatusMutation.mutate(
      { id: entry.id, status: 'IN_PROGRESS' },
      {
        onSuccess: () => {
          toast.success('Consultation started')
          router.push(`/dashboard/doctor/consultations/new?patientId=${entry.patientId}&queueId=${entry.id}`)
        },
        onError: () => {
          toast.error('Failed to start consultation')
        }
      }
    )
  }

  const completeConsultation = (id: string) => {
    updateStatusMutation.mutate(
      { id, status: 'COMPLETED' },
      {
        onSuccess: () => {
          toast.success('Consultation completed')
        },
        onError: () => {
          toast.error('Failed to complete consultation')
        }
      }
    )
  }

  const markNoShow = (id: string) => {
    updateStatusMutation.mutate(
      { id, status: 'NO_SHOW' },
      {
        onSuccess: () => {
          toast.success('Patient marked as no-show')
        },
        onError: () => {
          toast.error('Failed to mark as no-show')
        }
      }
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Waiting</Badge>
      case 'CALLED':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-pulse">Called</Badge>
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">In Progress</Badge>
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Completed</Badge>
      case 'NO_SHOW':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">No Show</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatWaitTime = (minutes: number | null | undefined, checkedInAt: string | null | undefined) => {
    // Use backend-calculated waitTimeMinutes if available and sane
    let mins = minutes ?? 0

    // If backend didn't provide it or it's absurdly large, calculate from checkedInAt  
    if (!minutes || minutes > 1440) {
      // Try to compute from checkedInAt
      if (checkedInAt) {
        const checkedIn = new Date(checkedInAt)
        const now = new Date()
        // Sanity check: checkedIn should be within the last 24 hours
        const diffMs = now.getTime() - checkedIn.getTime()
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

  if (!queue || queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center relative">
        <div className="absolute top-0 right-0 p-2">
          {isConnected ? (
            <Badge variant="outline" className="text-xs text-success border-success/20 bg-success/5 gap-1">
              <Wifi className="h-3 w-3" /> Live
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
              <WifiOff className="h-3 w-3" /> Offline
            </Badge>
          )}
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">No patients in queue</h3>
        <p className="text-sm text-muted-foreground">
          The patient queue is empty. New patients will appear here automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 relative">
      <div className="absolute -top-10 right-0">
        {isConnected ? (
          <Badge variant="outline" className="text-xs text-success border-success/20 bg-success/5 gap-1">
            <Wifi className="h-3 w-3" /> Live Updates
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
            <WifiOff className="h-3 w-3" /> Offline
          </Badge>
        )}
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">#</TableHead>
              <TableHead className="min-w-[120px]">Patient</TableHead>
              <TableHead className="w-20">Type</TableHead>
              <TableHead className="w-28">Triage</TableHead>
              <TableHead className="w-24">Wait</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-44 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.map((item) => (
              <TableRow 
                key={item.id}
                className={`
                  ${item.status === 'CALLED' ? 'bg-primary/5' : ''}
                  ${item.status === 'IN_PROGRESS' ? 'bg-success/5' : ''}
                  hover:bg-accent/50 transition-colors
                `}
              >
                <TableCell className="text-center">
                  <div className="flex h-9 w-9 mx-auto items-center justify-center rounded-full bg-primary/10 font-bold text-sm text-primary">
                    {item.queueNumber}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground text-sm leading-tight">{item.patientName}</p>
                    {item.phoneNumber && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span>{item.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
                    {item.consultationType || 'General'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.priority >= 4 ? (
                    <Badge className="bg-red-500 text-white animate-pulse border-none text-[11px]">EMERGENCY</Badge>
                  ) : item.priority >= 3 ? (
                    <Badge className="bg-orange-500 text-white border-none text-[11px]">URGENT</Badge>
                  ) : item.priority >= 2 ? (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[11px]">PRIORITY</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[11px]">ROUTINE</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap text-xs font-medium">
                      {formatWaitTime(item.waitTimeMinutes, item.checkedInAt)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(item.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    {canManageQueue && item.status === 'WAITING' && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => callNext()}
                          className="h-7 px-2 text-xs bg-primary hover:bg-primary/90"
                          disabled={callNextMutation.isPending}
                        >
                          <Bell className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markNoShow(item.id)}
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          disabled={updateStatusMutation.isPending}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {canManageQueue && item.status === 'CALLED' && (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => startConsultation(item)}
                          className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={updateStatusMutation.isPending}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markNoShow(item.id)}
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          disabled={updateStatusMutation.isPending}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {canManageQueue && item.status === 'IN_PROGRESS' && (
                      <Button 
                        size="sm"
                        onClick={() => completeConsultation(item.id)}
                        className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {canManageQueue && queue.some(q => q.status === 'WAITING') && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50 border border-border">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {queue.filter(q => q.status === 'WAITING').length} patient(s) waiting
              </p>
              <p className="text-sm text-muted-foreground">
                Call the next patient to continue
              </p>
            </div>
          </div>
          <Button onClick={callNext} className="bg-primary hover:bg-primary/90" disabled={callNextMutation.isPending}>
            <Bell className="h-4 w-4 mr-2" />
            Call Next Patient
          </Button>
        </div>
      )}
    </div>
  )
}
