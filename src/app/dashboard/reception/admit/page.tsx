'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { AdmissionForm } from '@/components/nurse/AdmissionForm'
import { useRole } from '@/hooks/useRole'
import { canAccessDashboardRoute } from '@/lib/authz/policy'
import { ForbiddenAccess } from '@/components/auth/ForbiddenAccess'

export default function ReceptionAdmissionsPage() {
  const router = useRouter()
  const { role, isLoading: roleLoading } = useRole()

  if (!roleLoading && !canAccessDashboardRoute(role, '/dashboard/reception')) {
    return <ForbiddenAccess />
  }

  const handleAdmissionSuccess = () => {
    // Navigate back to reception dashboard on success
    router.push('/dashboard/reception')
  }

  return (
    <div className="container mx-auto py-6 space-y-8 animate-fade-in">
      <PageHeader
        title="Admit Patient"
        description="Register a new or existing patient to a ward and bed."
      />
      
      <div className="max-w-2xl">
        <AdmissionForm onSuccess={handleAdmissionSuccess} />
      </div>
    </div>
  )
}
