'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useTenants, CreateTenantRequest } from '@/hooks/useTenants'
import { ArrowLeft, Plus, Pencil, Trash2, Building2, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

type ModalMode = 'create' | 'edit' | null

export default function TenantsPage() {
    const { tenants, isLoading, error, fetchTenants, createTenant, updateTenant, deleteTenant } = useTenants()
    const [modalMode, setModalMode] = useState<ModalMode>(null)
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
    const [form, setForm] = useState<CreateTenantRequest>({
        name: '',
        subdomain: '',
        plan: 'free',
        settings: {}
    })

    useEffect(() => {
        fetchTenants()
    }, [fetchTenants])

    const openCreate = () => {
        setSelectedTenantId(null)
        setForm({ name: '', subdomain: '', plan: 'free', settings: {} })
        setModalMode('create')
    }

    const openEdit = (tenant: { id: string; name: string; subdomain: string; plan: string; settings: Record<string, unknown> }) => {
        setSelectedTenantId(tenant.id)
        setForm({
            name: tenant.name,
            subdomain: tenant.subdomain,
            plan: tenant.plan,
            settings: tenant.settings || {}
        })
        setModalMode('edit')
    }

    const closeModal = () => {
        setModalMode(null)
        setSelectedTenantId(null)
        setForm({ name: '', subdomain: '', plan: 'free', settings: {} })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (modalMode === 'create') {
                await createTenant(form)
                toast.success('Tenant created')
            } else if (modalMode === 'edit' && selectedTenantId) {
                await updateTenant(selectedTenantId, form)
                toast.success('Tenant updated')
            }
            closeModal()
        } catch {
            // error handled in hook
        }
    }

    const handleDelete = async (id: string, name: string) => {
        const confirmed = window.confirm(`Delete tenant "${name}"? This will disable access for all members.`)
        if (!confirmed) return
        try {
            await deleteTenant(id)
            toast.success('Tenant deleted')
        } catch {
            // error handled in hook
        }
    }

    const planBadgeClass = (plan: string) =>
        plan === 'free' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'

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

            {error && (
                <Card className="border-destructive/40">
                    <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
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
                    ) : tenants.length === 0 ? (
                        <div className="text-center py-10 text-sm text-muted-foreground">
                            No tenants found. Create one to get started.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tenants.map((tenant) => (
                                <div
                                    key={tenant.id}
                                    className="flex items-center justify-between rounded-md border p-4"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm">{tenant.name}</p>
                                            <Badge variant="outline" className="text-xs">
                                                {tenant.subdomain}
                                            </Badge>
                                            <Badge className={`text-xs ${planBadgeClass(tenant.plan)}`}>
                                                {tenant.plan}
                                            </Badge>
                                            <Badge
                                                variant={tenant.status === 'active' ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {tenant.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            ID: {tenant.id}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEdit(tenant)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(tenant.id, tenant.name)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {modalMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <Card className="w-full max-w-lg mx-4">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {modalMode === 'create' ? 'Create Tenant' : 'Edit Tenant'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
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
                                        onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
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
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={closeModal}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {modalMode === 'create' ? 'Create' : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
