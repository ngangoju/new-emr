'use client'

import Link from 'next/link'
import { isAxiosError } from 'axios'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useAnalyticsTenants, type TenantStatsDto } from '@/hooks/api/useAnalyticsTenants'
import { ArrowLeft, BarChart3, Loader2, ShieldAlert } from 'lucide-react'
import { formatMoney } from '@/lib/format'

type CountField =
    | 'patientCount'
    | 'appointmentCount'
    | 'consultationCount'
    | 'labOrderCount'
    | 'prescriptionCount'
    | 'visitTicketCount'
    | 'invoiceCount'
    | 'activeUserCount'
    | 'invoiceRevenue'

function sumField(rows: TenantStatsDto[], field: CountField): number {
    return rows.reduce((total, row) => total + (row[field] ?? 0), 0)
}

export default function AdminAnalyticsPage() {
    const { data: stats, isLoading, error } = useAnalyticsTenants()

    const isForbidden = isAxiosError(error) && error.response?.status === 403

    if (isForbidden) {
        return (
            <div className="space-y-6 animate-fade-in p-6">
                <PageHeader title="Analytics Overview" description="Per-tenant aggregated statistics" />
                <Card className="border-destructive/40">
                    <CardContent className="pt-6 flex items-center gap-3 text-sm">
                        <ShieldAlert className="h-5 w-5 text-destructive" />
                        <span>Access denied — platform admin only.</span>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const rows = stats ?? []

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-full h-8 w-8">
                    <Link href="/dashboard/admin">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <PageHeader
                    title="Analytics Overview"
                    description="Aggregated counts only — no patient-identifiable data."
                />
            </div>

            {error && !isForbidden && (
                <Card className="border-destructive/40">
                    <CardContent className="pt-6 text-sm text-destructive">
                        Failed to load analytics. Please try again.
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Per-Tenant Statistics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading analytics...
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="text-center py-10 text-sm text-muted-foreground">
                            No analytics data available.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tenant</TableHead>
                                    <TableHead className="text-right">Patients</TableHead>
                                    <TableHead className="text-right">Appointments</TableHead>
                                    <TableHead className="text-right">Consultations</TableHead>
                                    <TableHead className="text-right">Lab Orders</TableHead>
                                    <TableHead className="text-right">Prescriptions</TableHead>
                                    <TableHead className="text-right">Visit Tickets</TableHead>
                                    <TableHead className="text-right">Invoices</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead className="text-right">Active Users</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row) => (
                                    <TableRow key={row.tenantId}>
                                        <TableCell className="font-medium">{row.tenantName}</TableCell>
                                        <TableCell className="text-right">{row.patientCount}</TableCell>
                                        <TableCell className="text-right">{row.appointmentCount}</TableCell>
                                        <TableCell className="text-right">{row.consultationCount}</TableCell>
                                        <TableCell className="text-right">{row.labOrderCount}</TableCell>
                                        <TableCell className="text-right">{row.prescriptionCount}</TableCell>
                                        <TableCell className="text-right">{row.visitTicketCount}</TableCell>
                                        <TableCell className="text-right">{row.invoiceCount}</TableCell>
                                        <TableCell className="text-right">
                                            {formatMoney(row.invoiceRevenue)}
                                        </TableCell>
                                        <TableCell className="text-right">{row.activeUserCount}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow data-testid="analytics-totals-row">
                                    <TableCell className="font-semibold">Totals</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {sumField(rows, 'patientCount')}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {sumField(rows, 'appointmentCount')}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {sumField(rows, 'consultationCount')}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {sumField(rows, 'labOrderCount')}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {sumField(rows, 'prescriptionCount')}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {sumField(rows, 'visitTicketCount')}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {sumField(rows, 'invoiceCount')}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {formatMoney(sumField(rows, 'invoiceRevenue'))}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {sumField(rows, 'activeUserCount')}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    )}
                    <p className="text-xs text-muted-foreground mt-4">
                        Aggregated counts only — no patient-identifiable data.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
