'use client'

import { useEffect, useMemo, useState } from 'react'
import { useUsers, useCreateUser, useUpdateUser } from '@/hooks/useUsers'
import type { User, CreateUserInput, UpdateUserInput } from '@/types/admin'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Edit3, Plus, Trash2, UserX } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import toast from 'react-hot-toast'

const ALL_ROLES = [
  'ADMIN',
  'DOCTOR',
  'NURSE',
  'RECEPTIONIST',
  'CASHIER',
  'LAB_TECH',
  'PHARMACIST',
  'AUDITOR',
  'BILLING',
  'MANAGER',
  'HUMAN_RESOURCE',
  'CLINICAL_DIRECTOR',
  'USER',
] as const

const statuses = ['active', 'inactive', 'suspended'] as const

function normalizeRole(role: string): string {
  return role.trim().toUpperCase()
}

function normalizeRoles(roles: string[]): string[] {
  return Array.from(new Set(roles.map(normalizeRole).filter(Boolean))).sort((a, b) => a.localeCompare(b))
}

function getUserRoles(user: User): string[] {
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return normalizeRoles(user.roles)
  }
  if (typeof user.role === 'string' && user.role.trim().length > 0) {
    return [normalizeRole(user.role)]
  }
  return ['USER']
}

function roleBadges(user: User) {
  return getUserRoles(user).map((role) => (
    <Badge key={`${user.id}-${role}`} variant="secondary" className="mr-1 mb-1">
      {role}
    </Badge>
  ))
}

type UserFormState = {
  username: string
  name: string
  email: string
  password?: string
  active?: boolean
  roles: string[]
}

function toPrimaryRole(roles: string[]): string {
  return normalizeRoles(roles)[0] ?? 'USER'
}

function toCreateInput(state: UserFormState): CreateUserInput {
  return {
    username: state.username.trim(),
    name: state.name.trim(),
    email: state.email.trim(),
    password: state.password ?? '',
    role: toPrimaryRole(state.roles),
  }
}

function toUpdateInput(state: UserFormState): UpdateUserInput {
  return {
    username: state.username.trim(),
    name: state.name.trim(),
    email: state.email.trim(),
    role: toPrimaryRole(state.roles),
    active: state.active,
  }
}

