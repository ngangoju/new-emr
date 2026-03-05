'use client'

import React, { use } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useConsultation, useSignConsultation, useUpdateConsultation } from '@/hooks/api/useConsultations'
import { formatDate } from '@/lib/utils/date'
import { Stethoscope, Clock, FileText, Activity, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Edit, Save, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Input } from '@/components/ui/input'

export default function ConsultationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  // Extract id from the new Next.js 15 params Promise
  const resolvedParams = use(params)
  const id = resolvedParams.id
  
  const { data: consultation, isLoading, isError } = useConsultation(id)
  const signMutation = useSignConsultation()
  const updateMutation = useUpdateConsultation()

  const [isEditing, setIsEditing] = React.useState(false)
  const [formData, setFormData] = React.useState({
    presentingComplaint: '',
    notes: '',
    diagnosis: ''
  })

  // Initialize form data when consultation loads
  React.useEffect(() => {
    if (consultation) {
      setFormData({
        presentingComplaint: consultation.presentingComplaint || '',
        notes: consultation.notes || '',
        diagnosis: consultation.diagnosis || ''
      })
    }
  }, [consultation])

  const handleSign = async () => {
    try {
      await signMutation.mutateAsync(id)
      toast.success('Consultation successfully signed and finalized')
    } catch (error) {
      toast.error('Failed to sign consultation')
    }
  }

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id, data: formData })
      setIsEditing(false)
      toast.success('Consultation updated successfully')
    } catch (error) {
      toast.error('Failed to update consultation')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <PageHeader title="Consultation Details" description="Loading consultation..." />
        <Card className="animate-pulse h-64 bg-muted/20" />
      </div>
    )
  }

  if (isError || !consultation) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <PageHeader title="Consultation Details" description="Error" />
        <Card className="border-destructive/50">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Consultation Not Found</h3>
              <p className="text-muted-foreground">The consultation record you're looking for could not be loaded or does not exist.</p>
            </div>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/dashboard/doctor/consultations"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Consultations</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-full h-8 w-8">
          <Link href={`/dashboard/doctor/patients/${consultation.patientId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          title={`Consultation Details`}
          description={consultation.patientName ? `Patient: ${consultation.patientName}` : `Record ID: ${consultation.id}`}
        />
        <div className="ml-auto">
          <Badge variant={consultation.status === 'FINALIZED' ? 'default' : consultation.status === 'DRAFT' ? 'secondary' : 'outline'} className="text-sm px-3 py-1">
            {consultation.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Clinical Notes
                </div>
                {consultation.status === 'DRAFT' && !isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-3 w-3 mr-2" /> Edit Notes
                  </Button>
                )}
                {isEditing && (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                      <X className="h-3 w-3 mr-2" /> Cancel
                    </Button>
                    <Button variant="default" size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                      <Save className="h-3 w-3 mr-2" /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Presenting Complaint</h4>
                  {isEditing ? (
                    <Textarea 
                      value={formData.presentingComplaint}
                      onChange={(e) => setFormData({...formData, presentingComplaint: e.target.value})}
                      placeholder="Enter patient's presenting complaint..."
                      className="min-h-[100px]"
                    />
                  ) : (
                    <div className="p-4 bg-muted/20 rounded-md border text-sm min-h-[80px] whitespace-pre-wrap">
                      {consultation.presentingComplaint || 'No presenting complaint recorded.'}
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Consultation Notes</h4>
                  {isEditing ? (
                    <Textarea 
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Enter detailed consultation notes..."
                      className="min-h-[200px]"
                    />
                  ) : (
                    <div className="p-4 bg-muted/20 rounded-md border text-sm min-h-[150px] whitespace-pre-wrap">
                      {consultation.notes || 'No notes available.'}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-sm text-foreground/80 mb-2">Diagnosis</h4>
                  {isEditing ? (
                    <Input 
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                      placeholder="ICD-10 Code or Description..."
                    />
                  ) : consultation.diagnosis ? (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-md text-sm whitespace-pre-wrap font-medium">
                      {consultation.diagnosis}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">No diagnosis recorded.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Visit Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Date & Time</span>
                <span className="font-medium">{formatDate(consultation.createdAt, 'PPP p')}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Doctor</span>
                <span className="font-medium">Dr. {consultation.doctorName || 'Unknown'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Visit Type</span>
                <span className="font-medium capitalize">{consultation.type?.toLowerCase() || 'General Consultation'}</span>
              </div>
              <div className="flex flex-col gap-1 w-full mt-4">
                {consultation.status === 'DRAFT' && (
                  <Button 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    onClick={handleSign}
                    disabled={signMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {signMutation.isPending ? 'Signing...' : 'Finalize & Sign'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
