'use client'

import { usePharmacyDashboard, useInventorySummary } from '@/hooks/useInventory'
import { useCreateDrugStock, useDrugStock } from '@/hooks/useDrugStock'
import { useRole } from '@/hooks/useRole'
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
import { Activity, AlertTriangle, Package, DollarSign } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

export function PharmacyDashboard() {
  const { isRole, isLoading: roleLoading } = useRole()
  const { data: stats, isLoading: statsLoading } = usePharmacyDashboard()
  const { data: inventory, isLoading: inventoryLoading } = useInventorySummary()
  const { data: stockEntries = [], isLoading: stockLoading } = useDrugStock()
  const { mutateAsync: createDrugStock, isPending: isCreatingStock } = useCreateDrugStock()

  const [name, setName] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [quantity, setQuantity] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [supplier, setSupplier] = useState('')

  const canManageStock = useMemo(() => {
    if (roleLoading) return false
    return isRole('PHARMACIST') || isRole('ADMIN')
  }, [isRole, roleLoading])

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
    return <div className="p-8 text-center">Loading pharmacy dashboard...</div>
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6 animate-fade-in">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="stock-receiving">Stock Receiving</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMedicationsInStock || 0}</div>
              <p className="text-xs text-muted-foreground">Unique medications in stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">RWF {stats?.totalInventoryValue?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Current inventory value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats?.lowStockCount || 0}</div>
              <p className="text-xs text-muted-foreground">Items below threshold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Activity className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats?.expiringCount || 0}</div>
              <p className="text-xs text-muted-foreground">Expires in 30 days</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Value (RWF)</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.medicationName}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">{item.totalQuantity}</TableCell>
                      <TableCell className="text-right">{item.totalValue?.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          {item.lowStockCount > 0 && (
                            <Badge variant="outline" className="border-warning text-warning bg-warning/10">
                              Low Stock
                            </Badge>
                          )}
                          {item.expiringCount > 0 && (
                            <Badge variant="outline" className="border-destructive text-destructive bg-destructive/10">
                              Expiring
                            </Badge>
                          )}
                          {item.lowStockCount === 0 && item.expiringCount === 0 && (
                            <Badge variant="outline" className="border-success text-success bg-success/10">
                              OK
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!inventory || inventory.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        No inventory items found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="stock-receiving" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Receive Incoming Drug Stock</CardTitle>
          </CardHeader>
          <CardContent>
            {!canManageStock && (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                Only pharmacist and admin users can receive stock.
              </div>
            )}

            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCreateStock}>
              <div className="space-y-2">
                <Label htmlFor="stock-name">Name</Label>
                <Input
                  id="stock-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amoxicillin"
                  disabled={!canManageStock || isCreatingStock}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock-batch">Batch Number</Label>
                <Input
                  id="stock-batch"
                  required
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BATCH-2026-001"
                  disabled={!canManageStock || isCreatingStock}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock-quantity">Quantity</Label>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock-expiry">Expiry Date</Label>
                <Input
                  id="stock-expiry"
                  required
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  disabled={!canManageStock || isCreatingStock}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="stock-supplier">Supplier</Label>
                <Input
                  id="stock-supplier"
                  required
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="e.g. Rwanda Pharma Supply"
                  disabled={!canManageStock || isCreatingStock}
                />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" disabled={!canManageStock || isCreatingStock}>
                  {isCreatingStock ? 'Saving...' : 'Receive Stock'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Received Stock Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Received At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.name}</TableCell>
                      <TableCell>{entry.batchNumber}</TableCell>
                      <TableCell className="text-right">{entry.quantity}</TableCell>
                      <TableCell>{new Date(entry.expiryDate).toLocaleDateString()}</TableCell>
                      <TableCell>{entry.supplier}</TableCell>
                      <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}

                  {!stockLoading && stockEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        No stock entries recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
