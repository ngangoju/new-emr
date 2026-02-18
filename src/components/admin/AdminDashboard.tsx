'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { SystemStats } from './SystemStats'
import { UserManagementTable } from './UserManagementTable'
import { ReportsSection } from './ReportsSection'
import { EventHealthMonitor } from './EventHealthMonitor'

export default function AdminDashboard() {
  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="System overview with key metrics, comprehensive user management, and interactive reports & analytics."
      />
      <div className="w-full mb-8">
        <SystemStats />
      </div>
      <section className="space-y-6">
        <h2 className="text-3xl font-heading font-bold tracking-tight">User Management</h2>
        <UserManagementTable />
      </section>
      <section className="space-y-6">
        <h2 className="text-3xl font-heading font-bold tracking-tight">System Health</h2>
        <EventHealthMonitor />
      </section>
      <section className="space-y-6">
        <h2 className="text-3xl font-heading font-bold tracking-tight">Reports & Analytics</h2>
        <ReportsSection />
      </section>
    </>
  )
}