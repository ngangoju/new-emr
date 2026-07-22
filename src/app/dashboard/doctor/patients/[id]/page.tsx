'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Activity, 
  Pill, 
  Microscope,
  Edit,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

import { usePatient, usePatientVitals, useUpdatePatient, usePatientLabResults, usePatientHistory, type Patient, type PatientLabResult } from '@/hooks/api/usePatients'
import { useConsultations, type Consultation } from '@/hooks/api/useConsultations'
import { useCreateEncounter } from '@/hooks/api/useEncounters'
import { PatientSnapshotCard } from '@/components/patient/PatientSnapshotCard'
import { PatientAiSnapshotCard } from '@/components/patient/PatientAiSnapshotCard'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, formatDateTime } from '@/lib/utils/date'
import { formatPatientAge } from '@/lib/utils/date'
import { formatAddress, formatShortAddress } from '@/lib/utils/address'
import { useState } from 'react'
import { useRole } from '@/hooks/useRole'
import toast from 'react-hot-toast'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DoctorTreatmentWorkspace } from '@/components/doctor/DoctorTreatmentWorkspace'
import { usePatientImagingOrders, useImagingResult, useDicomImages, useDicomImagePresignedUrl } from '@/hooks/useImaging'
import type { ImagingOrder } from '@/types/imaging'

