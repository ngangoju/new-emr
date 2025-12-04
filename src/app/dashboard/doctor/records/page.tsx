'use client'

import React from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/empty-state'
import { FileText } from 'lucide-react'

export default function RecordsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Medical Records" 
        description="View and manage patient medical records"
      />
      
      <div className="rounded-lg border bg-card p-8">
        <EmptyState
          icon={FileText}
          title="No records found"
          description="Search for a patient to view their medical records."
        />
      </div>
    </div>
  )
}
