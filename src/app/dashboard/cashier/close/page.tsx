'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Download, Loader2 } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { ForbiddenAccess } from '@/components/auth/ForbiddenAccess'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRole } from '@/hooks/useRole'
import { useCreateCashClose, useCashCloseHistory } from '@/hooks/usePayments'
import { canAccessDashboardRoute } from '@/lib/authz/policy'
import type { CashCloseSummary } from '@/types/billing'

type ApiErrorPayload = {
  response?: {
    data?: {
      message?: string
    }
  }
}
import toast from 'react-hot-toast'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function toIsoDate(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

function csvEscape(value: string | number | null | undefined) {
  const raw = value == null ? '' : String(value)
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

export default function CashierClosePage() {
  const { role, isLoading: roleLoading } = useRole()
  const canAccess = canAccessDashboardRoute(role, '/dashboard/cashier/close')

  const today = toIsoDate(new Date())
  const [shiftDate, setShiftDate] = useState<string>(today)
  const [cashierId, setCashierId] = useState<string>('')

  const { createCashClose, creatingCashClose } = useCreateCashClose()
  const { data: history = [], isLoading: historyLoading } = useCashCloseHistory({
    cashierId: cashierId.trim() || undefined,
  })

  const selectedSummary = useMemo(() => {
    const targetDate = shiftDate
    const targetCashier = cashierId.trim() || null

    return history.find((row) => {
      const dateMatch = row.shiftDate?.slice(0, 10) === targetDate
      const cashierMatch = !targetCashier || row.cashierId === targetCashier
      return dateMatch && cashierMatch
    })
  }, [history, shiftDate, cashierId])

  const handleGenerate = async () => {
    try {
      await createCashClose({
        shiftDate,
        cashierId: cashierId.trim() || undefined,
        force: !!selectedSummary,
      })
    } catch (error: unknown) {
      const apiError = error as ApiErrorPayload
      if (apiError.response?.data?.message) {
        toast.error(apiError.response.data.message)
      } else {
        toast.error('Failed to generate cash close report.')
      }
    }
  }

  const handleExportCsv = () => {
    if (!history.length) {
      toast.error('No data to export.')
      return
    }

    const headers = [
      'Shift Date',
      'Cashier ID',
      'Cashier Name',
      'Total Collected',
      'Cash',
      'Card',
      'MoMo',
      'Bank Transfer',
      'Invoice Count',
      'Closed At',
      'Closed By',
    ]

    const lines = [
      headers.join(','),
      ...history.map((row) => [
        csvEscape(row.shiftDate),
        csvEscape(row.cashierId),
        csvEscape(row.cashierName),
        csvEscape(row.totalCollected),
        csvEscape(row.byMethod?.cash),
        csvEscape(row.byMethod?.card),
        csvEscape(row.byMethod?.momo),
        csvEscape(row.byMethod?.bankTransfer),
        csvEscape(row.invoiceCount),
        csvEscape(row.closedAt),
        csvEscape(row.closedBy),
      ].join(',')),
    ].join('\n')

    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `cash-close-history-${toIsoDate(new Date())}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const summary: CashCloseSummary | null = selectedSummary ?? null

  if (!roleLoading && !canAccess) {
    return <ForbiddenAccess />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cashier Daily Closing"
        description="Generate cashier close reports and review historical closures."
      >
        <Button
          variant="outline"
          onClick={handleExportCsv}
          disabled={!history.length}
          title="Export history as CSV"
          className="bg-white/50 backdrop-blur-sm border-primary/20 hover:border-primary/50"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Generate Close Report</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="shift-date">Shift Date</Label>
            <Input
              id="shift-date"
              type="date"
              value={shiftDate}
              onChange={(event) => setShiftDate(event.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cashier-id">Cashier ID (optional)</Label>
            <Input
              id="cashier-id"
              placeholder="UUID (leave blank to use current cashier)"
              value={cashierId}
              onChange={(event) => setCashierId(event.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button onClick={handleGenerate} disabled={creatingCashClose} className="w-full">
              {creatingCashClose
                ? 'Generating...'
                : selectedSummary
                  ? 'Regenerate Close Report'
                  : 'Generate Close Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader><CardTitle className="text-sm">Total Collected</CardTitle></CardHeader>
          <CardContent className="text-xl font-bold">{formatCurrency(summary?.totalCollected ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Cash</CardTitle></CardHeader>
          <CardContent className="text-xl font-bold">{formatCurrency(summary?.byMethod?.cash ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Card</CardTitle></CardHeader>
          <CardContent className="text-xl font-bold">{formatCurrency(summary?.byMethod?.card ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">MoMo</CardTitle></CardHeader>
          <CardContent className="text-xl font-bold">{formatCurrency(summary?.byMethod?.momo ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Bank Transfer</CardTitle></CardHeader>
          <CardContent className="text-xl font-bold">{formatCurrency(summary?.byMethod?.bankTransfer ?? 0)}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Close Report History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading history...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                  <TableHead>Closed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.shiftDate?.slice(0, 10)}</TableCell>
                    <TableCell>{row.cashierName}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(row.totalCollected)}</TableCell>
                    <TableCell className="text-right">{row.invoiceCount}</TableCell>
                    <TableCell>{row.closedAt ? new Date(row.closedAt).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                ))}
                {!history.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No close reports found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
