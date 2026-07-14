'use client'

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export type StatCardProps = {
  title: string
  value: React.ReactNode
  description?: string
  icon?: LucideIcon
  /** Accent on icon well */
  tone?: 'brand' | 'success' | 'warning' | 'critical' | 'info' | 'muted'
  loading?: boolean
  className?: string
  onClick?: () => void
  trend?: React.ReactNode
}

const ICON_WELL: Record<NonNullable<StatCardProps['tone']>, string> = {
  brand: 'bg-primary/10 text-primary',
  success: 'bg-success-muted text-success',
  warning: 'bg-warning-muted text-warning',
  critical: 'bg-critical-muted text-critical',
  info: 'bg-info-muted text-info',
  muted: 'bg-muted text-muted-foreground',
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = 'brand',
  loading,
  className,
  onClick,
  trend,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'shadow-sm border-border/60 bg-card',
        onClick && 'cursor-pointer transition-colors hover:bg-muted/40',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <CardContent className="p-5 flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight font-heading text-foreground tabular-nums">
              {value}
            </p>
          )}
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
          {trend ? <div className="pt-1 text-xs">{trend}</div> : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              ICON_WELL[tone],
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
