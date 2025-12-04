'use client'

import React from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/empty-state'
import { Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ConsultationsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Consultations" 
        description="Manage patient consultations and medical records"
      />
      
      <div className="rounded-lg border bg-card p-8">
        <EmptyState
          icon={Stethoscope}
          title="No consultations found"
          description="Start a new consultation or view past records."
          action={{
            label: "New Consultation",
            onClick: () => window.location.href = '/dashboard/doctor/consultations/new'
          }}
        />
      </div>
    </div>
  )
}
