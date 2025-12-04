import { z } from 'zod'

// Appointment booking schema
export const appointmentSchema = z.object({
    patientId: z.string().min(1, 'Patient is required'),
    doctorId: z.string().min(1, 'Doctor is required'),
    appointmentDate: z.string().min(1, 'Appointment date is required').refine((date) => {
        const appointmentDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return appointmentDate >= today
    }, 'Appointment date cannot be in the past'),
    appointmentTime: z.string().min(1, 'Appointment time is required'),
    type: z.enum(['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY', 'CHECKUP'], {
        message: 'Please select a valid appointment type'
    }),
    reason: z.string().min(5, 'Reason must be at least 5 characters').max(500, 'Reason is too long'),
    notes: z.string().optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
})

export type AppointmentInput = z.infer<typeof appointmentSchema>

// Lab order schema
export const labOrderSchema = z.object({
    patientId: z.string().min(1, 'Patient is required'),
    testType: z.enum(['BLOOD', 'URINE', 'XRAY', 'CT_SCAN', 'MRI', 'ULTRASOUND', 'ECG', 'OTHER'], {
        message: 'Please select a valid test type'
    }),
    testName: z.string().min(2, 'Test name is required').max(200, 'Test name is too long'),
    urgency: z.enum(['ROUTINE', 'URGENT', 'STAT'], {
        message: 'Please select urgency level'
    }),
    clinicalNotes: z.string().min(10, 'Clinical notes must be at least 10 characters').max(1000, 'Clinical notes are too long'),
    instructions: z.string().optional(),
    fasting: z.boolean().optional(),
})

export type LabOrderInput = z.infer<typeof labOrderSchema>

// Prescription schema
export const prescriptionSchema = z.object({
    patientId: z.string().min(1, 'Patient is required'),
    medications: z.array(z.object({
        name: z.string().min(2, 'Medication name is required'),
        dosage: z.string().min(1, 'Dosage is required'),
        frequency: z.string().min(1, 'Frequency is required'),
        duration: z.string().min(1, 'Duration is required'),
        instructions: z.string().optional(),
        quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: 'Quantity must be a positive number'
        }),
    })).min(1, 'At least one medication is required'),
    diagnosis: z.string().min(3, 'Diagnosis is required').max(500, 'Diagnosis is too long'),
    notes: z.string().optional(),
    refillable: z.boolean().optional(),
    refills: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
        message: 'Refills must be a non-negative number'
    }),
})

export type PrescriptionInput = z.infer<typeof prescriptionSchema>

// Single medication schema for dynamic forms
export const medicationItemSchema = z.object({
    name: z.string().min(2, 'Medication name is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    frequency: z.string().min(1, 'Frequency is required'),
    duration: z.string().min(1, 'Duration is required'),
    instructions: z.string().optional(),
    quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Quantity must be a positive number'
    }),
})

export type MedicationItemInput = z.infer<typeof medicationItemSchema>
