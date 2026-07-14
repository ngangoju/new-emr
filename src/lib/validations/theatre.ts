import { z } from 'zod'

export const scheduleSurgerySchema = z
  .object({
    theatreId: z.string().uuid({ message: 'Select a theatre' }),
    patientId: z.string().uuid({ message: 'Select a patient' }),
    procedureName: z.string().trim().min(3, 'Procedure name is required').max(200),
    surgeonName: z.string().trim().max(150).optional().or(z.literal('')),
    scheduledStart: z.string().min(1, 'Start time is required'),
    scheduledEnd: z.string().optional().or(z.literal('')),
  })
  .refine(
    (v) => !v.scheduledEnd || new Date(v.scheduledEnd) > new Date(v.scheduledStart),
    { message: 'End time must be after start time', path: ['scheduledEnd'] }
  )

export type ScheduleSurgeryFormValues = z.infer<typeof scheduleSurgerySchema>

export const operationNoteSchema = z.object({
  procedurePerformed: z.string().trim().min(3, 'Procedure performed is required'),
  findings: z.string().trim().optional().or(z.literal('')),
  anesthesiaType: z.string().trim().max(80).optional().or(z.literal('')),
  estimatedBloodLossMl: z
    .string()
    .regex(/^\d*$/, 'Must be a whole number')
    .optional()
    .or(z.literal('')),
  countsConfirmed: z.boolean(),
  complications: z.string().trim().optional().or(z.literal('')),
  postopInstructions: z.string().trim().optional().or(z.literal('')),
})

export type OperationNoteFormValues = z.infer<typeof operationNoteSchema>
