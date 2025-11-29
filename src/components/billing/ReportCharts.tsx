import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const chartData = [
  { day: 'Mon', revenue: 2400 },
  { day: 'Tue', revenue: 1398 },
  { day: 'Wed', revenue: 9800 },
  { day: 'Thu', revenue: 3908 },
  { day: 'Fri', revenue: 4800 },
  { day: 'Sat', revenue: 3800 },
  { day: 'Sun', revenue: 4300 },
]

export function ReportCharts() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Revenue - Last 7 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} strokeOpacity={0.3} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}