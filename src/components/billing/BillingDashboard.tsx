'use client'

import { useState } from 'react'
import { DollarSign, Clock, TrendingUp, FileText, Plus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { InvoicesTable } from './InvoicesTable'
import { ReportCharts } from './ReportCharts'
import { useInvoices } from '@/hooks/useInvoices'
import type { Invoice } from '@/types/billing'
import { Badge } from '@/components/ui/badge'

export function BillingDashboard() {
  const { pending, stats } = useInvoices()
  const [showNewInvoice, setShowNewInvoice] = useState(false)

  const handleProcessPayment = (invoice: Invoice) => {
    alert(`Process payment dialog for invoice ${invoice.id}\nPatient Due: RWF ${invoice.patientDue.toLocaleString()}\nIntegrate InvoiceGenerator for editing/paying.`)
  }

  return (
    <>
      <PageHeader
        title="Billing Dashboard"
        description="Pending invoices, revenue stats, invoice generation, payment processing, financial reports."
      />
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RWF {stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <TrendingUp className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RWF {stats.pendingAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Invoices Today</CardTitle>
            <FileText className="h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invoices */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pending Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoicesTable 
            invoices={pending} 
            onProcessPayment={handleProcessPayment}
          />
        </CardContent>
      </Card>

      {/* Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportCharts />
        </CardContent>
      </Card>

      {/* FAB */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl z-50"
        onClick={() => setShowNewInvoice(true)}
        size="lg"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {showNewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">New Invoice Generator</h2>
            <p className="text-muted-foreground mb-6">
              Multi-section form: Patient select (auto-fill recent consult), Services table (Tariff combobox, qty calc), Summary (copay, totals), Payment (method, partial pay).
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setShowNewInvoice(false)}>Close</Button>
              <Button>Generate & Pay (mock)</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}