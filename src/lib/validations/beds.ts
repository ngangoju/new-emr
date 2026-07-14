import { z } from 'zod'

export const bedTransferSchema = z.object({
  admissionId: z.string().uuid({ message: 'Select the patient to transfer' }),
  targetWardId: z.string().uuid({ message: 'Select a target ward' }),
  toBedId: z.string().uuid({ message: 'Select an available bed' }),
  reason: z
    .string()
    .trim()
    .max(500, 'Reason must be 500 characters or fewer')
    .optional()
    .or(z.literal('')),
})

export type BedTransferFormValues = z.infer<typeof bedTransferSchema>
