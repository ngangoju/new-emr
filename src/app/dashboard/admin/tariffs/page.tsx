'use client'

import { useState, useMemo } from 'react'
import { useTariffs } from '@/hooks/useTariffs'
import { useCreateTariff, useUpdateTariff, useDeleteTariff, type CreateTariffInput, type UpdateTariffInput } from '@/hooks/useTariffManagement'
import { canRoleAccessFeature, FRONTEND_FEATURE_POLICY } from '@/lib/authz/policy'
import { getUserRole } from '@/lib/utils/auth'
import type { Tariff } from '@/types/billing'
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
import { Edit3, Trash2, Plus, Search, DollarSign } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const TARIFF_CATEGORIES = [
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'LAB', label: 'Lab' },
  { value: 'RADIOLOGY', label: 'Radiology' },
  { value: 'PHARMACY', label: 'Pharmacy' },
  { value: 'PROCEDURE', label: 'Procedure' },
  { value: 'OTHER', label: 'Other' },
]

const defaultFormState: CreateTariffInput = {
  serviceName: '',
  billingCode: '',
  category: 'CONSULTATION',
  basePrice: 0,
  privatePrice: undefined,
  rssbMmiPrice: undefined,
  mutuellePrice: undefined,
  description: '',
}

export default function TariffManagementPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null)
  const [hasPermissionFlag, setHasPermissionFlag] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CreateTariffInput>(defaultFormState)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Check permission
  useEffect(() => {
    const userRole = getUserRole()
    const hasAccess = userRole ? canRoleAccessFeature(userRole, 'CAN_MANAGE_TARIFFS') : false
    setHasPermissionFlag(hasAccess)
    if (!hasAccess) {
      toast.error('You do not have permission to manage tariffs')
      router.push('/dashboard')
    }
  }, [router])

  // Fetch tariffs
  const { data: tariffs = [], isLoading } = useTariffs({ search, category: categoryFilter || undefined })

  // Mutations
  const { createTariff, isCreating } = useCreateTariff()
  const { updateTariff, isUpdating } = useUpdateTariff()
  const { deleteTariff, isDeleting } = useDeleteTariff()

  // Filter active/inactive for display
  const filteredTariffs = useMemo(() => {
    return tariffs.filter(tariff => {
      if (search) {
        const query = search.toLowerCase()
        const matchName = tariff.serviceName.toLowerCase().includes(query)
        const matchCode = tariff.billingCode?.toLowerCase().includes(query)
        if (!matchName && !matchCode) return false
      }
      if (categoryFilter && tariff.category !== categoryFilter) return false
      return true
    })
  }, [tariffs, search, categoryFilter])

  const handleCreate = async () => {
    // Validate
    const errors: Record<string, string> = {}
    if (!formData.serviceName.trim()) errors.serviceName = 'Service name is required'
    if (!formData.billingCode.trim()) errors.billingCode = 'Billing code is required'
    if (!formData.basePrice || formData.basePrice <= 0) errors.basePrice = 'Base price is required'
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})

    try {
      await createTariff(formData)
      toast.success('Tariff created successfully')
      setCreateDialogOpen(false)
      setFormData(defaultFormState)
    } catch (error) {
      toast.error('Failed to create tariff')
    }
  }

  const handleUpdate = async () => {
    if (!selectedTariff) return

    // Validate
    const errors: Record<string, string> = {}
    if (!formData.serviceName.trim()) errors.serviceName = 'Service name is required'
    if (!formData.billingCode.trim()) errors.billingCode = 'Billing code is required'
    if (!formData.basePrice || formData.basePrice <= 0) errors.basePrice = 'Base price is required'
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})

    try {
      const updateData: UpdateTariffInput = {
        serviceName: formData.serviceName,
        billingCode: formData.billingCode,
        category: formData.category,
        basePrice: formData.basePrice,
        privatePrice: formData.privatePrice,
        rssbMmiPrice: formData.rssbMmiPrice,
        mutuellePrice: formData.mutuellePrice,
        description: formData.description,
      }
      await updateTariff({ id: selectedTariff.id, input: updateData })
      toast.success('Tariff updated successfully')
      setEditDialogOpen(false)
      setSelectedTariff(null)
      setFormData(defaultFormState)
    } catch (error) {
      toast.error('Failed to update tariff')
    }
  }

  const handleDelete = async () => {
    if (!selectedTariff) return

    try {
      await deleteTariff(selectedTariff.id)
      toast.success('Tariff deleted successfully')
      setDeleteDialogOpen(false)
      setSelectedTariff(null)
    } catch (error) {
      toast.error('Failed to delete tariff')
    }
  }

  const openEditDialog = (tariff: Tariff) => {
    setSelectedTariff(tariff)
    setFormData({
      serviceName: tariff.serviceName,
      billingCode: tariff.billingCode || '',
      category: tariff.category,
      basePrice: tariff.basePrice,
      privatePrice: tariff.privatePrice,
      rssbMmiPrice: tariff.rssbMmiPrice,
      mutuellePrice: tariff.mutuellePrice,
      description: tariff.description || '',
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (tariff: Tariff) => {
    setSelectedTariff(tariff)
    setDeleteDialogOpen(true)
  }

  const formatPrice = (price?: number) => {
    if (!price) return '-'
    return `RWF ${price.toLocaleString()}`
  }

  if (!hasPermissionFlag) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Checking permissions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Tariff Management</h1>
          <p className="text-muted-foreground">Manage service tariffs and pricing</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tariff
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or billing code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter || undefined} onValueChange={(val) => setCategoryFilter(val || '')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {TARIFF_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Billing Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Private Price</TableHead>
              <TableHead>RSSB/MMI</TableHead>
              <TableHead>Mutuelle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Loading tariffs...
                </TableCell>
              </TableRow>
            ) : filteredTariffs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No tariffs found. Click "Add Tariff" to create one.
                </TableCell>
              </TableRow>
            ) : (
              filteredTariffs.map((tariff) => (
                <TableRow key={tariff.id}>
                  <TableCell className="font-medium">{tariff.serviceName}</TableCell>
                  <TableCell>{tariff.billingCode || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tariff.category}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{formatPrice(tariff.basePrice)}</TableCell>
                  <TableCell>{formatPrice(tariff.privatePrice)}</TableCell>
                  <TableCell>{formatPrice(tariff.rssbMmiPrice)}</TableCell>
                  <TableCell>{formatPrice(tariff.mutuellePrice)}</TableCell>
                  <TableCell>
                    <Badge variant={tariff.active ? 'default' : 'destructive'}>
                      {tariff.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
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
                        <DropdownMenuItem onClick={() => openEditDialog(tariff)}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(tariff)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Tariff</DialogTitle>
            <DialogDescription>
              Create a new service tariff. Fill in all required fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Name *</label>
              <Input 
                placeholder="e.g., General Consultation"
                value={formData.serviceName}
                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
              />
              {formErrors.serviceName && <p className="text-sm text-destructive">{formErrors.serviceName}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Billing Code *</label>
              <Input 
                placeholder="e.g., CONS-001"
                value={formData.billingCode}
                onChange={(e) => setFormData({ ...formData, billingCode: e.target.value })}
              />
              {formErrors.billingCode && <p className="text-sm text-destructive">{formErrors.billingCode}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category *</label>
              <Select 
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARIFF_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Base Price (RWF) *</label>
              <Input 
                type="number"
                placeholder="0"
                value={formData.basePrice || ''}
                onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
              />
              {formErrors.basePrice && <p className="text-sm text-destructive">{formErrors.basePrice}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Private Price (RWF)</label>
                <Input 
                  type="number"
                  placeholder="Optional"
                  value={formData.privatePrice || ''}
                  onChange={(e) => setFormData({ ...formData, privatePrice: parseFloat(e.target.value) || undefined })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">RSSB/MMI Price (RWF)</label>
                <Input 
                  type="number"
                  placeholder="Optional"
                  value={formData.rssbMmiPrice || ''}
                  onChange={(e) => setFormData({ ...formData, rssbMmiPrice: parseFloat(e.target.value) || undefined })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mutuelle Price (RWF)</label>
              <Input 
                type="number"
                placeholder="Optional"
                value={formData.mutuellePrice || ''}
                onChange={(e) => setFormData({ ...formData, mutuellePrice: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                placeholder="Optional description..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Tariff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tariff</DialogTitle>
            <DialogDescription>
              Update tariff details.
            </DialogDescription>
          </DialogHeader>
          {selectedTariff && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Service Name *</label>
                <Input 
                  placeholder="e.g., General Consultation"
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                />
                {formErrors.serviceName && <p className="text-sm text-destructive">{formErrors.serviceName}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Billing Code *</label>
                <Input 
                  placeholder="e.g., CONS-001"
                  value={formData.billingCode}
                  onChange={(e) => setFormData({ ...formData, billingCode: e.target.value })}
                />
                {formErrors.billingCode && <p className="text-sm text-destructive">{formErrors.billingCode}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select 
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARIFF_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Base Price (RWF) *</label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={formData.basePrice || ''}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                />
                {formErrors.basePrice && <p className="text-sm text-destructive">{formErrors.basePrice}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Private Price (RWF)</label>
                  <Input 
                    type="number"
                    placeholder="Optional"
                    value={formData.privatePrice || ''}
                    onChange={(e) => setFormData({ ...formData, privatePrice: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">RSSB/MMI Price (RWF)</label>
                  <Input 
                    type="number"
                    placeholder="Optional"
                    value={formData.rssbMmiPrice || ''}
                    onChange={(e) => setFormData({ ...formData, rssbMmiPrice: parseFloat(e.target.value) || undefined })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mutuelle Price (RWF)</label>
                <Input 
                  type="number"
                  placeholder="Optional"
                  value={formData.mutuellePrice || ''}
                  onChange={(e) => setFormData({ ...formData, mutuellePrice: parseFloat(e.target.value) || undefined })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  placeholder="Optional description..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={isUpdating}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tariff</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTariff?.serviceName}"? This action will mark the tariff as inactive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Tariff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
