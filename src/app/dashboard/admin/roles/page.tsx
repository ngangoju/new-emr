'use client'

import { useState, useEffect } from 'react'
import { useRoles, Role, CreateRoleRequest, UpdateRoleRequest } from '@/hooks/useRoles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Pencil, Trash2, Plus, Shield, ArrowLeft } from 'lucide-react'
import { PermissionsManager } from '@/components/admin/PermissionsManager'

export default function RolesPage() {
    const { roles, isLoading, error, fetchRoles, createRole, updateRole, deleteRole } = useRoles()
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [createFormData, setCreateFormData] = useState<CreateRoleRequest>({ name: '', permissionsJson: '' })
    const [editFormData, setEditFormData] = useState<UpdateRoleRequest>({})

    useEffect(() => {
        fetchRoles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleCreate = async () => {
        if (!createFormData.name.trim()) {
            toast.error('Role name is required')
            return
        }

        const result = await createRole(createFormData)
        if (result) {
            toast.success(`Role "${result.name}" created successfully`)
            setIsCreateDialogOpen(false)
            setCreateFormData({ name: '', permissionsJson: '' })
        } else {
            toast.error(error || 'Failed to create role')
        }
    }

    const handleEdit = async () => {
        if (!selectedRole) return

        if (!editFormData.name?.trim()) {
            toast.error('Role name is required')
            return
        }

        const result = await updateRole(selectedRole.id, editFormData)
        if (result) {
            toast.success(`Role "${result.name}" updated successfully`)
            setIsEditDialogOpen(false)
            setSelectedRole(null)
            setEditFormData({})
        } else {
            toast.error(error || 'Failed to update role')
        }
    }

    const handleDelete = async () => {
        if (!selectedRole) return

        const success = await deleteRole(selectedRole.id)
        if (success) {
            toast.success(`Role "${selectedRole.name}" deleted successfully`)
            setIsDeleteDialogOpen(false)
            setSelectedRole(null)
        } else {
            toast.error(error || 'Failed to delete role')
        }
    }

    const openEditDialog = (role: Role) => {
        setSelectedRole(role)
        setEditFormData({
            name: role.name,
            permissionsJson: role.permissionsJson || '',
        })
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (role: Role) => {
        setSelectedRole(role)
        setIsDeleteDialogOpen(true)
    }

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-full h-8 w-8">
                    <Link href="/dashboard/admin">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Role Management</h1>
                    <p className="text-muted-foreground">Manage system roles and permissions</p>
                </div>
                <div className="ml-auto">
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Role
                </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {roles.map((role) => (
                    <Card key={role.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-muted-foreground" />
                                    <CardTitle className="text-lg">{role.name}</CardTitle>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditDialog(role)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openDeleteDialog(role)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardDescription>
                                {role.permissionsJson ? (
                                    <Badge variant="secondary">
                                        {JSON.parse(role.permissionsJson).length || 0} permissions
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">No permissions</Badge>
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Created: {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {roles.length === 0 && !isLoading && (
                <div className="text-center py-12">
                    <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No roles found</h3>
                    <p className="text-muted-foreground">Get started by creating a new role</p>
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                    <DialogHeader>
                        <DialogTitle>Create New Role</DialogTitle>
                        <DialogDescription>
                            Add a new role to the system with appropriate permissions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Role Name</Label>
                            <Input
                                id="name"
                                value={createFormData.name || ''}
                                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                                placeholder="e.g., NURSE, PHARMACIST"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Permissions</Label>
                            <PermissionsManager
                                value={createFormData.permissionsJson || '[]'}
                                onChange={(value) => setCreateFormData({ ...createFormData, permissionsJson: value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                    <DialogHeader>
                        <DialogTitle>Edit Role</DialogTitle>
                        <DialogDescription>
                            Update the role details and permissions. For RECEPTIONIST role, the following permissions are pre-selected: read:*, write:queue, write:patient, write:appointment
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Role Name</Label>
                            <Input
                                id="edit-name"
                                value={editFormData.name || ''}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Permissions</Label>
                            <PermissionsManager
                                value={editFormData.permissionsJson || '[]'}
                                onChange={(value) => setEditFormData({ ...editFormData, permissionsJson: value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Role</DialogTitle>
                        <DialogDescription>
              Are you sure you want to delete the role &quot;{selectedRole?.name}&quot;? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                            {isLoading ? 'Deleting...' : 'Delete Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
