'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { NurseBilling } from '@/components/nurse/NurseBilling'
import { DrugRequestForm } from '@/components/nurse/DrugRequestForm'
import { NurseVitalsForm } from '@/components/nurse/NurseVitalsForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function NurseDashboardPage() {
  return (
    <>
      <PageHeader
        title="Nurse Dashboard"
        description="Record admitted-patient vitals, create non-lab bills, and submit medication requests."
      />
      <Tabs defaultValue="vitals" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="drugs">Drug Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="vitals">
          <NurseVitalsForm />
        </TabsContent>
        <TabsContent value="billing">
          <NurseBilling />
        </TabsContent>
        <TabsContent value="drugs">
          <DrugRequestForm />
        </TabsContent>
      </Tabs>
    </>
  )
}
