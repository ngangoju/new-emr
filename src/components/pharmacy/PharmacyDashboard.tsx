'use client'

import { usePharmacyDashboard, useInventorySummary, useInventoryCategories } from '@/hooks/useInventory'
import { useCreateDrugStock, useDrugStock } from '@/hooks/useDrugStock'
import { useRole } from '@/hooks/useRole'
import { useDebounce } from '@/hooks/useDebounce'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Activity,
  AlertTriangle,
  Package,
  DollarSign,
  Clock,
  ShieldCheck,
  Boxes,
  FlaskConical,
  ChevronRight,
  CalendarDays,
  Truck,
  Search,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
} from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { formatMoney } from '@/lib/format'

export function PharmacyDashboard() {
  const { hasPermission, isLoading: roleLoading } = useRole()
  const { data: stats, isLoading: statsLoading } = usePharmacyDashboard()
  
  // Filter and pagination state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)

  // Debounce search query to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Fetch inventory with filters and pagination
  const { data: inventoryData, isLoading: inventoryLoading } = useInventorySummary({
    search: debouncedSearch || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    page: currentPage,
    size: pageSize
  })

  // Fetch available categories
  const { data: categories = [] } = useInventoryCategories()

  const { data: stockEntries = [], isLoading: stockLoading } = useDrugStock()
  const { mutateAsync: createDrugStock, isPending: isCreatingStock } = useCreateDrugStock()

  const [name, setName] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [quantity, setQuantity] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [supplier, setSupplier] = useState('')

  // Gate on the backend authority for POST /api/pharmacy/stock/in so the form only
  // appears for roles the API will accept (pharmacist/store), not a hardcoded list.
  const canManageStock = useMemo(() => {
    if (roleLoading) return false
    return hasPermission('pharmacy:stock:receive')
  }, [hasPermission, roleLoading])

  const resetForm = () => {
    setName('')
    setBatchNumber('')
    setQuantity('')
    setExpiryDate('')
    setSupplier('')
  }

  const handleCreateStock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canManageStock) {
      toast.error('You are not allowed to create stock entries.')
      return
    }

    const parsedQuantity = Number(quantity)
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      toast.error('Quantity must be a positive whole number.')
      return
    }

    try {
      await createDrugStock({
        name: name.trim(),
        batchNumber: batchNumber.trim(),
        quantity: parsedQuantity,
        expiryDate,
        supplier: supplier.trim(),
      })
      toast.success('Stock entry created successfully.')
      resetForm()
    } catch (error) {
      console.error('Failed to create stock entry:', error)
      toast.error('Failed to create stock entry.')
    }
  }

  if (statsLoading || inventoryLoading || roleLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm">Loading pharmacy dashboard…</p>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Items',
      value: stats?.totalMedicationsInStock ?? 0,
      sub: 'Unique medications in stock',
      icon: Boxes,
      color: 'from-info/20 to-info/5',
      iconColor: 'text-info',
      ringColor: 'ring-info/30',
    },
    {
      label: 'Total Value',
      value: `${formatMoney((stats?.totalInventoryValue ?? 0))}`,
      sub: 'Current inventory value',
      icon: DollarSign,
      color: 'from-success/20 to-success/5',
      iconColor: 'text-success',
      ringColor: 'ring-success/30',
    },
    {
      label: 'Low Stock',
      value: stats?.lowStockCount ?? 0,
      sub: 'Items below threshold',
      icon: AlertTriangle,
      color:
        (stats?.lowStockCount ?? 0) > 0
          ? 'from-warning/20 to-warning/5'
          : 'from-muted to-muted/50',
      iconColor: (stats?.lowStockCount ?? 0) > 0 ? 'text-warning' : 'text-muted-foreground',
      ringColor: (stats?.lowStockCount ?? 0) > 0 ? 'ring-warning/30' : 'ring-border',
    },
    {
      label: 'Expiring Soon',
      value: stats?.expiringCount ?? 0,
      sub: 'Expires within 30 days',
      icon: Clock,
      color:
        (stats?.expiringCount ?? 0) > 0
          ? 'from-critical/20 to-critical/5'
          : 'from-muted to-muted/50',
      iconColor: (stats?.expiringCount ?? 0) > 0 ? 'text-critical' : 'text-muted-foreground',
      ringColor: (stats?.expiringCount ?? 0) > 0 ? 'ring-critical/30' : 'ring-border',
    },
  ]

  return (
    <Tabs defaultValue="overview" className="space-y-6 animate-fade-in">
      <TabsList className="bg-muted/60 p-1">
        <TabsTrigger value="overview" className="gap-2">
          <FlaskConical className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="stock-receiving" className="gap-2">
          <Truck className="h-4 w-4" />
          Stock Receiving
        </TabsTrigger>
      </TabsList>

      {/* ── OVERVIEW TAB ─────────────────────────────────── */}
      <TabsContent value="overview" className="space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <Card
                key={card.label}
                className={`relative overflow-hidden border-0 shadow-sm ring-1 ${card.ringColor} bg-gradient-to-br ${card.color}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        {card.label}
                      </p>
                      <p className="text-3xl font-bold tracking-tight">{card.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl bg-card shadow-sm ring-1 ring-black/5 ${card.iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Inventory Overview Table */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-muted/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">Inventory Overview</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">
                {inventoryData?.totalElements ?? 0} medication{(inventoryData?.totalElements ?? 0) !== 1 ? 's' : ''} total
              </span>
            </div>
          </CardHeader>
          
          {/* Filter Controls */}
          <div className="p-4 border-b bg-muted/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search medications..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(0) // Reset to first page on search
                  }}
                  className="pl-9 h-9 text-sm"
                  onKeyDown={(e) => {
                    // Prevent form submission on Enter key
                    if (e.key === 'Enter') {
                      e.preventDefault()
                    }
                  }}
                />
              </div>
              
              {/* Category Filter */}
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value)
                  setCurrentPage(0) // Reset to first page on filter change
                }}
              >
                <SelectTrigger className="w-full sm:w-48 h-9 text-sm" type="button">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Clear Filters Button */}
            {(searchQuery || (selectedCategory && selectedCategory !== 'all')) && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setCurrentPage(0)
                }}
                className="text-xs h-7"
              >
                Clear Filters
              </Button>
            )}
          </div>
          
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableHead className="pl-6 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Medication
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Category
                  </TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Qty
                  </TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Value (RWF)
                  </TableHead>
                  <TableHead className="text-center pr-6 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData?.content?.map((item, index) => {
                  const isLow = item.lowStockCount > 0
                  const isExpiring = item.expiringCount > 0
                  const isOk = !isLow && !isExpiring

                  return (
                    <TableRow
                      key={index}
                      className="group hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="pl-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FlaskConical className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm">{item.medicationName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className="text-xs font-normal bg-background border-border/60"
                        >
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-3 font-mono text-sm font-medium">
                        {(item.totalQuantity ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right py-3 font-mono text-sm text-muted-foreground">
                        {(item.totalValue ?? 0).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-center py-3 pr-6">
                        <div className="flex justify-center gap-1.5 flex-wrap">
                          {isOk && (
                            <Badge className="bg-success-muted text-success-foreground border-success/30 hover:bg-success-muted gap-1 font-normal">
                              <ShieldCheck className="h-3 w-3" />
                              OK
                            </Badge>
                          )}
                          {isLow && (
                            <Badge className="bg-warning-muted text-warning-foreground border-warning/30 hover:bg-warning-muted gap-1 font-normal">
                              <AlertTriangle className="h-3 w-3" />
                              Low
                            </Badge>
                          )}
                          {isExpiring && (
                            <Badge className="bg-critical-muted text-critical-foreground border-critical/30 hover:bg-critical-muted gap-1 font-normal">
                              <Clock className="h-3 w-3" />
                              Expiring
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}

                {(!inventoryData?.content || inventoryData.content.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">No inventory items found</p>
                          <p className="text-xs text-muted-foreground/70 mt-0.5">
                            {searchQuery || (selectedCategory && selectedCategory !== 'all')
                              ? 'Try adjusting your search or filter criteria'
                              : 'Receive stock to populate the inventory'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {/* Pagination Controls */}
            {inventoryData && inventoryData.totalPages > 0 && (
              <div className="border-t px-6 py-3 flex items-center justify-between bg-muted/10">
                <div className="text-xs text-muted-foreground">
                  Showing {inventoryData.content?.length ?? 0} of {inventoryData.totalElements} items
                  (Page {inventoryData.page + 1} of {inventoryData.totalPages})
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(0)}
                    disabled={inventoryData.page === 0}
                  >
                    <ChevronFirst className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={inventoryData.page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(prev => Math.min(inventoryData.totalPages - 1, prev + 1))}
                    disabled={inventoryData.page >= inventoryData.totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(inventoryData.totalPages - 1)}
                    disabled={inventoryData.page >= inventoryData.totalPages - 1}
                  >
                    <ChevronLast className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── STOCK RECEIVING TAB ──────────────────────────── */}
      <TabsContent value="stock-receiving" className="space-y-6">

        {/* Form Card */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-muted/30 px-6 py-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Receive Incoming Drug Stock</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {!canManageStock && (
              <div className="mb-5 flex items-center gap-3 rounded-lg border border-warning/40 bg-warning-muted p-3.5 text-sm text-warning-foreground">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-warning" />
                Only pharmacist and admin users can receive stock.
              </div>
            )}

            <form className="grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={handleCreateStock}>
              <div className="space-y-2">
                <Label htmlFor="stock-name" className="text-sm font-medium">
                  Drug Name
                </Label>
                <Input
                  id="stock-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amoxicillin"
                  disabled={!canManageStock || isCreatingStock}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock-batch" className="text-sm font-medium">
                  Batch Number
                </Label>
                <Input
                  id="stock-batch"
                  required
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BATCH-2026-001"
                  disabled={!canManageStock || isCreatingStock}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock-quantity" className="text-sm font-medium">
                  Quantity
                </Label>
                <Input
                  id="stock-quantity"
                  required
                  type="number"
                  min={1}
                  step={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 100"
                  disabled={!canManageStock || isCreatingStock}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock-expiry" className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  Expiry Date
                </Label>
                <Input
                  id="stock-expiry"
                  required
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  disabled={!canManageStock || isCreatingStock}
                  className="h-10"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="stock-supplier" className="text-sm font-medium">
                  Supplier
                </Label>
                <Input
                  id="stock-supplier"
                  required
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="e.g. Rwanda Pharma Supply"
                  disabled={!canManageStock || isCreatingStock}
                  className="h-10"
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={!canManageStock || isCreatingStock}
                  className="gap-2 min-w-[140px]"
                >
                  {isCreatingStock ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Truck className="h-4 w-4" />
                      Receive Stock
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Stock Entries Table */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-muted/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">Received Stock Entries</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">
                {stockEntries.length} entr{stockEntries.length !== 1 ? 'ies' : 'y'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  {['Name', 'Batch', 'Qty', 'Expiry', 'Supplier', 'Received'].map((h) => (
                    <TableHead
                      key={h}
                      className={`font-semibold text-xs uppercase tracking-wide text-muted-foreground ${
                        h === 'Qty' ? 'text-right' : ''
                      } ${h === 'Name' ? 'pl-6' : ''} ${h === 'Received' ? 'pr-6' : ''}`}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockEntries.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="pl-6 py-3 font-medium text-sm">{entry.name}</TableCell>
                    <TableCell className="py-3">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                        {entry.batchNumber}
                      </code>
                    </TableCell>
                    <TableCell className="text-right py-3 font-mono text-sm font-medium">
                      {entry.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">
                      {new Date(entry.expiryDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-3 text-sm text-muted-foreground">{entry.supplier}</TableCell>
                    <TableCell className="py-3 pr-6 text-sm text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}

                {!stockLoading && stockEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
                          <Truck className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">No stock entries yet</p>
                          <p className="text-xs text-muted-foreground/70 mt-0.5">
                            Use the form above to record incoming stock
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
