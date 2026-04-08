export const metadata = {
  title: 'Claims Workbench | Billing',
  description: 'Manage insurance claims, track submissions, and handle denials.',
}

import { ClaimsWorkbench } from '@/components/billing/ClaimsWorkbench'

export default function ClaimsPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <ClaimsWorkbench />
    </div>
  )
}
