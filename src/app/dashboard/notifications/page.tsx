'use client'

import React, { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCheck,
  Loader2,
  RefreshCcw,
  Search,
  MailOpen,
  Mail,
  ArrowRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils/date'
import {
  useNotificationsModule,
  useNotificationStream,
} from '@/hooks/useNotifications'
import {
  getNotificationColor,
  type Notification,
  type NotificationFilters,
} from '@/types/notification'

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50]

/**
 * Resolve a notification's entityType + entityId to a dashboard route.
 * Returns null when no mapping exists (the notification won't navigate).
 */
function resolveNotificationRoute(entityType?: string, entityId?: string): string | null {
  if (!entityType) return null

  switch (entityType) {
    case 'QUEUE_ENTRY':
      return '/dashboard/nurse'
    case 'CONSULTATION':
      return entityId
        ? `/dashboard/doctor/consultations/${entityId}`
        : '/dashboard/doctor/consultations'
    case 'LAB_ORDER':
      return '/dashboard/lab'
    case 'IMAGING_ORDER':
      return '/dashboard/radiology'
    case 'DRUG_REQUEST':
      return '/dashboard/pharmacy'
    case 'ADMISSION':
      return '/dashboard/nurse/admissions'
    case 'INVOICE':
      return '/dashboard/billing'
    case 'APPROVAL':
    case 'APPROVAL_REQUEST':
      return '/dashboard/approvals'
    default:
      return null
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filters = useMemo<NotificationFilters>(() => {
    const base: NotificationFilters = {
      page,
      size: pageSize,
    }

    if (filterMode === 'unread') {
      base.unread = true
    }

    return base
  }, [filterMode, page, pageSize])

  const {
    notifications,
    isLoading,
    refetch,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
    unreadCount,
    isLoadingUnreadCount,
  } = useNotificationsModule(filters)

  useNotificationStream()

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return notifications
    }

    return notifications.filter((notification: Notification) => {
      const target = `${notification.title} ${notification.body}`.toLowerCase()
      return target.includes(query)
    })
  }, [notifications, search])

  const totalPages = useMemo(() => {
    if (filteredNotifications.length === 0) {
      return 1
    }

    return Math.max(1, Math.ceil(filteredNotifications.length / pageSize))
  }, [filteredNotifications.length, pageSize])

  const adjustedPage = Math.min(page, totalPages)

  const pagedNotifications = useMemo(() => {
    const startIndex = (adjustedPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredNotifications.slice(startIndex, endIndex)
  }, [filteredNotifications, adjustedPage, pageSize])

  const hasUnread = unreadCount > 0

  const handleNotificationClick = useCallback(async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsRead(notification.id).catch(() => { /* already toasted by the hook */ })
    }

    // Navigate to the related page
    const route = resolveNotificationRoute(notification.entityType, notification.entityId)
    if (route) {
      router.push(route)
    }
  }, [markAsRead, router])

  const handleMarkAll = async () => {
    await markAllAsRead()
  }

  const handleRefresh = () => {
    refetch()
  }

  const handlePageChange = (nextPage: number) => {
    setPage(Math.min(Math.max(1, nextPage), totalPages))
  }

  const handleFilterChange = (value: 'all' | 'unread') => {
    setFilterMode(value)
    setPage(1)
  }

  const handlePageSizeChange = (value: string) => {
    const nextSize = Number(value)
    setPageSize(nextSize)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Keep up with updates across the EMR modules in real time.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleMarkAll}
            disabled={!hasUnread || isMarkingAllAsRead}
          >
            {isMarkingAllAsRead ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-2" />
            )}
            Mark all read
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-4 border-b pb-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-lg">Recent notifications</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  <Bell className="h-3 w-3 mr-1" />
                  {isLoadingUnreadCount ? 'Loading…' : `${unreadCount} unread`}
                </Badge>
                {filterMode === 'unread' && (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-200">
                    Unread only
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search notifications"
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2" role="tablist" aria-label="Notification filters">
                <Button
                  type="button"
                  variant={filterMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('all')}
                  aria-pressed={filterMode === 'all'}
                >
                  All
                </Button>
                <Button
                  type="button"
                  variant={filterMode === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('unread')}
                  aria-pressed={filterMode === 'unread'}
                >
                  Unread
                </Button>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-sm mt-3">Loading notifications…</p>
              </div>
            ) : pagedNotifications.length === 0 ? (
              <EmptyState
                icon={filterMode === 'unread' ? BellOff : Bell}
                title={filterMode === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                description={
                  filterMode === 'unread'
                    ? 'All caught up! Check back later for new updates.'
                    : 'You will see alerts about approvals, lab results, and workflow updates here.'
                }
                action={
                  filterMode === 'unread'
                    ? {
                        label: 'View all notifications',
                        onClick: () => handleFilterChange('all'),
                      }
                    : undefined
                }
              />
            ) : (
              <div className="space-y-3">
                {pagedNotifications.map((notification: Notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full rounded-xl border p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer',
                      !notification.isRead && 'bg-muted/40 border-primary/20'
                    )}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full border bg-background',
                            notification.isRead ? 'border-muted-foreground/30' : 'border-primary/30'
                          )}
                        >
                          <Bell className={cn('h-5 w-5', getNotificationColor(notification.type))} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{notification.title}</p>
                            {!notification.isRead && (
                              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.body}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
                        <Badge
                          variant="outline"
                          className={cn(
                            'border-primary/20 text-primary bg-primary/5',
                            notification.isRead && 'border-muted text-muted-foreground bg-muted/40'
                          )}
                        >
                          {notification.isRead ? (
                            <MailOpen className="h-3 w-3 mr-1" />
                          ) : (
                            <Mail className="h-3 w-3 mr-1" />
                          )}
                          {notification.isRead ? 'Read' : 'Unread'}
                        </Badge>
                        {resolveNotificationRoute(notification.entityType, notification.entityId) ? (
                          <span className="flex items-center text-xs text-primary font-medium">
                            Open
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </span>
                        ) : (
                          <span className="flex items-center text-xs text-muted-foreground">
                            Info
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Quick filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div role="tablist" aria-label="Notification quick filters" className="space-y-2">
                <Button
                  type="button"
                  variant={filterMode === 'all' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => handleFilterChange('all')}
                  aria-pressed={filterMode === 'all'}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  All notifications
                </Button>
                <Button
                  type="button"
                  variant={filterMode === 'unread' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => handleFilterChange('unread')}
                  aria-pressed={filterMode === 'unread'}
                >
                  <BellOff className="mr-2 h-4 w-4" />
                  Unread only
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Pagination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Page</span>
                <span>
                  {adjustedPage} / {totalPages}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
