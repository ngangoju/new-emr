'use client'

import { useMemo } from 'react'
import { mockUsers } from '@/lib/mock/admin'
import type { User } from '@/types/admin'

interface UseUsersFilters {
  search?: string
  role?: string
  status?: string
}

interface UseUsersResult {
  users: User[]
  filteredUsers: User[]
  stats: {
    total: number
    active: number
    inactive: number
  }
  loading: boolean
}

export function useUsers(filters: UseUsersFilters = {}): UseUsersResult {
  const allUsers = useMemo(() => [...mockUsers], [])

  const filteredUsers = useMemo(() => {
    let data = [...allUsers]
    if (filters.search) {
      const query = filters.search.toLowerCase()
      data = data.filter(user => 
        user.name.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query)
      )
    }
    if (filters.role) {
      data = data.filter(user => user.role === filters.role)
    }
    if (filters.status) {
      data = data.filter(user => user.status === filters.status)
    }
    return data
  }, [allUsers, filters])

  const stats = useMemo(() => {
    const active = allUsers.filter(user => user.status === 'active').length
    const inactive = allUsers.filter(user => user.status !== 'active').length
    return {
      total: allUsers.length,
      active,
      inactive,
    }
  }, [allUsers])

  return {
    users: allUsers,
    filteredUsers,
    stats,
    loading: false,
  }
}