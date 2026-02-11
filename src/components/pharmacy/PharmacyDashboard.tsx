'use client'

import { usePharmacyDashboard, useInventorySummary } from '@/hooks/useInventory'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Activity, AlertTriangle, Package, DollarSign } from 'lucide-react'

export function PharmacyDashboard() {
  const { data: stats, isLoading: statsLoading } = usePharmacyDashboard()
  const { data: inventory, isLoading: inventoryLoading } = useInventorySummary()

  if (statsLoading || inventoryLoading) {
    return <div className="p-8 text-center">Loading pharmacy dashboard...</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
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

      {/* Inventory Summary Table */}
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
    </div>
  )
}