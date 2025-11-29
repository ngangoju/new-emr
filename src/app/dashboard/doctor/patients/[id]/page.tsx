'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
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
  Calendar, 
  FileText, 
  Activity, 
  Pill, 
  Microscope,
  Clock,
  AlertCircle,
  Edit
} from 'lucide-react'

import { usePatient, usePatientVitals } from '@/hooks/api/usePatients'
import { useConsultations } from '@/hooks/api/useConsultations'
import { format } from 'date-fns'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, formatDateTime } from '@/lib/utils/date'
import { formatAddress, formatShortAddress } from '@/lib/utils/address'

export default function PatientDetailPage() {
  const params = useParams()
  const id = params.id as string

  // Fetch real patient data
  const { data: patient, isLoading: patientLoading } = usePatient(id)
  const { data: vitals, isLoading: vitalsLoading } = usePatientVitals(id)
  const { data: consultationsData, isLoading: consultationsLoading } = useConsultations({ patientId: id })

  const consultations = consultationsData || []

  // Loading state
  if (patientLoading || vitalsLoading || consultationsLoading) {
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Patient Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-card p-6 rounded-lg border shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} />
            <AvatarFallback className="text-2xl bg-primary/5 text-primary">
              {patient.firstName[0]}{patient.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              {patient.firstName} {patient.lastName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {patient.gender}, {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}y
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {formatShortAddress(patient.address)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            New Consultation
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-12 p-1 bg-muted/50">
          <TabsTrigger value="overview" className="h-10">Overview</TabsTrigger>
          <TabsTrigger value="consultations" className="h-10">Consultations</TabsTrigger>
          <TabsTrigger value="medications" className="h-10">Medications</TabsTrigger>
          <TabsTrigger value="labs" className="h-10">Lab Results</TabsTrigger>
          <TabsTrigger value="documents" className="h-10">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                    <p className="text-sm text-muted-foreground">Blood Pressure</p>
                    <p className="text-2xl font-bold text-foreground">120/80</p>
                    <span className="text-xs text-success flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" /> Normal
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                    <p className="text-sm text-muted-foreground">Heart Rate</p>
                    <p className="text-2xl font-bold text-foreground">72 <span className="text-sm font-normal text-muted-foreground">bpm</span></p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                    <p className="text-sm text-muted-foreground">Temperature</p>
                    <p className="text-2xl font-bold text-foreground">36.5 <span className="text-sm font-normal text-muted-foreground">°C</span></p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="text-2xl font-bold text-foreground">{latestVitals?.weight || '-'} <span className="text-sm font-normal text-muted-foreground">kg</span></p>
                  </div>
                </div>
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
                  <p className="text-sm font-medium text-muted-foreground mb-2">Blood Type</p>
                  <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                    {latestVitals?.bloodType || '-'}
                  </Badge>
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
                    action={{
                      label: "Start Consultation",
                      onClick: () => window.location.href = '/dashboard/doctor/consultations/new'
                    }}
                  />
                ) : (
                  consultations.map((consultation: any) => (
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
                          <Button variant="ghost" size="sm">View Details</Button>
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
            <CardContent className="py-8">
              <EmptyState
                icon={Microscope}
                title="No lab results available"
                description="This patient doesn't have any lab test results yet. Order lab tests during consultations and results will appear here."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="py-8">
              <EmptyState
                icon={FileText}
                title="No documents uploaded"
                description="This patient doesn't have any uploaded documents yet. Medical reports, imaging results, and other documents will appear here."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
