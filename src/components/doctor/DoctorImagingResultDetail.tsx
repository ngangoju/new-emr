'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ImageIcon,
  Loader2,
  ScanSearch,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDicomImages, useImagingResult } from '@/hooks/useImaging'
import type { ImagingOrder } from '@/types/imaging'
import { formatDateTime } from '@/lib/utils/date'

type DoctorImagingResultDetailProps = {
  patientId: string
  order: ImagingOrder | null
  onAcknowledge: (orderId: string) => Promise<void> | void
  acknowledging: boolean
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value && value.trim() ? value : 'Not documented'}</p>
    </div>
  )
}

export function DoctorImagingResultDetail({
  patientId,
  order,
  onAcknowledge,
  acknowledging,
}: DoctorImagingResultDetailProps) {
  const { data: result, isLoading } = useImagingResult(order?.id || '')
  const { data: images = [], isLoading: imagesLoading } = useDicomImages(result?.id || '')

  const timeline = useMemo(
    () =>
      [
        order?.orderedAt ? { label: 'Ordered', value: order.orderedAt } : null,
        order?.scheduledAt ? { label: 'Scheduled', value: order.scheduledAt } : null,
        result?.performedAt ? { label: 'Performed', value: result.performedAt } : null,
        order?.completedAt ? { label: 'Completed', value: order.completedAt } : null,
        result?.reportedAt ? { label: 'Reported', value: result.reportedAt } : null,
        order?.physicianAcknowledgedAt
          ? { label: 'Acknowledged', value: order.physicianAcknowledgedAt }
          : null,
      ].filter(Boolean) as Array<{ label: string; value: string }>,
    [order, result],
  )

  if (!order) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Select an imaging report to review its impression, findings, and ordering context.
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border bg-background p-4">
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              <ImageIcon className="mr-1 h-3 w-3" />
              {order.imagingType}
            </Badge>
            {order.bodyPart ? <Badge variant="secondary">{order.bodyPart}</Badge> : null}
            <Badge variant={order.physicianAcknowledgedAt ? 'default' : 'secondary'}>
              {order.physicianAcknowledgedAt ? 'Acknowledged' : 'Awaiting acknowledgment'}
            </Badge>
          </div>
          <div>
            <h4 className="text-base font-semibold">
              {order.imagingType}
              {order.bodyPart ? ` for ${order.bodyPart}` : ''}
            </h4>
            <p className="text-sm text-muted-foreground">
              Ordered for patient chart {patientId.slice(0, 8)} under {order.priority.toLowerCase()} priority.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!order.physicianAcknowledgedAt ? (
            <Button size="sm" onClick={() => onAcknowledge(order.id)} disabled={acknowledging}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              {acknowledging ? 'Acknowledging...' : 'Acknowledge Report'}
            </Button>
          ) : (
            <Badge variant="default" className="h-fit">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Acknowledged {formatDateTime(order.physicianAcknowledgedAt)}
            </Badge>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/doctor/imaging-viewer/${result?.id || order.id}`} className={!result ? 'pointer-events-none opacity-50' : ''}>
              <ImageIcon className="mr-2 h-4 w-4" />
              Launch Viewer
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/doctor/imaging-orders">
              <ScanSearch className="mr-2 h-4 w-4" />
              Imaging Queue
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading imaging report details...
        </div>
      ) : !result ? (
        <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
          The imaging order is reported in the workflow, but no structured report payload is available yet.
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <DetailRow label="Impression" value={result.impression} />
            <DetailRow label="Recommendations" value={result.recommendations} />
          </div>

          <DetailRow label="Findings" value={result.findings} />

          <div className="grid gap-3 md:grid-cols-2">
            <DetailRow label="Clinical indication" value={order.instructions} />
            <DetailRow label="Comparison with previous" value={result.comparisonWithPrevious} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <DetailRow
              label="Reporting radiologist"
              value={
                result.radiologistFirstName || result.radiologistLastName
                  ? `${result.radiologistFirstName ?? ''} ${result.radiologistLastName ?? ''}`.trim()
                  : undefined
              }
            />
            <DetailRow
              label="Report status"
              value={result.radiologistSigned ? 'Signed and verified' : 'Draft report'}
            />
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              <h5 className="text-sm font-semibold">Timeline</h5>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {timeline.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-lg bg-muted/20 p-3 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1">{formatDateTime(item.value)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-primary" />
                <h5 className="text-sm font-semibold">Ordering Context</h5>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Status: {order.status}</p>
                <p>Body part: {order.bodyPart || 'Not specified'}</p>
                <p>Priority: {order.priority}</p>
                <p>Performed by: {order.performedBy || 'Not captured'}</p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h5 className="text-sm font-semibold">Imaging Assets</h5>
              </div>
              {imagesLoading ? (
                <p className="text-sm text-muted-foreground">Loading acquisition assets...</p>
              ) : images.length ? (
                <div className="space-y-2">
                  {images.slice(0, 3).map((image) => (
                    <div key={image.id} className="rounded-lg bg-muted/20 p-3 text-sm flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{image.fileName}</p>
                        <p className="text-muted-foreground">
                          {image.modality || order.imagingType}
                          {image.bodyPart ? ` • ${image.bodyPart}` : ''}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/doctor/imaging-viewer/${result.id}?image=${image.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No uploaded DICOM assets are attached to this report.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
