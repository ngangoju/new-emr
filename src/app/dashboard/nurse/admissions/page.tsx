'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { AdmissionForm } from '@/components/nurse/AdmissionForm'
import { PatientAdmissionList } from '@/components/nurse/PatientAdmissionList'
import { UserCheck, BedDouble } from 'lucide-react'

export default function NurseAdmissionsPage() {
  const [activeTab, setActiveTab] = useState('admit')

  const handleAdmissionSuccess = () => {
    // Switch to the inpatients tab after successful admission
    setActiveTab('inpatients')
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Hospital Admissions"
        description="Manage patient admissions, discharges, and transfers"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="admit" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Admit Patient
          </TabsTrigger>
          <TabsTrigger value="inpatients" className="flex items-center gap-2">
            <BedDouble className="h-4 w-4" />
            Current Inpatients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admit" className="mt-6">
          <div className="max-w-2xl">
            <AdmissionForm onSuccess={handleAdmissionSuccess} />
          </div>
        </TabsContent>

        <TabsContent value="inpatients" className="mt-6">
          <PatientAdmissionList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
