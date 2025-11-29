import { z } from 'zod'
import { vitalSignsSchema } from './patient'

// Consultation schema
export const consultationSchema = z.object({
    patientId: z.string().min(1, 'Patient selection is required'),
    chiefComplaint: z.string().min(3, 'Chief complaint must be at least 3 characters').max(500, 'Chief complaint is too long'),
    history: z.string().optional(),
    diagnosis: z.string().min(3, 'Diagnosis is required').max(1000, 'Diagnosis is too long'),
    examination: z.string().optional(),
    medications: z.string().optional(),
    labTests: z.string().optional(),
    followUp: z.string().optional(),
    vitals: vitalSignsSchema.optional(),
})

export type ConsultationInput = z.infer<typeof consultationSchema>

// Step-by-step validation schemas for wizard
export const consultationStep1Schema = z.object({
    patientId: z.string().min(1, 'Please select a patient'),
})

export const consultationStep2Schema = z.object({
    chiefComplaint: z.string().min(3, 'Chief complaint must be at least 3 characters'),
    history: z.string().optional(),
})

export const consultationStep3Schema = z.object({
    vitals: vitalSignsSchema.optional(),
    examination: z.string().optional(),
})

export const consultationStep4Schema = z.object({
    diagnosis: z.string().min(3, 'Diagnosis is required'),
})

export const consultationStep5Schema = z.object({
    medications: z.string().optional(),
    labTests: z.string().optional(),
    followUp: z.string().optional(),
})
