'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/empty-state'
import { Stethoscope, Eye, ClipboardList, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useConsultations, useDeleteConsultation } from '@/hooks/api/useConsultations'
import { useRole } from '@/hooks/useRole'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/date'
import { Skeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'

export default function ConsultationsPage() {
  const router = useRouter()
  const { data: consultations, isLoading } = useConsultations()
  const deleteConsultation = useDeleteConsultation()
  const { hasPermission, isLoading: roleLoading } = useRole()
  const canCreateConsultation =
    !roleLoading
    && (
      hasPermission('CAN_PRESCRIBE')
      || hasPermission('consultation:create')
      || hasPermission('prescription:create')
    )
  const canEditConsultation = !roleLoading && hasPermission('consultation:addendum')

  const handleDelete = async (consultationId: string) => {
    const confirmed = window.confirm('Delete this draft consultation? This cannot be undone.')
    if (!confirmed) return

    try {
      await deleteConsultation.mutateAsync(consultationId)
      toast.success('Draft consultation deleted.')
      router.refresh()
    } catch {
      toast.error('Failed to delete consultation.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Consultations" 
          description="Manage patient consultations and medical records"
        />
        {canCreateConsultation && (
          <Button asChild>
            <Link href="/dashboard/doctor/consultations/new">
              <ClipboardList className="h-4 w-4 mr-2" />
              New Consultation
            </Link>
          </Button>
        )}
      </div>
      
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !consultations || consultations.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Stethoscope}
              title="No consultations found"
              description={canCreateConsultation ? 'Start a new consultation or view past records.' : 'View consultation records once encounters are created.'}
              action={canCreateConsultation ? {
                label: "New Consultation",
                onClick: () => window.location.href = '/dashboard/doctor/consultations/new'
              } : undefined}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultations.map((consultation) => (
                <TableRow key={consultation.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{formatDate(consultation.createdAt, 'PP')}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(consultation.createdAt, 'p')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {consultation.patientName?.split(' ').map(n => n[0]).join('') || 'P'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{consultation.patientName || 'Unknown Patient'}</span>
                        <span className="text-xs text-muted-foreground font-mono">{consultation.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={consultation.status === 'FINALIZED' ? 'default' : 'secondary'}>
                      {consultation.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">
                    {consultation.type?.toLowerCase() || 'Consultation'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canEditConsultation && consultation.status === 'DRAFT' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleDelete(consultation.id)}
                          disabled={deleteConsultation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/doctor/consultations/${consultation.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
