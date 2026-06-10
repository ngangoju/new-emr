'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { TriageQueue } from '@/components/clinical/TriageQueue'
import { PageHeader } from '@/components/layout/PageHeader'
import { useRole } from '@/hooks/useRole'
import { NurseBilling } from '@/components/nurse/NurseBilling'
import { DrugRequestForm } from '@/components/nurse/DrugRequestForm'
import { NurseVitalsForm } from '@/components/nurse/NurseVitalsForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function NurseDashboardPage() {
  return (
    <Suspense fallback={<NurseDashboardShell />}>
      <NurseDashboardContent />
    </Suspense>
  )
}

function NurseDashboardShell() {
  return (
    <>
      <PageHeader
        title="Nurse Dashboard"
        description="Manage triage, record vitals, create non-lab bills, and submit medication requests."
      />
      <div className="p-12 text-center text-muted-foreground">Loading nurse workspace...</div>
    </>
  )
}

function NurseDashboardContent() {
  const searchParams = useSearchParams()
  const { hasPermission, isLoading: roleLoading } = useRole()
  const selectedPatientId = searchParams.get('patientId') || ''

  // Mirror the backend guards so oversight roles that can open this page (e.g. ADMIN)
  // only see the tabs whose actions their permissions actually allow.
  const canRecordVitals = !roleLoading && hasPermission('vitals:write')
  const canBill = !roleLoading && hasPermission('billing:invoice:create')
  const canRequestDrugs = !roleLoading && hasPermission('drug_request:create')
  const defaultTab = selectedPatientId && canRecordVitals ? 'vitals' : 'queue'

  return (
    <>
      <PageHeader
        title="Nurse Dashboard"
        description="Manage triage, record vitals, create non-lab bills, and submit medication requests."
      />
      <Tabs key={defaultTab} defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          {canRecordVitals && <TabsTrigger value="vitals">Vitals</TabsTrigger>}
          {canBill && <TabsTrigger value="billing">Billing</TabsTrigger>}
          {canRequestDrugs && <TabsTrigger value="drugs">Drug Requests</TabsTrigger>}
        </TabsList>
        <TabsContent value="queue">
          <TriageQueue />
        </TabsContent>
        {canRecordVitals && (
          <TabsContent value="vitals">
            <NurseVitalsForm initialPatientId={selectedPatientId} />
          </TabsContent>
        )}
        {canBill && (
          <TabsContent value="billing">
            <NurseBilling />
          </TabsContent>
        )}
        {canRequestDrugs && (
          <TabsContent value="drugs">
            <DrugRequestForm />
          </TabsContent>
        )}
      </Tabs>
    </>
  )
}
