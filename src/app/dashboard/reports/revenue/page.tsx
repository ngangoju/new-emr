'use client'

import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts'
import { ArrowLeft, Loader2, DollarSign, Wallet, Receipt, CreditCard, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportDateRangePicker } from '@/components/reports/ReportDateRangePicker'
import { useRevenueReport, useExportReport } from '@/hooks/useHmisReports'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function RevenueReportPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  })

  // Format dates for API
  const startDate = date?.from ? format(date.from, 'yyyy-MM-dd') : format(subDays(new Date(), 29), 'yyyy-MM-dd')
  const endDate = date?.to ? format(date.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')

  const { data: report, isLoading, isError } = useRevenueReport(startDate, endDate)
  const exportReport = useExportReport()
  const isExporting = exportReport.isPending

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RWF',
      maximumFractionDigits: 0
    }).format(value)
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-500 font-medium">Failed to load revenue data</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Revenue Summary</h1>
            <p className="text-muted-foreground">
              Financial performance and payment analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReportDateRangePicker date={date} setDate={setDate} disabled={isLoading} />
          <Button 
            variant="outline" 
            disabled={isLoading || isExporting}
            onClick={() => exportReport.mutate({ reportType: 'financial', format: 'csv' })}
          >
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(report.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Overall revenue</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">{formatCurrency(report.totalCollected)}</div>
                <p className="text-xs text-muted-foreground">Cash & Insurance paid</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-600">{formatCurrency(report.totalOutstanding)}</div>
                <p className="text-xs text-muted-foreground">Unpaid receivables</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Insurance Share</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(report.insuranceShare)}</div>
                <p className="text-xs text-muted-foreground">Claimable amount</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Patient Share</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(report.patientShare)}</div>
                <p className="text-xs text-muted-foreground">Direct payments</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Revenue by Insurance Bar Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue by Insurance Type</CardTitle>
                <CardDescription>
                   Distribution of revenue across insurance providers
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.revenueByInsurance}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="insuranceType" 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <Tooltip 
                        formatter={(value) => [typeof value === 'number' ? formatCurrency(value) : String(value), 'Amount']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill="currentColor" 
                        radius={[4, 4, 0, 0]} 
                        className="fill-primary" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Revenue by Category Pie Chart */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Revenue by Service</CardTitle>
                <CardDescription>
                  Breakdown by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report.revenueByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="amount"
                        nameKey="category"
                      >
                        {report.revenueByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: unknown) => typeof value === 'number' ? formatCurrency(value) : String(value ?? '')} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        {report.revenueByCategory.map((entry, index) => (
                          <div key={entry.category} className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="text-muted-foreground truncate">{entry.category}: {formatCurrency(entry.amount)}</span>
                          </div>
                        ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Aging & Recent Invoices */}
          <div className="grid gap-4 md:grid-cols-2">
             <Card>
                <CardHeader>
                    <CardTitle>Receivables Aging</CardTitle>
                    <CardDescription>Unpaid invoices by duration</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bucket</TableHead>
                                <TableHead className="text-right">Count</TableHead>
                                <TableHead className="text-right">Outstanding</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {report.agingReport.map((bucket) => (
                                <TableRow key={bucket.bucket}>
                                    <TableCell className="font-medium">{bucket.bucket}</TableCell>
                                    <TableCell className="text-right">{bucket.count}</TableCell>
                                    <TableCell className="text-right text-red-600 font-medium">{formatCurrency(bucket.amount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Recent Invoices</CardTitle>
                    <CardDescription>Latest financial transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Patient</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {report.recentInvoices.map((invoice) => (
                                <TableRow key={invoice.invoiceId}>
                                    <TableCell className="font-mono text-xs">{invoice.invoiceId}</TableCell>
                                    <TableCell className="font-medium truncate max-w-[120px]">{invoice.patientName}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                                    <TableCell>
                                        <Badge variant={invoice.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                                            {invoice.paymentStatus}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}
