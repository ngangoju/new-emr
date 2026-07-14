'use client'

import { useMemo } from 'react'
import {
  ArrowLeft,
  BarChart3,
  Download,
  Loader2,
  ShieldCheck,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useExportReport, useUsageReport } from '@/hooks/useReports'

export default function UsageReportPage() {
  const { data: report, isLoading, isError } = useUsageReport()
  const { exportReport, exporting } = useExportReport()

  const totalUsers = useMemo(
    () => (report?.data ?? []).reduce((sum, item) => sum + Number(item.value ?? 0), 0),
    [report],
  )

  const dominantRole = useMemo(() => {
    const sorted = [...(report?.data ?? [])].sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0))
    return sorted[0] ?? null
  }, [report])

  const roleCount = report?.data?.length ?? 0

  if (isError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <div className="font-medium text-red-500">Failed to load usage report</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Usage</h1>
            <p className="text-muted-foreground">
              Role distribution and platform adoption across the workspace.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={isLoading || exporting}
            onClick={() => exportReport({ reportType: 'usage', format: 'csv' })}
          >
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export CSV
          </Button>
          <Button
            variant="outline"
            disabled={isLoading || exporting}
            onClick={() => exportReport({ reportType: 'usage', format: 'json' })}
          >
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
            Export JSON
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : report ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">Users represented in the current role snapshot</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roleCount}</div>
                <p className="text-xs text-muted-foreground">Distinct roles with at least one user</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Largest Cohort</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dominantRole?.label ?? '--'}</div>
                <p className="text-xs text-muted-foreground">
                  {dominantRole ? `${dominantRole.value} user(s)` : 'No role data available'}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>User Count by Role</CardTitle>
                <CardDescription>Current user distribution from the operational dataset.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => String(value).replaceAll('_', ' ')}
                      />
                      <YAxis
                        allowDecimals={false}
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [`${value} user(s)`, 'Count']}
                        labelFormatter={(value) => String(value).replaceAll('_', ' ')}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {report.data.map((entry, index) => (
                          <Cell key={`${entry.label}-${index}`} fill={entry.color || 'var(--chart-3)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Role Breakdown</CardTitle>
                <CardDescription>Sorted from highest to lowest current headcount.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...(report.data ?? [])]
                  .sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0))
                  .map((entry) => (
                    <div key={entry.label} className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: entry.color || 'var(--chart-3)' }}
                        />
                        <span className="font-medium">{String(entry.label).replaceAll('_', ' ')}</span>
                      </div>
                      <Badge variant="secondary">{entry.value}</Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage Detail</CardTitle>
              <CardDescription>Detailed role counts for export review and governance follow-up.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No usage data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    report.data.map((entry) => {
                      const share = totalUsers > 0 ? (Number(entry.value ?? 0) / totalUsers) * 100 : 0
                      return (
                        <TableRow key={entry.label}>
                          <TableCell className="font-medium">{String(entry.label).replaceAll('_', ' ')}</TableCell>
                          <TableCell className="text-right">{entry.value}</TableCell>
                          <TableCell className="text-right">{share.toFixed(1)}%</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
