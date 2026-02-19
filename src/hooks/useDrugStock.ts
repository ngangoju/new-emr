import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CreateDrugStockInput, DrugStockEntry } from '@/types/pharmacy'

export function useDrugStock() {
    return useQuery({
        queryKey: ['pharmacy', 'stock'],
        queryFn: async () => {
            const { data } = await api.get<DrugStockEntry[]>('/api/pharmacy/stock')
            return data ?? []
        },
    })
}

export function useCreateDrugStock() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (payload: CreateDrugStockInput) => {
            const { data } = await api.post<DrugStockEntry>('/api/pharmacy/stock/in', payload)
            return data
        },
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: ['pharmacy', 'stock'] })

            const previousStockEntries = queryClient.getQueryData<DrugStockEntry[]>(['pharmacy', 'stock'])

            const optimisticEntry: DrugStockEntry = {
                id: `temp-${Date.now()}`,
                name: payload.name,
                batchNumber: payload.batchNumber,
                quantity: payload.quantity,
                expiryDate: payload.expiryDate,
                supplier: payload.supplier,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }

            queryClient.setQueryData<DrugStockEntry[]>(
                ['pharmacy', 'stock'],
                (current = []) => [optimisticEntry, ...current],
            )

            return { previousStockEntries }
        },
        onError: (_error, _variables, context) => {
            if (context?.previousStockEntries) {
                queryClient.setQueryData(['pharmacy', 'stock'], context.previousStockEntries)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pharmacy', 'stock'] })
        },
    })
}
