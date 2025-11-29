'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export function LowStockAlerts() {
  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardHeader className="flex flex-row items-center">
        <AlertCircle className="h-5 w-5 text-warning" />
        <CardTitle className="text-lg font-medium">Low Stock Alerts</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-warning/10 rounded-md">
            <span className="text-sm font-medium">Ibuprofen 400mg Tablet</span>
            <span className="text-sm font-semibold text-warning">8 units</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-warning/10 rounded-md">
            <span className="text-sm font-medium">Metronidazole 200mg Tablet</span>
            <span className="text-sm font-semibold text-warning">17 units</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}