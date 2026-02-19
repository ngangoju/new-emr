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

export interface UpdateTariffPriceInput {
    basePrice: number
    privatePrice?: number
    rssbMmiPrice?: number
}

export function useCreateTariff() {
    const queryClient = useQueryClient()

    const { mutateAsync: createTariff, isPending: isCreating } = useMutation({
        mutationFn: async (input: CreateTariffInput) => {
            const { data } = await apiRequest<Tariff>('POST', '/api/billing/tariffs', input)
            return data
        },
        onMutate: async (input) => {
            await queryClient.cancelQueries({ queryKey: ['tariffs'] })
            const previousTariffs = queryClient.getQueryData<Tariff[]>(['tariffs'])

            const optimisticTariff: Tariff = {
                id: `temp-${Date.now()}`,
                serviceName: input.serviceName,
                billingCode: input.billingCode,
                category: input.category,
                basePrice: input.basePrice,
                privatePrice: input.privatePrice,
                rssbMmiPrice: input.rssbMmiPrice,
                mutuellePrice: input.mutuellePrice,
                description: input.description,
                active: true,
            }

            queryClient.setQueryData<Tariff[]>(
                ['tariffs'],
                (current = []) => [optimisticTariff, ...current],
            )

            return { previousTariffs }
        },
        onError: (_error, _variables, context) => {
            if (context?.previousTariffs) {
                queryClient.setQueryData(['tariffs'], context.previousTariffs)
            }
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
        onMutate: async ({ id, input }) => {
            await queryClient.cancelQueries({ queryKey: ['tariffs'] })
            const previousTariffs = queryClient.getQueryData<Tariff[]>(['tariffs'])

            if (previousTariffs) {
                queryClient.setQueryData<Tariff[]>(
                    ['tariffs'],
                    previousTariffs.map((tariff) => (tariff.id === id ? { ...tariff, ...input } : tariff)),
                )
            }

            return { previousTariffs }
        },
        onError: (_error, _variables, context) => {
            if (context?.previousTariffs) {
                queryClient.setQueryData(['tariffs'], context.previousTariffs)
            }
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
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['tariffs'] })
            const previousTariffs = queryClient.getQueryData<Tariff[]>(['tariffs'])

            if (previousTariffs) {
                queryClient.setQueryData<Tariff[]>(
                    ['tariffs'],
                    previousTariffs.map((tariff) =>
                        tariff.id === id ? { ...tariff, active: false } : tariff,
                    ),
                )
            }

            return { previousTariffs }
        },
        onError: (_error, _variables, context) => {
            if (context?.previousTariffs) {
                queryClient.setQueryData(['tariffs'], context.previousTariffs)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tariffs'] })
        },
    })

    return { deleteTariff, isDeleting }
}

export function useUpdateTariffPrice() {
    const queryClient = useQueryClient()

    const { mutateAsync: updateTariffPrice, isPending: isUpdatingPrice } = useMutation({
        mutationFn: async ({ id, input }: { id: string; input: UpdateTariffPriceInput }) => {
            const { data } = await apiRequest<Tariff>('PATCH', `/api/billing/tariffs/${id}/price`, input)
            return data
        },
        onMutate: async ({ id, input }) => {
            await queryClient.cancelQueries({ queryKey: ['tariffs'] })
            const previousTariffs = queryClient.getQueryData<Tariff[]>(['tariffs'])

            if (previousTariffs) {
                queryClient.setQueryData<Tariff[]>(
                    ['tariffs'],
                    previousTariffs.map((tariff) => (tariff.id === id ? { ...tariff, ...input } : tariff)),
                )
            }

            return { previousTariffs }
        },
        onError: (_error, _variables, context) => {
            if (context?.previousTariffs) {
                queryClient.setQueryData(['tariffs'], context.previousTariffs)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tariffs'] })
        },
    })

    return { updateTariffPrice, isUpdatingPrice }
}
