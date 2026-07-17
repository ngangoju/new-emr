'use client'

import dynamic from 'next/dynamic'
import { SystemStats } from './SystemStats'
import { UserManagementTable } from './UserManagementTable'
import { EventHealthMonitor } from './EventHealthMonitor'
import { Skeleton } from '@/components/ui/skeleton'

// Recharts-heavy; load lazily so the admin shell paints first.
const ReportsSection = dynamic(
  () => import('./ReportsSection').then((m) => m.ReportsSection),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
)

export default function AdminDashboard() {
  return (
    <>
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
