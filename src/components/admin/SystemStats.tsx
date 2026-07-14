'use client'

import { useSystemStats } from '@/hooks/useSystemStats'
import { Users, CalendarDays, DollarSign, Users2, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/format'

// Mock format if no utils
const formatCurrency = (amount: number) => `${formatMoney(amount)}`

export function SystemStats() {
  const { stats, loading } = useSystemStats()

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="h-24 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients.toLocaleString(),
      trend: stats.patientGrowth,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Appointments',
      value: stats.totalAppointments.toLocaleString(),
      trend: 5.2,
      icon: CalendarDays,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      trend: stats.revenueTrend,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900/20',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      trend: -2.1,
      icon: Users2,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/20',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {statsCards.map((card, index) => (
        <Card key={index} className="border-none shadow-sm hover:shadow-md transition-all duration-200 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <div className={cn("p-3 rounded-xl", card.bg)}>
                  <card.icon className={cn("h-6 w-6", card.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">{card.value}</h3>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={cn(
                "flex items-center font-medium",
                card.trend >= 0 ? "text-emerald-600" : "text-rose-600"
              )}>
                {card.trend >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {Math.abs(card.trend)}%
              </span>
              <span className="text-muted-foreground ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}