import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { UserSettings, NotificationPreferences } from '@/types/admin'
import { toast } from 'react-hot-toast'

export function useSettings() {
    const queryClient = useQueryClient()

    const settingsQuery = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const { data } = await api.get<UserSettings>('/settings')
            return data
        }
    })

    const notificationsQuery = useQuery({
        queryKey: ['settings', 'notifications'],
        queryFn: async () => {
            const { data } = await api.get<NotificationPreferences>('/settings/notifications')
            return data
        }
    })

    const updateSettingsMutation = useMutation({
        mutationFn: async (settings: Partial<UserSettings>) => {
            const { data } = await api.put<UserSettings>('/settings', settings)
            return data
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['settings'], data)
            // Optional: don't show toast for every small setting change (like theme)
        },
        onError: () => {
            toast.error('Failed to save settings')
        }
    })

    const updateNotificationsMutation = useMutation({
        mutationFn: async (prefs: Partial<NotificationPreferences>) => {
            const { data } = await api.put<NotificationPreferences>('/settings/notifications', prefs)
            return data
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['settings', 'notifications'], data)
            toast.success('Notification preferences updated')
        }
    })

    return {
        settings: settingsQuery.data,
        isLoadingSettings: settingsQuery.isLoading,
        notifications: notificationsQuery.data,
        isLoadingNotifications: notificationsQuery.isLoading,
        updateSettings: updateSettingsMutation.mutateAsync,
        isUpdatingSettings: updateSettingsMutation.isPending,
        updateNotifications: updateNotificationsMutation.mutateAsync,
        isUpdatingNotifications: updateNotificationsMutation.isPending
    }
}
