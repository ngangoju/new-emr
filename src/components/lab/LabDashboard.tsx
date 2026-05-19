'use client'

import { useState } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'
import { LabInpatientFollowupList } from '@/components/lab/LabInpatientFollowupList'
import { LabOrderDetailDialog } from '@/components/lab/LabOrderDetailDialog'
import { LabPendingWorklist } from '@/components/lab/LabPendingWorklist'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLabOrderStats } from '@/hooks/useLabOrders'

export function LabDashboard() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const statsQuery = useLabOrderStats()

  const pendingCount = statsQuery.data?.pending ?? 0
  const dueNowCount = statsQuery.data?.followupsDueNow ?? 0

  return (
    <>
      <PageHeader
        title="Lab Dashboard"
        description="Pending exams, inpatient follow-ups, and generic lab result submission workflow."
      />

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full max-w-xl grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <span>Pending Exams</span>
            <Badge variant="secondary">{pendingCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="followups" className="flex items-center gap-2">
            <span>Inpatient Follow-ups</span>
            <Badge variant="secondary">{dueNowCount}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <LabPendingWorklist onViewOrder={setSelectedOrderId} />
        </TabsContent>

        <TabsContent value="followups">
          <LabInpatientFollowupList onViewOrder={setSelectedOrderId} />
        </TabsContent>
      </Tabs>

      <LabOrderDetailDialog
        orderId={selectedOrderId}
        open={Boolean(selectedOrderId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrderId(null)
          }
        }}
      />
    </>
  )
}
