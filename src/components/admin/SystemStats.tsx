'use client'

import { useSystemStats } from '@/hooks/useSystemStats'
import { Users, CalendarDays, DollarSign, Users2, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Mock format if no utils
const formatCurrency = (amount: number) => `RWF ${amount.toLocaleString()}`

export function SystemStats() {
  const { stats } = useSystemStats()

  const statsCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      trend: stats.patientGrowth,
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Appointments',
      value: stats.totalAppointments,
      trend: 5.2,
      icon: CalendarDays,
      color: 'text-success',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      trend: stats.revenueTrend,
      icon: DollarSign,
      color: 'text-success',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      trend: -2.1,
      icon: Users2,
      color: 'text-muted-foreground',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-5 w-5 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold text-foreground">
              {card.value}
            </div>
            <Badge variant={card.trend >= 0 ? 'default' : 'secondary'} className="mt-1">
              {card.trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {card.trend >= 0 ? '+' : ''}{card.trend}%
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}