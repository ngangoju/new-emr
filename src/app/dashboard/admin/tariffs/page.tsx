'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useTariffs } from '@/hooks/useTariffs'
import {
  useCreateTariff,
  useUpdateTariff,
  useDeleteTariff,
  useUpdateTariffPrice,
  useBulkCreateTariffs,
  type CreateTariffInput,
  type UpdateTariffInput,
} from '@/hooks/useTariffManagement'
import { canRoleAccessFeature, getRoleDefaultDashboardRoute } from '@/lib/authz/policy'
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
import { Plus, Search, Pencil, Trash2, FileUp, Download } from 'lucide-react'
import ExcelJS from 'exceljs'
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
import { useRouter } from 'next/navigation'

const TARIFF_CATEGORIES = [
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'LAB', label: 'Lab' },
  { value: 'RADIOLOGY', label: 'Radiology' },
  { value: 'IMAGING', label: 'Imaging' },
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

type TariffImportRow = Record<string, string | number | null | undefined>

const tariffTemplateRows = [
  {
    'Service Name': 'General Consultation',
    'Billing Code': 'CONS-001',
    'Category': 'CONSULTATION',
    'Base Price': 15000,
    'Private Price': 20000,
    'RSSB MMI Price': 12000,
    'Description': 'Initial general consultation'
  },
  {
    'Service Name': 'Laboratory Test',
    'Billing Code': 'LAB-001',
    'Category': 'LAB',
    'Base Price': 8000,
    'Private Price': 10000,
    'RSSB MMI Price': 6400,
    'Description': 'Standard blood test'
  }
]

const tariffImportHeaders = Object.keys(tariffTemplateRows[0])

const stringifySpreadsheetCell = (value: ExcelJS.CellValue): string | number | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') return value.text
    if ('result' in value) return stringifySpreadsheetCell(value.result as ExcelJS.CellValue)
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map(part => part.text).join('')
    }
  }
  return String(value)
}

const parseCsvRows = (text: string): TariffImportRow[] => {
  const rows: string[][] = []
  let current = ''
  let row: string[] = []
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"'
      i += 1
      continue
    }
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (char === ',' && !inQuotes) {
      row.push(current.trim())
      current = ''
      continue
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i += 1
      row.push(current.trim())
      if (row.some(cell => cell.length > 0)) rows.push(row)
      row = []
      current = ''
      continue
    }
    current += char
  }

  row.push(current.trim())
  if (row.some(cell => cell.length > 0)) rows.push(row)

  const [headers = [], ...dataRows] = rows
  return dataRows.map(dataRow => {
    const record: TariffImportRow = {}
    headers.forEach((header, index) => {
      if (header) record[header] = dataRow[index] ?? ''
    })
    return record
  })
}

const parseSpreadsheetRows = async (file: File): Promise<TariffImportRow[]> => {
  if (file.name.toLowerCase().endsWith('.csv')) {
    return parseCsvRows(await file.text())
  }

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  const worksheet = workbook.worksheets[0]
  if (!worksheet) return []

  const headers: string[] = []
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = String(stringifySpreadsheetCell(cell.value) ?? '').trim()
  })

  const rows: TariffImportRow[] = []
  worksheet.eachRow((worksheetRow, rowNumber) => {
    if (rowNumber === 1) return
    const record: TariffImportRow = {}
    headers.forEach((header, colNumber) => {
      if (!header) return
      record[header] = stringifySpreadsheetCell(worksheetRow.getCell(colNumber).value)
    })
    if (Object.values(record).some(value => value !== null && value !== undefined && value !== '')) {
      rows.push(record)
    }
  })
  return rows
}

