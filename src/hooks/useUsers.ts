import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
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
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users')
      return data
    }
  })

  const filteredUsers = useMemo(() => {
    let data = [...users]
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
  }, [users, filters])

  const stats = useMemo(() => {
    const active = users.filter(user => user.status === 'active').length
    const inactive = users.filter(user => user.status !== 'active').length
    return {
      total: users.length,
      active,
      inactive,
    }
  }, [users])

  return {
    users,
    filteredUsers,
    stats,
    loading: isLoading,
  }
}