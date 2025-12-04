'use client'

import React from 'react'
import { useQueue as useQueueAPI, useCallNextPatient, useUpdateQueueStatus } from '@/hooks/api/useQueue'
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
import { Clock, User, Phone, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

import { useQueryClient } from '@tanstack/react-query'
import { useSocketEvent } from '@/hooks/useSocket'
import { useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

export function QueueBoard() {
  const { data: queue = [], isLoading } = useQueueAPI()
  const callNextMutation = useCallNextPatient()
  const updateStatusMutation = useUpdateQueueStatus()
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)

  // Socket.io Integration
  useSocketEvent('connect', () => {
    setIsConnected(true)
  })

  useSocketEvent('disconnect', () => {
    setIsConnected(false)
  })

  useSocketEvent('queue:update', () => {
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

  const markAsServed = (id: string) => {
    updateStatusMutation.mutate(
      { id, status: 'IN_PROGRESS' },
      {
        onSuccess: () => {
          toast.success('Patient marked as in consultation')
        },
        onError: () => {
          toast.error('Failed to update status')
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

  const getWaitTime = (joinedAt: string | Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - new Date(joinedAt).getTime()) / 1000 / 60)
    return `${diff} min`
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

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Queue #</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Wait Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                <TableCell>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {item.queueNumber}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{item.patientName}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{item.patientId}</span>
                      {item.phoneNumber && (
                        <>
                          <Phone className="h-3 w-3 ml-2" />
                          <span>{item.phoneNumber}</span>
                        </>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {item.consultationType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{getWaitTime(item.joinedAt)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(item.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {item.status === 'WAITING' && (
                      <Button 
                        size="sm" 
                        onClick={() => callNext()}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Bell className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                    )}
                    {(item.status === 'CALLED' || item.status === 'IN_PROGRESS') && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => markAsServed(item.id)}
                      >
                        Start Consultation
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {queue.some(q => q.status === 'WAITING') && (
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
          <Button onClick={callNext} className="bg-primary hover:bg-primary/90">
            <Bell className="h-4 w-4 mr-2" />
            Call Next Patient
          </Button>
        </div>
      )}
    </div>
  )
}