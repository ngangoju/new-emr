'use client'

import React from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/empty-state'
import { CalendarDays } from 'lucide-react'

export default function SchedulePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Schedule" 
        description="Manage your appointments and availability"
      />
      
      <div className="rounded-lg border bg-card p-8">
        <EmptyState
          icon={CalendarDays}
          title="Schedule is empty"
          description="You don't have any appointments scheduled for today."
        />
      </div>
    </div>
  )
}
