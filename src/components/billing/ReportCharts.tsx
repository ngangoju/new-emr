import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useReports } from '@/hooks/useReports'
import { useRole } from '@/hooks/useRole'

export function ReportCharts() {
  // Only roles holding report:financial:read may load /reports/*; otherwise the fetch
  // 403s (e.g. CASHIER). Gate the query and hide the widget when not permitted (P2-009).
  const { hasPermission } = useRole()
  const canViewReports = hasPermission('report:financial:read')
  const { reports, loading } = useReports({ enabled: canViewReports })
  const data = reports.financial?.data || []

  if (!canViewReports) {
    return null
  }

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Loading charts...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>{reports.financial?.title || 'Revenue'}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} strokeOpacity={0.3} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip 
              formatter={(value: unknown) => [`RWF ${(Number(value) || 0).toLocaleString()}`, 'Revenue']}
              cursor={{ fill: 'transparent' }}
            />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
