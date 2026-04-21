'use client'

import { useMemo } from 'react'
import { AlertCircle, CheckCircle, Pill, AlertTriangle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDrugRequests } from '@/hooks/useDrugRequests'
import { formatDateTime } from '@/lib/utils/date'
import type { DrugRequestStatus } from '@/types/pharmacy'
import { normalizeDrugRequestItems, formatDrugRequestItemContext } from '@/lib/pharmacy/drugRequestMapping'

interface DoctorPharmacyQueueProps {
  patientId: string
}

export function DoctorPharmacyQueue({ patientId }: DoctorPharmacyQueueProps) {
  const { data: rawRequests = [], isLoading } = useDrugRequests({ patientId })

  const requests = useMemo(() => {
    return rawRequests.map(req => ({
      ...req,
      items: normalizeDrugRequestItems(req.items),
    }))
  }, [rawRequests])

  const getStatusBadge = (status: DrugRequestStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle className="mr-1 h-3 w-3" /> Verified</Badge>
      case 'fulfilled':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><Pill className="mr-1 h-3 w-3" /> Dispensed</Badge>
      case 'denied':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertTriangle className="mr-1 h-3 w-3" /> Blocked</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Loading pharmacy tracking...</div>
  }

  if (!requests.length) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No active pharmacy orders found for this patient.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map(request => (
        <div key={request.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Order placed {formatDateTime(request.requestedAt)}</p>
              <p className="text-xs text-muted-foreground">Ordered by: {request.requestedByName || request.requestedBy}</p>
            </div>
            <div>
              {getStatusBadge(request.status)}
            </div>
          </div>

          {request.status === 'denied' && request.denialReason ? (
             <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
               <div className="flex items-start gap-2">
                 <AlertCircle className="mt-0.5 h-4 w-4" />
                 <div>
                   <p className="font-semibold">Rejected by Pharmacy</p>
                   <p>{request.denialReason}</p>
                 </div>
               </div>
             </div>
          ) : null}

          {request.notes && request.status !== 'pending' ? (
             <div className="mb-4 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Pharmacist Note:</span> {request.notes}
             </div>
          ) : null}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Prescription Context</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {request.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {formatDrugRequestItemContext(item)}
                      {item.allergyOverrideReason && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-destructive font-medium border border-destructive/20 bg-destructive/5 p-1 rounded">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          Doc Override: {item.allergyOverrideReason}
                        </div>
                      )}
                      {item.interactionOverrideReason && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-amber-700 font-medium border border-amber-700/20 bg-amber-50 p-1 rounded">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          Doc Override: {item.interactionOverrideReason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {[item.dose, item.route, item.frequency, item.duration].filter(Boolean).join(' • ') || 'Legacy unstructured record'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}
