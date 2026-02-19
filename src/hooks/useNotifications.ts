import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import type { Notification, NotificationFilters, NotificationsResponse, UnreadCountResponse } from '@/types/notification'

// Query keys
export const notificationKeys = {
    all: ['notifications'] as const,
    lists: () => [...notificationKeys.all, 'list'] as const,
    list: (filters: NotificationFilters) => [...notificationKeys.lists(), filters] as const,
    unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
    detail: (id: string) => [...notificationKeys.all, 'detail', id] as const,
}

/**
 * Fetch notifications with optional filters
 */
export function useNotifications(filters: NotificationFilters = {}) {
    return useQuery({
        queryKey: notificationKeys.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams()

            if (filters.unread !== undefined) {
                params.append('unread', String(filters.unread))
            }
            if (filters.limit) {
                params.append('limit', String(filters.limit))
            }
            if (filters.page) {
                params.append('page', String(filters.page))
            }
            if (filters.size) {
                params.append('size', String(filters.size))
            }
            if (filters.offset) {
                params.append('offset', String(filters.offset))
            }

            const queryString = params.toString()
            const url = queryString ? `/api/notifications?${queryString}` : '/api/notifications'

            const { data } = await api.get<NotificationsResponse>(url)
            return data.notifications || []
        },
        staleTime: 30000, // 30 seconds
    })
}

/**
 * Fetch unread notification count
 */
export function useUnreadCount() {
    return useQuery({
        queryKey: notificationKeys.unreadCount(),
        queryFn: async () => {
            const { data } = await api.get<UnreadCountResponse>('/api/notifications/unread-count')
            return data.count || 0
        },
        staleTime: 10000, // 10 seconds
        refetchInterval: 30000, // Poll every 30 seconds as fallback
    })
}

/**
 * Mark a single notification as read
 */
export function useMarkAsRead() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const { data } = await api.patch<Notification>(`/api/notifications/${notificationId}/read`)
            return data
        },
        onSuccess: () => {
            // Invalidate all notification queries to refetch
            queryClient.invalidateQueries({ queryKey: notificationKeys.all })
            toast.success('Notification marked as read')
        },
        onError: (error) => {
            toast.error('Failed to mark notification as read')
            console.error('Mark as read error:', error)
        },
    })
}

/**
 * Mark all notifications as read
 */
export function useMarkAllAsRead() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async () => {
            await api.patch('/api/notifications/read-all')
            return true
        },
        onSuccess: () => {
            // Invalidate all notification queries to refetch
            queryClient.invalidateQueries({ queryKey: notificationKeys.all })
            toast.success('All notifications marked as read')
        },
        onError: (error) => {
            toast.error('Failed to mark all notifications as read')
            console.error('Mark all as read error:', error)
        },
    })
}

/**
 * Combined hook for notification operations
 */
export function useNotificationsModule(filters: NotificationFilters = {}) {
    const notificationsQuery = useNotifications(filters)
    const unreadCountQuery = useUnreadCount()
    const markAsReadMutation = useMarkAsRead()
    const markAllAsReadMutation = useMarkAllAsRead()

    return {
        // Queries
        notifications: notificationsQuery.data ?? [],
        isLoading: notificationsQuery.isLoading,
        isError: notificationsQuery.isError,
        error: notificationsQuery.error,
        refetch: notificationsQuery.refetch,

        // Unread count
        unreadCount: unreadCountQuery.data ?? 0,
        isLoadingUnreadCount: unreadCountQuery.isLoading,

        // Mutations
        markAsRead: markAsReadMutation.mutateAsync,
        markAllAsRead: markAllAsReadMutation.mutateAsync,

        // States
        isMarkingAsRead: markAsReadMutation.isPending,
        isMarkingAllAsRead: markAllAsReadMutation.isPending,
    }
}

/**
 * Subscribe to real-time notification stream
 */
export function useNotificationStream(options: { enabled?: boolean } = {}) {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (options.enabled === false) {
            return
        }

        if (typeof window === 'undefined') {
            return
        }

        const baseUrl = api.defaults.baseURL ?? window.location.origin
        const streamUrl = new URL('/api/notifications/stream', baseUrl)

        const source = new EventSource(streamUrl.toString(), { withCredentials: true })
        const handleStreamMessage = () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all })
        }

        source.addEventListener('notification', handleStreamMessage)
        source.onmessage = handleStreamMessage

        return () => {
            source.close()
        }
    }, [options.enabled, queryClient])
}