export function UserManagementTable() {
  const ROLE_OVERRIDES_STORAGE_KEY = 'admin.user-role-overrides.v1'

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [roleOverrides, setRoleOverrides] = useState<Record<string, string[]>>({})

  const [newUser, setNewUser] = useState<UserFormState>({
    username: '',
    name: '',
    email: '',
    password: '',
    roles: ['USER'],
    active: true,
  })

  const [editForm, setEditForm] = useState<UserFormState>({
    username: '',
    name: '',
    email: '',
    roles: ['USER'],
    active: true,
  })

  const filters = {
    search,
    role: roleFilter === 'ALL' ? '' : roleFilter,
    status: statusFilter === 'ALL' ? '' : statusFilter,
  }
  const { filteredUsers } = useUsers(filters)
  const { createUser, isCreating } = useCreateUser()
  const { updateUser, isUpdating } = useUpdateUser()

  const roleOptions = useMemo(() => [...ALL_ROLES], [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(ROLE_OVERRIDES_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Record<string, string[]>
      if (parsed && typeof parsed === 'object') {
        const normalized: Record<string, string[]> = {}
        Object.entries(parsed).forEach(([userId, roles]) => {
          if (Array.isArray(roles)) {
            normalized[userId] = normalizeRoles(roles)
          }
        })
        setRoleOverrides(normalized)
      }
    } catch {
      // ignore malformed local cache
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ROLE_OVERRIDES_STORAGE_KEY, JSON.stringify(roleOverrides))
  }, [roleOverrides])

  const displayedUsers = useMemo(() => {
    return filteredUsers.map((user) => {
      const overriddenRoles = roleOverrides[user.id]
      if (!overriddenRoles || overriddenRoles.length === 0) {
        return user
      }
      return {
        ...user,
        roles: overriddenRoles,
        role: overriddenRoles[0] ?? user.role,
      }
    })
  }, [filteredUsers, roleOverrides])

  const handleRoleToggle = (
    targetRole: string,
    scope: 'create' | 'edit',
  ) => {
    const updater = scope === 'create' ? setNewUser : setEditForm

    updater((prev) => {
      const normalizedTarget = normalizeRole(targetRole)
      const current = new Set(normalizeRoles(prev.roles))

      if (current.has(normalizedTarget)) {
        current.delete(normalizedTarget)
      } else {
        current.add(normalizedTarget)
      }

      const nextRoles = Array.from(current)
      if (nextRoles.length === 0) {
        nextRoles.push('USER')
      }

      return { ...prev, roles: normalizeRoles(nextRoles) }
    })
  }

  const handleCreateUser = async () => {
    try {
      await createUser(toCreateInput(newUser))
      toast.success('User created successfully')
      setCreateDialogOpen(false)
      setNewUser({
        username: '',
        name: '',
        email: '',
        password: '',
        roles: ['USER'],
        active: true,
      })
    } catch {
      toast.error('Failed to create user')
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return
    try {
      await updateUser({ id: selectedUser.id, input: toUpdateInput(editForm) })
      setRoleOverrides((prev) => ({
        ...prev,
        [selectedUser.id]: normalizeRoles(editForm.roles),
      }))
      toast.success('User updated successfully')
      if (editForm.roles.length > 1) {
        toast('Multiple roles are displayed from admin UI cache until backend multi-role persistence endpoint is added.', {
          icon: 'ℹ️',
        })
      }
      setEditDialogOpen(false)
      setSelectedUser(null)
    } catch {
      toast.error('Failed to update user')
    }
  }

  const handleEditOpen = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      username: user.username,
      name: user.name,
      email: user.email,
      roles: getUserRoles(user),
      active: user.active ?? user.status === 'active',
    })
    setEditDialogOpen(true)
  }

  const handleDisable = (user: User) => {
    const isActive = (user.active ?? user.status === 'active') === true
    updateUser({
      id: user.id,
      input: {
        username: user.username,
        name: user.name,
        email: user.email,
        role: toPrimaryRole(getUserRoles(user)),
        active: !isActive,
      },
    })
      .then(() => toast.success(`User ${isActive ? 'disabled' : 'enabled'} successfully`))
      .catch(() => toast.error('Failed to update user status'))
  }

  const handleDelete = (user: User) => {
    if (confirm(`Delete user ${user.name}?`)) {
      toast.error('Delete endpoint is not wired yet. Use disable for now.')
    }
  }

  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
        <div className="flex gap-4">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{roleBadges(user)}</TableCell>
                <TableCell>
                  <Badge variant={(user.active ?? user.status === 'active') ? 'default' : 'destructive'}>
                    {(user.active ?? user.status === 'active') ? 'active' : 'inactive'}
                  </Badge>
                </TableCell>
                <TableCell>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        ...
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditOpen(user)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDisable(user)}
                        className="text-destructive focus:text-destructive"
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        {(user.active ?? user.status === 'active') ? 'Disable' : 'Enable'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(user)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account. Fill in all required fields.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Roles</label>
              <div className="grid grid-cols-2 gap-2 rounded-md border p-3 max-h-52 overflow-y-auto">
                {roleOptions.map((role) => (
                  <label key={`create-${role}`} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={newUser.roles.includes(role)}
                      onCheckedChange={() => handleRoleToggle(role, 'create')}
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Primary role sent to backend: <code>{toPrimaryRole(newUser.roles)}</code></p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateUser}
              disabled={isCreating || !newUser.username || !newUser.name || !newUser.email || !newUser.password}
            >
              {isCreating ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Roles</label>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3 max-h-52 overflow-y-auto">
                  {roleOptions.map((role) => (
                    <label key={`edit-${role}`} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={editForm.roles.includes(role)}
                        onCheckedChange={() => handleRoleToggle(role, 'edit')}
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Primary role sent to backend: <code>{toPrimaryRole(editForm.roles)}</code></p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateUser} disabled={isUpdating || !editForm.username || !editForm.email || !editForm.name}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
