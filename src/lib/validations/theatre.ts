import { z } from 'zod'

// === Schedule surgery ===
// Backend CreateTheatreCaseDto requires: theatreId, surgeonId, anaesthetistId?,
// patientId, admissionId, procedureName, scheduledStart, scheduledEnd.

export const scheduleSurgerySchema = z
  .object({
    theatreId: z.string().uuid({ message: 'Select a theatre' }),
    surgeonId: z.string().uuid({ message: 'Select a surgeon' }),
    anaesthetistId: z.union([z.string().uuid(), z.literal('')]).optional(),
    patientId: z.string().uuid({ message: 'Select a patient' }),
    admissionId: z.string().uuid({ message: 'Select an admission' }),
    procedureName: z.string().trim().min(3, 'Procedure name is required').max(200),
    procedureCode: z.string().trim().max(40).optional().or(z.literal('')),
    notes: z.string().trim().optional().or(z.literal('')),
    scheduledStart: z.string().min(1, 'Start time is required'),
    scheduledEnd: z.string().min(1, 'End time is required'),
  })
  .refine(
    (v) => new Date(v.scheduledEnd) > new Date(v.scheduledStart),
    { message: 'End time must be after start time', path: ['scheduledEnd'] }
  )

export type ScheduleSurgeryFormValues = z.infer<typeof scheduleSurgerySchema>

// === Operation note ===
// Backend OperationNoteDto requires: caseId, procedure, countsConfirmed.

export const operationNoteSchema = z.object({
  procedure: z.string().trim().min(3, 'Procedure performed is required'),
  findings: z.string().trim().optional().or(z.literal('')),
  anesthesiaNotes: z.string().trim().optional().or(z.literal('')),
  bloodLossMl: z
    .number({ error: 'Must be a whole number' })
    .int()
    .nonnegative()
    .optional()
    .or(z.nan().transform(() => undefined)),
  countsConfirmed: z.boolean().refine((v) => v === true, {
    message: 'Counts must be confirmed before saving the note',
  }),
})

export type OperationNoteFormValues = z.infer<typeof operationNoteSchema>

// === Checklist stage (rolled-up advance) ===

export const checklistStageSchema = z.object({
  stage: z.enum(['SIGN_IN', 'TIME_OUT', 'SIGN_OUT']),
})

export type ChecklistStageFormValues = z.infer<typeof checklistStageSchema>

// === Create post-op order ===

export const createPostOpOrderSchema = z.object({
  orderType: z.enum(['MEDICATION', 'INVESTIGATION', 'PROCEDURE']),
  consultationId: z.union([z.string().uuid(), z.literal('')]).optional(),
  medicationRequestId: z.union([z.string().uuid(), z.literal('')]).optional(),
})

export type CreatePostOpOrderFormValues = z.infer<typeof createPostOpOrderSchema>
