'use client'

import * as React from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  Info,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** Canonical clinical/ops status → token map. Status is never color-only. */
export type StatusTone = 'success' | 'warning' | 'critical' | 'info' | 'muted' | 'pending' | 'neutral'

export type StatusBadgeProps = {
  /** Display label (required for a11y — never color alone) */
  label: string
  tone?: StatusTone
  icon?: LucideIcon | false
  className?: string
  /** Optional machine status for data attributes / tests */
  status?: string
}

const TONE_STYLES: Record<StatusTone, string> = {
  success: 'border-success/30 bg-success-muted text-success',
  warning: 'border-warning/40 bg-warning-muted text-warning-foreground',
  critical: 'border-critical/30 bg-critical-muted text-critical',
  info: 'border-info/30 bg-info-muted text-info',
  muted: 'border-border bg-muted text-muted-foreground',
  pending: 'border-warning/40 bg-warning-muted text-warning-foreground',
  neutral: 'border-border bg-card text-foreground',
}

const DEFAULT_ICONS: Record<StatusTone, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertCircle,
  info: Info,
  muted: CircleDashed,
  pending: Clock,
  neutral: CircleDashed,
}

/** Map common EMR status strings → tone */
export function statusToTone(status: string | null | undefined): StatusTone {
  const s = (status || '').toUpperCase().replace(/[\s-]+/g, '_')
  if (['COMPLETED', 'DONE', 'PAID', 'ACTIVE', 'APPROVED', 'DISPENSED', 'VERIFIED', 'SUCCESS', 'ISSUED', 'CLOSED'].includes(s)) {
    return 'success'
  }
  if (['PENDING', 'QUEUED', 'WAITING', 'DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'PROCESSING', 'PARTIAL'].includes(s)) {
    return 'pending'
  }
  if (['CANCELLED', 'CANCELED', 'FAILED', 'REJECTED', 'OVERDUE', 'CRITICAL', 'STAT', 'EMERGENCY', 'VOID', 'ERROR'].includes(s)) {
    return 'critical'
  }
  if (['WARNING', 'LOW_STOCK', 'DEFERRED', 'HOLD', 'ON_HOLD', 'NEEDS_REVIEW'].includes(s)) {
    return 'warning'
  }
  if (['INFO', 'NEW', 'OPEN', 'READY'].includes(s)) {
    return 'info'
  }
  if (['INACTIVE', 'ARCHIVED', 'EXPIRED'].includes(s)) {
    return 'muted'
  }
  return 'neutral'
}

export function StatusBadge({
  label,
  tone,
  icon,
  className,
  status,
}: StatusBadgeProps) {
  const resolvedTone = tone ?? statusToTone(status ?? label)
  const Icon = icon === false ? null : (icon ?? DEFAULT_ICONS[resolvedTone])

  return (
    <span
      data-slot="status-badge"
      data-status={status ?? label}
      data-tone={resolvedTone}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap',
        TONE_STYLES[resolvedTone],
        className,
      )}
    >
      {Icon ? <Icon className="size-3 shrink-0" aria-hidden /> : null}
      <span>{label}</span>
    </span>
  )
}

/** Convenience: badge from raw status code with humanized label */
export function StatusBadgeFromCode({
  status,
  label,
  className,
}: {
  status: string
  label?: string
  className?: string
}) {
  const display =
    label ??
    status
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  return <StatusBadge status={status} label={display} className={className} />
}
