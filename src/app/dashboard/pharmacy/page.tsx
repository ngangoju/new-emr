import { PharmacyDashboard } from '@/components/pharmacy/PharmacyDashboard'
import { PageHeader } from '@/components/layout/PageHeader'

export default function PharmacyPage() {
  return (
    <>
      <PageHeader 
        title="Pharmacy" 
        description="Manage inventory, track stock levels, and dispense medications from prescriptions."
      />
      <PharmacyDashboard />
    </>
  )
}