export default function TariffManagementPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null)
  const [hasPermissionFlag, setHasPermissionFlag] = useState(false)
  const [currentRole, setCurrentRole] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreateTariffInput>(defaultFormState)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Check permission
  useEffect(() => {
    const userRole = getUserRole()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentRole(userRole)
    const hasAccess = userRole ? canRoleAccessFeature(userRole, 'CAN_MANAGE_TARIFFS') : false
    setHasPermissionFlag(hasAccess)
    if (!hasAccess) {
      router.replace(getRoleDefaultDashboardRoute(userRole))
    }
  }, [router])

  // Fetch tariffs
  const { data: tariffsResponse, isLoading } = useTariffs({ search, category: categoryFilter === 'ALL' ? undefined : categoryFilter })
  const tariffs = useMemo(() => tariffsResponse?.data ?? [], [tariffsResponse])

  // Mutations
  const { createTariff, isCreating } = useCreateTariff()
  const { updateTariff, isUpdating } = useUpdateTariff()
  const { deleteTariff, isDeleting } = useDeleteTariff()
  const { bulkCreateTariffs, isImporting } = useBulkCreateTariffs()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { updateTariffPrice, isUpdatingPrice } = useUpdateTariffPrice()

  const isClinicalDirector = currentRole === 'CLINICAL-DIRECTOR'
  const isAdmin = currentRole === 'ADMIN'

  // Filter active/inactive for display
  const filteredTariffs = useMemo(() => {
    return tariffs.filter(tariff => {
      if (search) {
        const query = search.toLowerCase()
        const matchName = tariff.serviceName.toLowerCase().includes(query)
        const matchCode = tariff.billingCode?.toLowerCase().includes(query)
        if (!matchName && !matchCode) return false
      }
      if (categoryFilter !== 'ALL' && tariff.category !== categoryFilter) return false
      return true
    })
  }, [tariffs, search, categoryFilter])

  const handleCreate = async () => {
    if (!isAdmin) {
      toast.error('Only admin users can create tariffs.')
      return
    }

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
    } catch {
      // Handled by global interceptor
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
      if (isClinicalDirector) {
        await updateTariffPrice({
          id: selectedTariff.id,
          input: {
            basePrice: formData.basePrice,
            privatePrice: formData.privatePrice,
            rssbMmiPrice: formData.rssbMmiPrice,
          },
        })
      } else {
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
      }
      toast.success('Tariff updated successfully')
      setEditDialogOpen(false)
      setSelectedTariff(null)
      setFormData(defaultFormState)
    } catch {
      // Handled by global interceptor
    }
  }

  const handleDelete = async () => {
    if (!selectedTariff) return

    if (!isAdmin) {
      toast.error('Only admin users can delete tariffs.')
      return
    }

    try {
      await deleteTariff(selectedTariff.id)
      toast.success('Tariff deleted successfully')
      setDeleteDialogOpen(false)
      setSelectedTariff(null)
    } catch {
      // Handled by global interceptor
    }
  }

  const openEditDialog = (tariff: Tariff) => {
    setSelectedTariff(tariff)
    setFormData({
      serviceName: tariff.serviceName,
      billingCode: tariff.billingCode || '',
      category: tariff.category || '',
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const jsonData = await parseSpreadsheetRows(file)
      const readCell = (row: TariffImportRow, ...keys: string[]) =>
        keys.map((key) => row[key]).find((value) => value !== undefined && value !== null && value !== '') ?? ''
      const readText = (row: TariffImportRow, ...keys: string[]) => String(readCell(row, ...keys))
      const readNumber = (row: TariffImportRow, ...keys: string[]) =>
        Number.parseFloat(String(readCell(row, ...keys) || '0'))

      const tariffsToCreate: CreateTariffInput[] = jsonData.map(row => ({
        serviceName: readText(row, 'Service Name', 'serviceName'),
        billingCode: readText(row, 'Billing Code', 'billingCode'),
        category: readText(row, 'Category', 'category'),
        basePrice: readNumber(row, 'Base Price', 'basePrice'),
        privatePrice: readCell(row, 'Private Price', 'privatePrice') ? readNumber(row, 'Private Price', 'privatePrice') : undefined,
        rssbMmiPrice: readCell(row, 'RSSB MMI Price', 'rssbMmiPrice') ? readNumber(row, 'RSSB MMI Price', 'rssbMmiPrice') : undefined,
        description: readText(row, 'Description', 'description')
      })).filter(t => t.serviceName)

      if (tariffsToCreate.length === 0) {
        toast.error('No valid tariffs found in the file')
        return
      }

      try {
        await bulkCreateTariffs(tariffsToCreate)
        toast.success(`Successfully imported ${tariffsToCreate.length} tariffs`)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } catch {
        // Handled by global interceptor, we just need to catch it here to prevent the outer catch
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to read import file. Please check the file format.')
    }
  }

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Tariffs')
    worksheet.addRow(tariffImportHeaders)
    tariffTemplateRows.forEach((row) => {
      worksheet.addRow(tariffImportHeaders.map((header) => row[header as keyof typeof row]))
    })
    worksheet.columns.forEach((column) => {
      column.width = 24
    })

    const excelBuffer = await workbook.xlsx.writeBuffer()
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = 'tariff_import_template.xlsx'
    link.click()

    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
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
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx,.csv"
            onChange={handleFileChange}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
            <FileUp className="mr-2 h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Template
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} disabled={!isAdmin}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tariff
          </Button>
        </div>
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
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
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
                          No tariffs found. Click &quot;Add Tariff&quot; to create one.
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
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(tariff)}
                          disabled={!isAdmin}
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
                value={formData.category || "NONE"}
                onValueChange={(val) => setFormData({ ...formData, category: val === "NONE" ? "" : val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None (General)</SelectItem>
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
                  disabled={isClinicalDirector}
                />
                {formErrors.serviceName && <p className="text-sm text-destructive">{formErrors.serviceName}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Billing Code *</label>
                <Input
                  placeholder="e.g., CONS-001"
                  value={formData.billingCode}
                  onChange={(e) => setFormData({ ...formData, billingCode: e.target.value })}
                  disabled={isClinicalDirector}
                />
                {formErrors.billingCode && <p className="text-sm text-destructive">{formErrors.billingCode}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select
                  value={formData.category || "NONE"}
                  onValueChange={(val) => setFormData({ ...formData, category: val === "NONE" ? "" : val })}
                  disabled={isClinicalDirector}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None (General)</SelectItem>
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
                  disabled={isClinicalDirector}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Optional description..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  disabled={isClinicalDirector}
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
              disabled={isUpdating || isUpdatingPrice}
            >
              {isUpdating || isUpdatingPrice ? 'Saving...' : 'Save Changes'}
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
              Are you sure you want to delete &quot;{selectedTariff?.serviceName}&quot;? This action will mark the tariff as inactive.
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
