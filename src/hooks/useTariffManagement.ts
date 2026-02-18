import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api'
import type { Tariff } from '@/types/billing'

export interface CreateTariffInput {
    serviceName: string
    billingCode: string
    category: string
    basePrice: number
    privatePrice?: number
    rssbMmiPrice?: number
    mutuellePrice?: number
    description?: string
}

export interface UpdateTariffInput {
    serviceName?: string
    billingCode?: string
    category?: string
    basePrice?: number
    privatePrice?: number
    rssbMmiPrice?: number
    mutuellePrice?: number
    description?: string
    active?: boolean
}

export function useCreateTariff() {
    const queryClient = useQueryClient()

    const { mutateAsync: createTariff, isPending: isCreating } = useMutation({
        mutationFn: async (input: CreateTariffInput) => {
            const { data } = await apiRequest<Tariff>('POST', '/api/billing/tariffs', input)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tariffs'] })
        },
    })

    return { createTariff, isCreating }
}

export function useUpdateTariff() {
    const queryClient = useQueryClient()

    const { mutateAsync: updateTariff, isPending: isUpdating } = useMutation({
        mutationFn: async ({ id, input }: { id: string; input: UpdateTariffInput }) => {
            const { data } = await apiRequest<Tariff>('PUT', `/api/billing/tariffs/${id}`, input)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tariffs'] })
        },
    })

    return { updateTariff, isUpdating }
}

export function useDeleteTariff() {
    const queryClient = useQueryClient()

    const { mutateAsync: deleteTariff, isPending: isDeleting } = useMutation({
        mutationFn: async (id: string) => {
            // Soft delete - set active to false
            await apiRequest<void>('DELETE', `/api/billing/tariffs/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tariffs'] })
        },
    })

    return { deleteTariff, isDeleting }
}
