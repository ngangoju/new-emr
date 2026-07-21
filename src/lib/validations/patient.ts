import { z } from 'zod'

// Patient registration schema
export const patientRegistrationSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name is too long'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name is too long'),
    dateOfBirth: z.string().min(1, 'Date of birth is required').refine((date) => {
        const dob = new Date(date)
        const today = new Date()
        return dob < today
    }, 'Date of birth must be in the past'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { message: 'Gender is required' }),
    phone: z.string()
        .min(10, 'Phone number must be at least 10 characters')
        .regex(/^[\d\s\-+()]*$/, 'Invalid phone number format'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    address: z.string().optional(),
    nationalId: z.string().optional(),
    insurance: z.string().optional(),
    insuranceCard: z.string().optional(),
    copayPercentage: z.string()
        .optional()
        .refine((val) => !val || (parseFloat(val) >= 0 && parseFloat(val) <= 100),
            'Copayment must be between 0 and 100%'),
    allergies: z.string().optional(),
    emergencyContact: z.string().optional(),
})

export type PatientRegistrationInput = z.infer<typeof patientRegistrationSchema>

// Vital signs schema
export const vitalSignsSchema = z.object({
    temperature: z.string()
        .optional()
        .refine((val) => !val || (parseFloat(val) >= 30 && parseFloat(val) <= 45),
            'Temperature must be between 30°C and 45°C'),
    bloodPressure: z.string()
        .optional()
        .refine((val) => !val || /^\d{2,3}\/\d{2,3}$/.test(val),
            'Blood pressure must be in format: 120/80'),
    heartRate: z.string()
        .optional()
        .refine((val) => !val || (parseFloat(val) >= 30 && parseFloat(val) <= 250),
            'Heart rate must be between 30 and 250 bpm'),
    weight: z.string()
        .optional()
        .refine((val) => !val || (parseFloat(val) > 0 && parseFloat(val) <= 500),
            'Weight must be between 0 and 500 kg'),
    height: z.string()
        .optional()
        .refine((val) => !val || (parseFloat(val) > 0 && parseFloat(val) <= 300),
            'Height must be between 0 and 300 cm'),
})

export type VitalSignsInput = z.infer<typeof vitalSignsSchema>
