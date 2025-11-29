'use client'

export function PharmacyDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-lg border bg-card shadow-sm">
          <div className="text-sm font-medium text-muted-foreground mb-1">Total Items</div>
          <div className="text-2xl font-bold">24</div>
        </div>
        <div className="p-6 rounded-lg border bg-card shadow-sm">
          <div className="text-sm font-medium text-muted-foreground mb-1">Total Value</div>
          <div className="text-2xl font-bold">$2,450</div>
        </div>
        <div className="p-6 rounded-lg border bg-card shadow-sm">
          <div className="text-sm font-medium text-muted-foreground mb-1">Low Stock</div>
          <div className="text-2xl font-bold text-destructive">3</div>
        </div>
        <div className="p-6 rounded-lg border bg-card shadow-sm">
          <div className="text-sm font-medium text-muted-foreground mb-1">Expiring Soon</div>
          <div className="text-2xl font-bold text-warning">2</div>
        </div>
      </div>
      <div>Low Stock Alerts Stub</div>
      <div>Inventory Table Stub</div>
      <button className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary shadow-lg">
        +
      </button>
    </div>
  )
}