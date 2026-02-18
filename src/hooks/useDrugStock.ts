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
            const { data } = await api.post<DrugStockEntry>('/api/pharmacy/stock', payload)
            return data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pharmacy', 'stock'] })
        },
    })
}

