import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api'
import { getUserRole } from '@/lib/utils/auth'
import type { User, CreateUserInput, UpdateUserInput } from '@/types/admin'

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

interface UseUsersOptions {
  enabled?: boolean
}

export function useUsers(filters: UseUsersFilters = {}, options: UseUsersOptions = {}): UseUsersResult {
  const role = getUserRole()
  const usersEndpointAllowedRoles = new Set(['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'RECEIPTION', 'CLINICAL_DIRECTOR', 'MANAGER', 'HUMAN_RESOURCE'])
  const canReadUsers = !!role && usersEndpointAllowedRoles.has(role)
  const { enabled = true } = options

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    enabled: enabled && canReadUsers,
    queryFn: async () => {
      const { data } = await apiRequest<User[]>('GET', '/users')
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

export function useCreateUser() {
  const queryClient = useQueryClient()

  const { mutateAsync: createUser, isPending: isCreating } = useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const { data } = await apiRequest<User>('POST', '/users', input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  return { createUser, isCreating }
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  const { mutateAsync: updateUser, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateUserInput }) => {
      const { data } = await apiRequest<User>('PUT', `/users/${id}`, input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  return { updateUser, isUpdating }
}