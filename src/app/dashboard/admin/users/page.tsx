'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { UserManagementTable } from '../../../../components/admin/UserManagementTable'
import { useRole } from '@/hooks/useRole'
import { canAccessDashboardRoute } from '@/lib/authz/policy'
import { ForbiddenAccess } from '@/components/auth/ForbiddenAccess'

export default function AdminUsersPage() {
  const { role, roles, permissions, isLoading } = useRole()

  if (!isLoading && !canAccessDashboardRoute(role, '/dashboard/admin', { roles, permissions })) {
    return <ForbiddenAccess />
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-full h-8 w-8">
          <Link href="/dashboard/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader 
          title="User Management"
          description="Manage system users, roles, and access credentials."
        />
      </div>
      <div className="bg-background rounded-lg border shadow-sm p-6">
        <UserManagementTable />
      </div>
    </div>
  )
}