type ConsultationView = Consultation & {
  doctorName?: string
  type?: string
  notes?: string
}

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params.id as string
  const { hasPermission } = useRole()
  const canEditPatient = hasPermission('CAN_REGISTER_PATIENT') || hasPermission('patient:update') || hasPermission('patient:demographics:edit')
  const canStartVisit = hasPermission('CAN_REGISTER_PATIENT') || hasPermission('encounter:create')
  const canCreateConsultation = hasPermission('CAN_PRESCRIBE') || hasPermission('consultation:create') || hasPermission('prescription:create')

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<Patient>>({})
  const [historyPage, setHistoryPage] = useState(0)
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)

  // Fetch real patient data
  const { data: patient, isLoading: patientLoading } = usePatient(id)
  const { data: vitals, isLoading: vitalsLoading } = usePatientVitals(id)
  const { data: labResults = [], isLoading: labResultsLoading } = usePatientLabResults(id)
  const { data: history, isLoading: historyLoading, isError: historyError } = usePatientHistory(id, historyPage, 20)
  const { data: imagingOrders = [], isLoading: imagingLoading } = usePatientImagingOrders(id)
  const { data: consultationsData, isLoading: consultationsLoading } = useConsultations({ patientId: id })
  const updatePatientMutation = useUpdatePatient()

  const consultations: ConsultationView[] = (consultationsData || []) as ConsultationView[]
  const sortedConsultations = [...consultations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const latestConsultation = sortedConsultations[0]
  const initialTab = searchParams.get('tab') || 'overview'
  const createEncounterMutation = useCreateEncounter()

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response
      const message = response?.data?.message
      if (typeof message === 'string' && message.trim().length > 0) {
        return message
      }
    }
    return fallback
  }

  // Loading state
  if (patientLoading || vitalsLoading || consultationsLoading || labResultsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!patient) return <div>Patient not found</div>

  // Helper to safely access nested data
  const latestVitals = Array.isArray(vitals) ? vitals[0] : vitals
  const insurance = patient.insurance || {}
  const emergencyContact = patient.emergencyContact || {}
  
  // Safely convert allergies and conditions to arrays
  const getAllergies = () => {
    if (!patient.allergies) return []
    if (Array.isArray(patient.allergies)) return patient.allergies
    if (typeof patient.allergies === 'string') return (patient.allergies as string).split(',').map((a) => a.trim()).filter(Boolean)
    return []
  }
  
  const getConditions = () => {
    if (!patient.conditions) return []
    if (Array.isArray(patient.conditions)) return patient.conditions
    if (typeof patient.conditions === 'string') return (patient.conditions as string).split(',').map((c) => c.trim()).filter(Boolean)
    return []
  }
  
  const allergies = getAllergies()
  const conditions = getConditions()

  const handleEditProfile = () => {
    setEditFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      nationalId: patient.nationalId || '',
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email || '',
      address: patient.address || '',
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateProfile = () => {
    updatePatientMutation.mutate(
      { id, data: editFormData },
      {
        onSuccess: () => {
          toast.success('Profile updated successfully!')
          setIsEditDialogOpen(false)
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error, 'Failed to update profile'))
        }
      }
    )
  }

  const handleNewConsultation = () => {
    router.push(`/dashboard/doctor/consultations/new?patientId=${id}`)
  }

  const handleStartVisit = () => {
    createEncounterMutation.mutate({
      patientId: id,
      type: 'CONSULTATION'
    }, {
      onSuccess: (data) => {
        toast.success('Visit started! Moving to Triage.')
        router.push(`/dashboard/doctor/consultations/new?patientId=${id}&encounterId=${data.id}`)
      },
      onError: (error: unknown) => {
        toast.error(getErrorMessage(error, 'Failed to start visit'))
      }
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Patient Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-card p-6 rounded-lg border shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} />
            <AvatarFallback className="text-2xl bg-primary/5 text-primary">
              {patient.firstName?.[0] ?? '?'}{patient.lastName?.[0] ?? ''}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              {patient.firstName} {patient.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {patient.gender}, {formatPatientAge(patient.dateOfBirth)}y
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {formatShortAddress(patient.address)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canEditPatient && (
            <Button variant="outline" onClick={handleEditProfile}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
          
          {canStartVisit && (
            <Button
              onClick={handleStartVisit}
              disabled={createEncounterMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Activity className="h-4 w-4 mr-2" />
              {createEncounterMutation.isPending ? 'Starting...' : 'Start Visit'}
            </Button>
          )}

          {canCreateConsultation && (
            <Button variant="outline" onClick={handleNewConsultation}>
              <FileText className="h-4 w-4 mr-2" />
              New Consultation
            </Button>
          )}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Patient Profile</DialogTitle>
            <DialogDescription>
              Update basic information for {patient.firstName} {patient.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editFormData.firstName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editFormData.lastName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nationalId">National ID</Label>
              <Input
                id="nationalId"
                value={editFormData.nationalId || ''}
                onChange={(e) => setEditFormData({ ...editFormData, nationalId: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={editFormData.dateOfBirth || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={editFormData.gender || ''} 
                  onValueChange={(value) => setEditFormData({ ...editFormData, gender: value })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editFormData.phone || ''}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email || ''}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editFormData.address || ''}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateProfile} disabled={updatePatientMutation.isPending}>
              {updatePatientMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content Tabs */}
      <Tabs defaultValue={initialTab} className="space-y-4">
        <TabsList className="h-12 p-1 bg-muted/50">
          <TabsTrigger value="overview" className="h-10">Overview</TabsTrigger>
          <TabsTrigger value="consultations" className="h-10">Consultations</TabsTrigger>
          <TabsTrigger value="medications" className="h-10">Medications</TabsTrigger>
          <TabsTrigger value="labs" className="h-10">Lab Results</TabsTrigger>
          <TabsTrigger value="radiology" className="h-10">Radiology</TabsTrigger>
          <TabsTrigger value="history" className="h-10">Medical History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PatientSnapshotCard patientId={patient.id} patientName={`${patient.firstName} ${patient.lastName}`} />
            <PatientAiSnapshotCard patientId={patient.id} patientName={`${patient.firstName} ${patient.lastName}`} />
          </div>

          <DoctorTreatmentWorkspace
            patientId={patient.id}
            patientName={`${patient.firstName} ${patient.lastName}`}
            consultationId={latestConsultation?.id}
            consultationStatus={latestConsultation?.status}
            consultationNotes={latestConsultation?.notes}
            context="patient"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Vitals & Stats */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Vitals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestVitals ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                        <p className="text-sm text-muted-foreground">Blood Pressure</p>
                        <p className="text-2xl font-bold text-foreground">{latestVitals?.bloodPressure || '-'}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                        <p className="text-sm text-muted-foreground">Heart Rate</p>
                        <p className="text-2xl font-bold text-foreground">{latestVitals?.heartRate || '-'} <span className="text-sm font-normal text-muted-foreground">bpm</span></p>
                      </div>
                      <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                        <p className="text-sm text-muted-foreground">Temperature</p>
                        <p className="text-2xl font-bold text-foreground">{latestVitals?.temperature || '-'} <span className="text-sm font-normal text-muted-foreground">°C</span></p>
                      </div>
                      <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                        <p className="text-sm text-muted-foreground">Weight</p>
                        <p className="text-2xl font-bold text-foreground">{latestVitals?.weight || '-'} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vitals recorded at {latestVitals?.recordedAt ? formatDateTime(latestVitals.recordedAt) : 'Unknown time'}
                    </p>
                  </div>
                ) : (
                  <EmptyState
                    icon={Activity}
                    title="No vitals recorded yet"
                    description="Nurse-recorded vitals will appear here once captured."
                  />
                )}
              </CardContent>
            </Card>

            {/* Key Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Medical Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {allergies.map((allergy: string) => (
                      <Badge key={allergy} variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
                        {allergy}
                      </Badge>
                    ))}
                    {allergies.length === 0 && <span className="text-sm text-muted-foreground">No known allergies</span>}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Chronic Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {conditions.map((condition: string) => (
                      <Badge key={condition} variant="secondary">
                        {condition}
                      </Badge>
                    ))}
                    {conditions.length === 0 && <span className="text-sm text-muted-foreground">No chronic conditions</span>}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Latest Triage Note</p>
                  <p className="text-sm text-foreground">
                    {latestVitals?.triageNote || 'No triage note recorded'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{formatAddress(patient.address)}</span>
                </div>
                <div className="pt-4 border-t">
                  <p className="font-medium mb-2">Emergency Contact</p>
                  {emergencyContact.name ? (
                    <>
                      <p>{emergencyContact.name} ({emergencyContact.relation})</p>
                      <p className="text-muted-foreground">{emergencyContact.phone}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No emergency contact</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Insurance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Insurance Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium">{insurance.provider || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Policy Number</span>
                  <span className="font-mono">{insurance.number || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Expiry Date</span>
                  <span>{insurance.expiry || '-'}</span>
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 w-full justify-center">
                    Active Coverage
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Consultations Tab */}
        <TabsContent value="consultations">
          <Card>
            <CardHeader>
              <CardTitle>Consultation History</CardTitle>
              <CardDescription>Past visits and medical notes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {consultations.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No consultations yet"
                    description="This patient hasn't had any consultations recorded. Start a new consultation to create the first medical record."
                    action={canCreateConsultation ? {
                      label: "Start Consultation",
                      onClick: () => window.location.href = '/dashboard/doctor/consultations/new'
                    } : undefined}
                  />
                ) : (
                  sortedConsultations.map((consultation) => (
                    <div key={consultation.id} className="flex gap-4 pb-8 border-b last:border-0 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {formatDate(consultation.createdAt, 'MMM')}
                        </div>
                        <div className="text-xs font-medium mt-1">{formatDate(consultation.createdAt, 'dd')}</div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-foreground">Consultation</h4>
                            <p className="text-sm text-muted-foreground">Dr. {consultation.doctorName} • {consultation.type || 'General'}</p>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/doctor/consultations/${consultation.id}`}>View Details</Link>
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {consultation.notes || 'No notes available'}
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">{consultation.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs placeholders */}
        <TabsContent value="medications">
          <Card>
            <CardContent className="py-8">
              <EmptyState
                icon={Pill}
                title="No medications prescribed"
                description="This patient doesn't have any active prescriptions. Medications prescribed during consultations will appear here."
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="labs">
          <Card>
            <CardHeader>
              <CardTitle>Lab Results</CardTitle>
              <CardDescription>Completed and processed lab orders for this patient</CardDescription>
            </CardHeader>
            <CardContent className="py-2">
              {labResultsLoading ? (
                <p className="text-sm text-muted-foreground">Loading lab results...</p>
              ) : labResults.length === 0 ? (
                <EmptyState
                  icon={Microscope}
                  title="No lab results available"
                  description="This patient doesn't have any lab test results yet. Order lab tests during consultations and results will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {labResults.map((result: PatientLabResult) => (
                    <div key={result.orderId} className="rounded-md border p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Lab Order #{String(result.orderId).slice(0, 8)}</p>
                        <Badge variant="secondary">{result.status}</Badge>
                      </div>
                      {result.orderedAt ? (
                        <p className="text-xs text-muted-foreground mt-1">Ordered: {formatDateTime(result.orderedAt)}</p>
                      ) : null}
                      {result.tests ? (
                        <p className="text-sm mt-2">
                          <span className="font-medium">Tests:</span> {result.tests}
                        </p>
                      ) : null}
                      {result.results ? (
                        <p className="text-sm mt-1 break-words">
                          <span className="font-medium">Results:</span> {result.results}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="radiology">
          <Card>
            <CardHeader>
              <CardTitle>Radiology</CardTitle>
              <CardDescription>Imaging studies and result files for this patient</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {imagingLoading ? (
                <p className="text-sm text-muted-foreground">Loading imaging studies...</p>
              ) : imagingOrders.length === 0 ? (
                <EmptyState
                  icon={ImageIcon}
                  title="No imaging studies on record"
                  description="Radiology orders will appear here when they are placed for this patient."
                />
              ) : (
                imagingOrders.map((order) => (
                  <RadiologyOrderCard key={order.id} order={order} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
              <CardDescription>Unified timeline of consultations, labs, vitals, prescriptions, and imaging.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {historyLoading ? (
                <p className="text-sm text-muted-foreground">Loading medical history...</p>
              ) : historyError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  Failed to load patient history. Refresh and try again.
                </div>
              ) : !history?.timeline?.length ? (
                <EmptyState
                  icon={FileText}
                  title="No medical history yet"
                  description="Timeline entries will appear here as clinical activity is recorded."
                />
              ) : (
                <>
                  <div className="space-y-3">
                    {history.timeline.map((entry) => (
                      <div key={entry.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Badge variant="outline">{entry.type}</Badge>
                            <p className="mt-2 font-medium">{entry.summary}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedHistoryId((current) => current === entry.id ? null : entry.id)}
                          >
                            View
                          </Button>
                        </div>
                        {expandedHistoryId === entry.id && (
                          <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                            {JSON.stringify(entry.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setHistoryPage((current) => Math.max(current - 1, 0))}
                      disabled={!history.meta?.hasPrevious}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Page {(history.meta?.page ?? 0) + 1} of {history.meta?.totalPages || 1}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setHistoryPage((current) => current + 1)}
                      disabled={!history.meta?.hasNext}
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RadiologyOrderCard({ order }: { order: ImagingOrder }) {
  const { data: result } = useImagingResult(order.id)
  const { data: images = [] } = useDicomImages(result?.id || '')
  const firstImageId = images[0]?.id || ''
  const { data: presigned } = useDicomImagePresignedUrl(firstImageId)

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{order.imagingType}{order.bodyPart ? ` - ${order.bodyPart}` : ''}</p>
          <p className="text-xs text-muted-foreground">
            Ordered: {order.orderedAt ? formatDateTime(order.orderedAt) : 'Unknown'}
          </p>
          <p className="text-sm mt-2">Status: {order.status}</p>
        </div>
        {presigned?.url ? (
          <Button asChild variant="outline" size="sm">
            <a href={presigned.url} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Images
            </a>
          </Button>
        ) : (
          <Badge variant="secondary">{result ? 'Images pending' : 'Result pending'}</Badge>
        )}
      </div>
    </div>
  )
}
