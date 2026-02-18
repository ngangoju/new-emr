'use client'

import { useState } from 'react'
import axios from 'axios'

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
})

// Add auth token to requests
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
    }
    return config
})

export interface Role {
    id: string
    name: string
    permissionsJson?: string
    createdAt?: string
    updatedAt?: string
}

export interface CreateRoleRequest {
    name: string
    permissionsJson?: string
}

export interface UpdateRoleRequest {
    name?: string
    permissionsJson?: string
}

export function useRoles() {
    const [roles, setRoles] = useState<Role[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchRoles = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await api.get<Role[]>('/roles')
            setRoles(response.data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch roles')
        } finally {
            setIsLoading(false)
        }
    }

    const createRole = async (request: CreateRoleRequest): Promise<Role | null> => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await api.post<Role>('/roles', request)
            setRoles(prev => [...prev, response.data])
            return response.data
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create role')
            return null
        } finally {
            setIsLoading(false)
        }
    }

    const updateRole = async (id: string, request: UpdateRoleRequest): Promise<Role | null> => {
        setIsLoading(true)
        setError(null)
        try {
            const response = await api.put<Role>(`/roles/${id}`, request)
            setRoles(prev => prev.map(r => r.id === id ? response.data : r))
            return response.data
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update role')
            return null
        } finally {
            setIsLoading(false)
        }
    }

    const deleteRole = async (id: string): Promise<boolean> => {
        setIsLoading(true)
        setError(null)
        try {
            await api.delete(`/roles/${id}`)
            setRoles(prev => prev.filter(r => r.id !== id))
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete role')
            return false
        } finally {
            setIsLoading(false)
        }
    }

    return {
        roles,
        isLoading,
        error,
        fetchRoles,
        createRole,
        updateRole,
        deleteRole,
    }
}
