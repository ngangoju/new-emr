'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

export interface Tenant {
    id: string
    name: string
    subdomain: string
    plan: string
    status: string
    settings: Record<string, unknown>
    createdAt: string
    updatedAt: string
}

export interface CreateTenantRequest {
    name: string
    subdomain: string
    plan?: string
    settings?: Record<string, unknown>
}

export interface UpdateTenantRequest {
    name?: string
    subdomain?: string
    plan?: string
    settings?: Record<string, unknown>
}

export function useTenants() {
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchTenants = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await api.get<Tenant[]>('/api/admin/tenants')
            setTenants(response.data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tenants')
        } finally {
            setIsLoading(false)
        }
    }

    const createTenant = async (payload: CreateTenantRequest): Promise<Tenant> => {
        setError(null)
        try {
            const response = await api.post<Tenant>('/api/admin/tenants', payload)
            await fetchTenants()
            return response.data
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create tenant'
            setError(message)
            throw new Error(message)
        }
    }

    const updateTenant = async (id: string, payload: UpdateTenantRequest): Promise<Tenant> => {
        setError(null)
        try {
            const response = await api.put<Tenant>(`/api/admin/tenants/${id}`, payload)
            await fetchTenants()
            return response.data
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update tenant'
            setError(message)
            throw new Error(message)
        }
    }

    const deleteTenant = async (id: string): Promise<void> => {
        setError(null)
        try {
            await api.delete(`/api/admin/tenants/${id}`)
            await fetchTenants()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete tenant'
            setError(message)
            throw new Error(message)
        }
    }

    return {
        tenants,
        isLoading,
        error,
        fetchTenants,
        createTenant,
        updateTenant,
        deleteTenant,
    }
}
