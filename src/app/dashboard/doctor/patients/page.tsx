'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  FileText, 
  Edit, 
  UserPlus,
  Calendar,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import { usePatients, useCreatePatient, type Patient } from '@/hooks/api/usePatients'
import toast from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { patientRegistrationSchema, type PatientRegistrationInput } from '@/lib/validations/patient'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 500)
  const [filterGender, setFilterGender] = useState('all')
  const [filterInsurance, setFilterInsurance] = useState('all')
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false)

  // React Hook Form with Zod validation
  const form = useForm<PatientRegistrationInput>({
    resolver: zodResolver(patientRegistrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'Male',
      phone: '',
      email: '',
      address: '',
      nationalId: '',
      insurance: '',
      insuranceCard: '',
      allergies: '',
      emergencyContact: '',
    },
  })

  // Fetch patients with search and filters
  const { data: patientsData, isLoading } = usePatients({
    query: debouncedQuery,
    gender: filterGender !== 'all' ? filterGender : undefined,
  })

  const createPatientMutation = useCreatePatient()

  const patients = patientsData?.data || []

  // Client-side insurance filter (if not supported by backend)
  const filteredPatients = patients.filter((patient: Patient) => {
    if (filterInsurance === 'all') return true
    return patient.insurance?.type === filterInsurance || patient.insurance === filterInsurance
  })

  const handleRegisterPatient = (data: PatientRegistrationInput) => {
    // Transform data to match backend expectations
    const payload: any = {
      ...data,
      // Convert comma-separated allergies to array
      allergies: data.allergies 
        ? data.allergies.split(',').map(a => a.trim()).filter(Boolean)
        : [],
    }

    createPatientMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Patient registered successfully!')
        setIsRegisterDialogOpen(false)
        form.reset()
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to register patient')
      }
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Patient Management"
        description="Search, view, and manage patient records"
      />

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger className="w-[150px] h-11">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterInsurance} onValueChange={setFilterInsurance}>
                <SelectTrigger className="w-[150px] h-11">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Insurance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Insurance</SelectItem>
                  <SelectItem value="MMI">MMI</SelectItem>
                  <SelectItem value="RAMA">RAMA</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                </SelectContent>
              </Select>

              {/* Register New Patient Button */}
              <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-11 bg-primary hover:bg-primary/90">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register Patient
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-heading">Register New Patient</DialogTitle>
                    <DialogDescription>
                      Fill in the patient's information to create a new record
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleRegisterPatient)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="John" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="nationalId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>National ID</FormLabel>
                              <FormControl>
                                <Input placeholder="1199780012345" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number *</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="+250 788 123 456" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="patient@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input placeholder="Kigali, Gasabo District" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="insurance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Insurance</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select insurance" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="MMI">MMI</SelectItem>
                                  <SelectItem value="RAMA">RAMA</SelectItem>
                                  <SelectItem value="Private">Private</SelectItem>
                                  <SelectItem value="None">None</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="insuranceCard"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Insurance Card Number</FormLabel>
                              <FormControl>
                                <Input placeholder="123456789" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="allergies"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Known Allergies</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Penicillin, Peanuts" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="emergencyContact"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Emergency Contact</FormLabel>
                              <FormControl>
                                <Input placeholder="Name - Phone Number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setIsRegisterDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createPatientMutation.isPending}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          {createPatientMutation.isPending ? 'Registering...' : 'Register Patient'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredPatients.length}</span> of{' '}
            <span className="font-semibold text-foreground">{patients.length}</span> patients
          </div>
        </CardContent>
      </Card>

      {/* Patient Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>

                  <TableHead>Full Name</TableHead>
                  <TableHead>Age / Gender</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-10 w-10 rounded-full bg-muted animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-32 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-6 w-16 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-6 w-16 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-8 w-20 bg-muted rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-[400px] text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                          <Search className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No patients found</h3>
                        <p className="text-muted-foreground max-w-sm">
                          We couldn't find any patients matching your search criteria. Try adjusting your filters or register a new patient.
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => {
                            setSearchQuery('')
                            setFilterGender('all')
                            setFilterInsurance('all')
                          }}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient: Patient) => (
                    <TableRow key={patient.id} className="hover:bg-accent/50 transition-colors">

                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary/20 to-accent/20 text-primary font-semibold">
                            {patient.firstName[0]}{patient.lastName[0]}
                          </div>
                          <span className="font-medium">{patient.firstName} {patient.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{patient.age} years</span>
                          <span className="text-muted-foreground"> • {patient.gender}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{patient.phone}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{patient.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {patient.insurance?.provider || 'None'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>{patient.lastVisit ? format(new Date(patient.lastVisit), 'MMM dd, yyyy') : 'N/A'}</span>
                          </div>
                          {patient.nextAppointment && (
                            <div className="text-xs text-muted-foreground">
                              Next: {format(new Date(patient.nextAppointment), 'MMM dd')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                          {patient.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Link href={`/dashboard/doctor/patients/${patient.id}`}>
                            <Button variant="ghost" size="sm" title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" title="View Medical Records">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Edit Patient">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}