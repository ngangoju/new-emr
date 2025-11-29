'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download } from 'lucide-react'
import { useReports } from '@/hooks/useReports'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export function ReportsSection() {
  const { reports } = useReports()

  const handleExport = (type: string) => {
    alert(`Export ${type} report as CSV/PDF (mock implementation)`)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financial">Financials</TabsTrigger>
          <TabsTrigger value="patient">Patient Stats</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
        </TabsList>

        {/* Financial Bar Chart */}
        <TabsContent value="financial" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">{reports.financial.title} - {reports.financial.period}</h3>
            <Button variant="outline" onClick={() => handleExport('financial')}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={reports.financial.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#10b981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patient Pie Chart */}
        <TabsContent value="patient" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">{reports.patient.title} - {reports.patient.period}</h3>
            <Button variant="outline" onClick={() => handleExport('patient')}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
          <Card>
            <CardContent className="p-6 flex justify-center">
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={reports.patient.data}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    nameKey="label"
                  >
                    {reports.patient.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Bar Chart */}
        <TabsContent value="usage" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">{reports.usage.title} - {reports.usage.period}</h3>
            <Button variant="outline" onClick={() => handleExport('usage')}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={reports.usage.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="Logins" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}