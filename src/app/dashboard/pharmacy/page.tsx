import { PharmacyDashboard } from '@/components/pharmacy/PharmacyDashboard'
import { DrugRequestQueue } from '@/components/pharmacy/DrugRequestQueue'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function PharmacyPage() {
  return (
    <>
      <PageHeader 
        title="Pharmacy" 
        description="Manage inventory, track stock levels, and dispense medications from prescriptions."
      />
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="requests">Drug Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <PharmacyDashboard />
        </TabsContent>
        <TabsContent value="requests">
          <DrugRequestQueue />
        </TabsContent>
      </Tabs>
    </>
  )
}