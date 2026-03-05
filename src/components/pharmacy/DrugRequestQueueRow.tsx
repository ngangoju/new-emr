import { AlertTriangle, CheckCircle, Clock, Eye, User, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import type { DrugRequest, DrugRequestStatus } from '@/types/pharmacy'
import { formatDrugRequestItemContext } from '@/lib/pharmacy/drugRequestMapping'

interface DrugRequestQueueRowProps {
  request: DrugRequest
  formatDate: (dateString: string | undefined) => string
  getStatusBadge: (status: DrugRequestStatus) => ReactNode
  onView: (request: DrugRequest) => void
  onFulfill: (request: DrugRequest) => void
  onDeny: (request: DrugRequest) => void
}

export function DrugRequestQueueRow({
  request,
  formatDate,
  getStatusBadge,
  onView,
  onFulfill,
  onDeny,
}: DrugRequestQueueRowProps) {
  const hasAllergyOverride = request.items.some((item) => Boolean(item.allergyOverrideReason))

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          {request.patientName || 'Patient ' + (request.patientId?.substring(0, 8) || 'Unknown')}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          {request.items.slice(0, 2).map((item, idx) => (
            <div key={idx} className="text-sm flex flex-col">
              <span>{formatDrugRequestItemContext(item)}</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.allergyOverrideReason && (
                  <div className="rounded border border-destructive/20 bg-destructive/10 px-1 py-0.5 text-[10px] uppercase text-destructive font-medium w-fit">
                    Allergy Overridden
                  </div>
                )}
                {item.interactionOverrideReason && (
                  <div className="rounded border border-amber-300 bg-amber-50 px-1 py-0.5 text-[10px] uppercase text-amber-700 font-medium w-fit">
                    Interaction Overridden
                  </div>
                )}
              </div>
            </div>
          ))}
          {request.items.length > 2 && (
            <span className="text-xs text-muted-foreground">+{request.items.length - 2} more</span>
          )}
        </div>
      </TableCell>
      <TableCell>{request.requestedByName || request.requestedBy || 'Unknown'}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDate(request.requestedAtFormatted || request.requestedAt)}
        </div>
      </TableCell>
      <TableCell>{getStatusBadge(request.status)}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(request)}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {request.status === 'pending' && (
            <>
              <Button
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onFulfill(request)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Fulfill
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => onDeny(request)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Deny
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
