'use client'

import React from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { UserManagementTable } from '@/components/admin/UserManagementTable'
import { useRole } from '@/hooks/useRole'
import { canAccessDashboardRoute } from '@/lib/authz/policy'
import { ForbiddenAccess } from '@/components/auth/ForbiddenAccess'

export default function AdminUsersPage() {
  const { role, isLoading } = useRole()

  if (!isLoading && !canAccessDashboardRoute(role, '/dashboard/admin')) {
    return <ForbiddenAccess />
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <PageHeader 
        title="User Management"
        description="Manage system users, roles, and access credentials."
      />
      <div className="bg-background rounded-lg border shadow-sm p-6">
        <UserManagementTable />
      </div>
    </div>
  )
}
