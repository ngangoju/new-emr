'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { isAxiosError } from 'axios'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    useTenantMembers,
    useAddTenantMember,
    useRemoveTenantMember,
    useSetHomeTenant,
    type TenantMemberDto,
} from '@/hooks/api/useTenantMembers'
import { ArrowLeft, Plus, Trash2, Users, Loader2, ShieldAlert, Home } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function TenantMembersPage() {
    const params = useParams<{ tenantId: string }>()
    const tenantId = params.tenantId

    const { data: members, isLoading, error } = useTenantMembers(tenantId)
    const addMutation = useAddTenantMember(tenantId)
    const removeMutation = useRemoveTenantMember(tenantId)
    const setHomeMutation = useSetHomeTenant()

    const [addOpen, setAddOpen] = useState(false)
    const [addUserId, setAddUserId] = useState('')
    const [addRole, setAddRole] = useState('')
    const [removeTarget, setRemoveTarget] = useState<TenantMemberDto | null>(null)
    const [homeUserId, setHomeUserId] = useState('')

    const isForbidden = isAxiosError(error) && error.response?.status === 403

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!addUserId.trim()) return
        try {
            await addMutation.mutateAsync({
                userId: addUserId.trim(),
                body: addRole.trim() ? { role: addRole.trim() } : undefined,
            })
            toast.success('Member added')
            setAddOpen(false)
            setAddUserId('')
            setAddRole('')
        } catch {
            toast.error('Failed to add member')
        }
    }

    const handleRemove = async () => {
        if (!removeTarget) return
        try {
            await removeMutation.mutateAsync(removeTarget.userId)
            toast.success('Member removed')
        } catch {
            toast.error('Failed to remove member')
        } finally {
            setRemoveTarget(null)
        }
    }

    const handleSetHome = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!homeUserId.trim()) return
        try {
            await setHomeMutation.mutateAsync({ userId: homeUserId.trim(), tenantId })
            toast.success('Home clinic updated')
            setHomeUserId('')
        } catch {
            toast.error('Failed to set home clinic')
        }
    }

    if (isForbidden) {
        return (
            <div className="space-y-6 animate-fade-in p-6">
                <PageHeader title="Tenant Members" description="Manage tenant membership" />
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
                    <Link href="/dashboard/admin/tenants">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <PageHeader title="Tenant Members" description={`Members of tenant ${tenantId}`} />
                <div className="ml-auto">
                    <Button onClick={() => setAddOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Member
                    </Button>
                </div>
            </div>

            {error && !isForbidden && (
                <Card className="border-destructive/40">
                    <CardContent className="pt-6 text-sm text-destructive">
                        Failed to load members. Please try again.
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5 text-primary" />
                        Members
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading members...
                        </div>
                    ) : !members || members.length === 0 ? (
                        <div className="text-center py-10 text-sm text-muted-foreground">
                            No members in this tenant yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.userId}>
                                        <TableCell className="font-medium">{member.username}</TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>{member.role}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Remove member"
                                                onClick={() => setRemoveTarget(member)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Home className="h-5 w-5 text-primary" />
                        Set Home Clinic
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSetHome} className="flex items-end gap-3">
                        <div className="space-y-1 flex-1 max-w-sm">
                            <label className="text-xs font-medium text-muted-foreground">
                                User ID
                            </label>
                            <Input
                                value={homeUserId}
                                onChange={(e) => setHomeUserId(e.target.value)}
                                placeholder="User ID to set this tenant as home clinic"
                            />
                        </div>
                        <Button type="submit" disabled={setHomeMutation.isPending || !homeUserId.trim()}>
                            Set Home Clinic
                        </Button>
                    </form>
                    <p className="text-xs text-muted-foreground mt-2">
                        Sets this tenant as the user&apos;s home clinic.
                    </p>
                </CardContent>
            </Card>

            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Member</DialogTitle>
                        <DialogDescription>
                            Assign an existing user to this tenant.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">User ID</label>
                            <Input
                                value={addUserId}
                                onChange={(e) => setAddUserId(e.target.value)}
                                placeholder="User ID"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                                Role (optional)
                            </label>
                            <Input
                                value={addRole}
                                onChange={(e) => setAddRole(e.target.value)}
                                placeholder="e.g. DOCTOR"
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={addMutation.isPending}>
                                Add Member
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={removeTarget !== null} onOpenChange={(open) => !open && setRemoveTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Member</DialogTitle>
                        <DialogDescription>
                            Remove &quot;{removeTarget?.username}&quot; from this tenant?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setRemoveTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleRemove}
                            disabled={removeMutation.isPending}
                        >
                            Remove
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
