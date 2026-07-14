'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

export type WorklistColumn<T> = {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  className?: string
  headerClassName?: string
}

export type WorklistTableProps<T> = {
  columns: WorklistColumn<T>[]
  data: T[]
  getRowId: (row: T) => string
  loading?: boolean
  skeletonRows?: number
  density?: 'comfortable' | 'compact'
  onRowClick?: (row: T) => void
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: LucideIcon
  emptyAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  /** Accessible name for the table */
  caption?: string
}

export function WorklistTable<T>({
  columns,
  data,
  getRowId,
  loading,
  skeletonRows = 5,
  density = 'comfortable',
  onRowClick,
  emptyTitle = 'No items',
  emptyDescription = 'There is nothing to show in this worklist yet.',
  emptyIcon: EmptyIcon = Inbox,
  emptyAction,
  className,
  caption,
}: WorklistTableProps<T>) {
  const cellPad = density === 'compact' ? 'py-2 px-3' : 'py-3 px-4'

  if (loading) {
    return (
      <div className={cn('rounded-lg border bg-card', className)}>
        <Table>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.id} className={cn(cellPad, col.headerClassName)}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.id} className={cellPad}>
                    <Skeleton className="h-4 w-full max-w-[12rem]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className={cn('rounded-lg border bg-card', className)}>
        <EmptyState
          icon={EmptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      <Table>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((col) => (
              <TableHead
                key={col.id}
                className={cn('text-muted-foreground font-medium', cellPad, col.headerClassName)}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const id = getRowId(row)
            return (
              <TableRow
                key={id}
                data-row-id={id}
                className={cn(onRowClick && 'cursor-pointer')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <TableCell key={col.id} className={cn(cellPad, col.className)}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
