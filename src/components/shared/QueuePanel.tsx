'use client'

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Inbox } from 'lucide-react'

export type QueuePanelProps = {
  title: string
  description?: string
  count?: number
  icon?: LucideIcon
  loading?: boolean
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  headerClassName?: string
}

export function QueuePanel({
  title,
  description,
  count,
  icon: Icon,
  loading,
  empty,
  emptyTitle = 'Queue is empty',
  emptyDescription = 'No items waiting right now.',
  actions,
  children,
  className,
  headerClassName,
}: QueuePanelProps) {
  return (
    <Card className={cn('shadow-sm border-border/60 bg-card overflow-hidden', className)}>
      <CardHeader
        className={cn(
          'flex flex-row items-start justify-between gap-4 space-y-0 pb-3 border-b border-border/60',
          headerClassName,
        )}
      >
        <div className="flex items-start gap-3 min-w-0">
          {Icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
          ) : null}
          <div className="min-w-0">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              {title}
              {typeof count === 'number' ? (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold tabular-nums text-muted-foreground">
                  {count}
                </span>
              ) : null}
            </CardTitle>
            {description ? (
              <CardDescription className="mt-1">{description}</CardDescription>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : empty ? (
          <EmptyState
            icon={Inbox}
            title={emptyTitle}
            description={emptyDescription}
            className="py-10"
          />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
