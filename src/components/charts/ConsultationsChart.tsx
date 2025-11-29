'use client'

import React from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useTheme } from 'next-themes'

const data = [
  { name: 'Mon', total: 12 },
  { name: 'Tue', total: 18 },
  { name: 'Wed', total: 15 },
  { name: 'Thu', total: 22 },
  { name: 'Fri', total: 28 },
  { name: 'Sat', total: 10 },
  { name: 'Sun', total: 5 },
]

export function ConsultationsChart() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={false} 
          stroke={isDark ? 'hsl(var(--border))' : '#e5e7eb'} 
        />
        <XAxis
          dataKey="name"
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
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip 
          cursor={{ fill: isDark ? 'hsl(var(--accent) / 0.1)' : '#f3f4f6' }}
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            borderColor: 'hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))'
          }}
        />
        <Bar
          dataKey="total"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
