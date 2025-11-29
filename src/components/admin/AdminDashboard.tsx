'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { SystemStats } from './SystemStats'
import { UserManagementTable } from './UserManagementTable'
import { ReportsSection } from './ReportsSection'

export default function AdminDashboard() {
  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="System overview with key metrics, comprehensive user management, and interactive reports & analytics."
      />
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 space-y-8 xl:space-y-0 xl:space-x-8">
        <SystemStats />
      </div>
      <section className="space-y-6">
        <h2 className="text-3xl font-heading font-bold tracking-tight">User Management</h2>
        <UserManagementTable />
      </section>
      <section className="space-y-6">
        <h2 className="text-3xl font-heading font-bold tracking-tight">Reports & Analytics</h2>
        <ReportsSection />
      </section>
    </>
  )
}