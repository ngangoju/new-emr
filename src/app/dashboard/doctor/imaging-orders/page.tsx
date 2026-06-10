'use client'

// TODO: This is temporary scaffolding for development verification.
// Production flow: imaging orders should be created from within encounter/consultation context,
// not from a standalone dashboard. Replace with encounter-linked CreateImagingOrderModal integration.

import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateImagingOrderModal } from '@/components/radiology/CreateImagingOrderModal'
import { PatientSelector } from '@/components/shared/PatientSelector'
import { Patient } from '@/hooks/api/usePatients'
import { Image as Plus, Activity, UserSearch } from 'lucide-react'

export default function ImagingOrdersPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Imaging Orders"
        description="Create and manage diagnostic imaging requests"
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Order Imaging Study
            </CardTitle>
            <CardDescription>
              Request diagnostic imaging for your patients during consultations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-2">Clinical Best Practice</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Provide detailed clinical indication (minimum 20 characters required)</li>
                  <li>Specify anatomical region and relevant clinical history</li>
                  <li>Select appropriate priority based on clinical urgency</li>
                  <li>Include relevant lab findings or prior imaging comparisons</li>
                </ul>
              </div>

              <div className="pt-2">
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <UserSearch className="h-4 w-4" /> Select Patient Context
                </label>
                <PatientSelector 
                  selectedPatientId={selectedPatient?.id} 
                  onSelect={(patient) => setSelectedPatient(patient)} 
                />
              </div>

              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto mt-4"
                disabled={!selectedPatient}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Imaging Order for {selectedPatient ? selectedPatient.firstName : 'Patient'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-700 rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Doctor Creates Order</h4>
                  <p className="text-xs text-muted-foreground">Specify modality, body part, priority, and clinical indication</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-700 rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Tech Acquires Images</h4>
                  <p className="text-xs text-muted-foreground">Order appears in radiology worklist sorted by priority</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-700 rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Radiologist Reports</h4>
                  <p className="text-xs text-muted-foreground">Findings, impression, and recommendations documented</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-700 rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Automatic Billing</h4>
                  <p className="text-xs text-muted-foreground">Invoice generated from tariff table on radiologist sign-off</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedPatient && (
        <CreateImagingOrderModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          patientId={selectedPatient.id}
          patientName={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
        />
      )}
    </div>
  )
}
