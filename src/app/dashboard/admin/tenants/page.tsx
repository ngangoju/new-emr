'use client'

import { useState } from 'react'
import Link from 'next/link'
import { isAxiosError } from 'axios'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    useAdminTenants,
    useCreateTenant,
    useUpdateTenant,
    useDeleteTenant,
    type CreateTenantDto,
    type TenantDto,
} from '@/hooks/api/useAdminTenants'
import { ArrowLeft, Plus, Pencil, Trash2, Building2, Loader2, Users, ShieldAlert } from 'lucide-react'
import { toast } from 'react-hot-toast'

type ModalMode = 'create' | 'edit' | null

const emptyForm: CreateTenantDto = { name: '', subdomain: '', plan: 'free' }

export default function TenantsPage() {
    const { data: tenants, isLoading, error } = useAdminTenants()
    const createMutation = useCreateTenant()
    const updateMutation = useUpdateTenant()
    const deleteMutation = useDeleteTenant()

    const [modalMode, setModalMode] = useState<ModalMode>(null)
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<TenantDto | null>(null)
    const [form, setForm] = useState<CreateTenantDto>(emptyForm)

    const isForbidden = isAxiosError(error) && error.response?.status === 403

    const openCreate = () => {
        setSelectedTenantId(null)
        setForm(emptyForm)
        setModalMode('create')
    }

    const openEdit = (tenant: TenantDto) => {
        setSelectedTenantId(tenant.id)
        setForm({
            name: tenant.name,
            subdomain: tenant.subdomain,
            plan: tenant.plan,
            settings: tenant.settings || {},
        })
        setModalMode('edit')
    }

    const closeModal = () => {
        setModalMode(null)
        setSelectedTenantId(null)
        setForm(emptyForm)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (modalMode === 'create') {
                await createMutation.mutateAsync(form)
                toast.success('Tenant created')
            } else if (modalMode === 'edit' && selectedTenantId) {
                await updateMutation.mutateAsync({ id: selectedTenantId, payload: form })
                toast.success('Tenant updated')
            }
            closeModal()
        } catch {
            toast.error('Failed to save tenant')
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await deleteMutation.mutateAsync(deleteTarget.id)
            toast.success('Tenant deleted')
        } catch {
            toast.error('Failed to delete tenant')
        } finally {
            setDeleteTarget(null)
        }
    }

    const planBadgeClass = (plan: string) =>
        plan === 'free' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'

    if (isForbidden) {
        return (
            <div className="space-y-6 animate-fade-in p-6">
                <PageHeader title="Tenants" description="Multi-tenant clinic management" />
                <Card className="border-destructive/40">
                    <CardContent className="pt-6 flex items-center gap-3 text-sm">
                        <ShieldAlert className="h-5 w-5 text-destructive" />
                        <span>Access denied — platform admin only.</span>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-full h-8 w-8">
                    <Link href="/dashboard/admin">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <PageHeader title="Tenants" description="Multi-tenant clinic management" />
                <div className="ml-auto">
                    <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Tenant
                    </Button>
                </div>
            </div>

            {error && !isForbidden && (
                <Card className="border-destructive/40">
                    <CardContent className="pt-6 text-sm text-destructive">
                        Failed to load tenants. Please try again.
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                        Clinics / Tenants
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading tenants...
                        </div>
                    ) : !tenants || tenants.length === 0 ? (
                        <div className="text-center py-10 text-sm text-muted-foreground">
                            No tenants found. Create one to get started.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Subdomain</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tenants.map((tenant) => (
                                    <TableRow key={tenant.id}>
                                        <TableCell className="font-medium">{tenant.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {tenant.subdomain}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-xs ${planBadgeClass(tenant.plan)}`}>
                                                {tenant.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={tenant.status === 'active' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {tenant.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" asChild title="Members">
                                                    <Link href={`/dashboard/admin/tenants/${tenant.id}`}>
                                                        <Users className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Edit"
                                                    onClick={() => openEdit(tenant)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Delete"
                                                    onClick={() => setDeleteTarget(tenant)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={modalMode !== null} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {modalMode === 'create' ? 'Create Tenant' : 'Edit Tenant'}
                        </DialogTitle>
                        <DialogDescription>
                            {modalMode === 'create'
                                ? 'Register a new clinic tenant.'
                                : 'Update tenant details.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Name</label>
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Clinic name"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Subdomain</label>
                            <Input
                                value={form.subdomain}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                                    })
                                }
                                placeholder="myclinic"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">Plan</label>
                            <select
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                value={form.plan}
                                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                            >
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeModal}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {modalMode === 'create' ? 'Create' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Tenant</DialogTitle>
                        <DialogDescription>
                            Delete tenant &quot;{deleteTarget?.name}&quot;? This will disable access for
                            all members.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
