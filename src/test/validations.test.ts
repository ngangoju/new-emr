import { describe, it, expect } from 'vitest'
import { patientRegistrationSchema, vitalSignsSchema } from '@/lib/validations/patient'
import { consultationSchema } from '@/lib/validations/consultation'
import { loginSchema } from '@/lib/validations/auth'
import { appointmentSchema, labOrderSchema, prescriptionSchema } from '@/lib/validations/medical'

describe('Patient Validation Schemas', () => {
    describe('patientRegistrationSchema', () => {
        it('should validate a valid patient registration', () => {
            const validData = {
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '1990-01-01',
                gender: 'Male' as const,
                phone: '+250788123456',
                email: 'john@example.com',
                address: 'Kigali, Rwanda',
            }

            const result = patientRegistrationSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('should reject invalid phone number', () => {
            const invalidData = {
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '1990-01-01',
                gender: 'Male' as const,
                phone: 'invalid-phone',
            }

            const result = patientRegistrationSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })

        it('should reject future date of birth', () => {
            const futureDate = new Date()
            futureDate.setFullYear(futureDate.getFullYear() + 1)

            const invalidData = {
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: futureDate.toISOString().split('T')[0],
                gender: 'Male' as const,
                phone: '+250788123456',
            }

            const result = patientRegistrationSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })

    describe('vitalSignsSchema', () => {
        it('should validate valid vital signs', () => {
            const validData = {
                temperature: '37.5',
                bloodPressure: '120/80',
                heartRate: '72',
                weight: '70.5',
                height: '175',
            }

            const result = vitalSignsSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('should reject invalid blood pressure format', () => {
            const invalidData = {
                bloodPressure: '120-80', // Wrong format
            }

            const result = vitalSignsSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })
})

describe('Consultation Validation Schema', () => {
    it('should validate a valid consultation', () => {
        const validData = {
            patientId: '123e4567-e89b-12d3-a456-426614174000',
            chiefComplaint: 'Headache for 3 days',
            diagnosis: 'Migraine',
            history: 'Patient reports severe headache',
        }

        const result = consultationSchema.safeParse(validData)
        expect(result.success).toBe(true)
    })

    it('should reject consultation without patient ID', () => {
        const invalidData = {
            chiefComplaint: 'Headache',
            diagnosis: 'Migraine',
        }

        const result = consultationSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
    })
})

describe('Auth Validation Schema', () => {
    it('should validate valid login credentials', () => {
        const validData = {
            username: 'doctor1',
            password: 'password123',
            role: 'DOCTOR',
        }

        const result = loginSchema.safeParse(validData)
        expect(result.success).toBe(true)
    })

    it('should reject empty credentials', () => {
        const invalidData = {
            username: '',
            password: '',
            role: '',
        }

        const result = loginSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
    })
})

describe('Medical Validation Schemas', () => {
    describe('appointmentSchema', () => {
        it('should validate a valid appointment', () => {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)

            const validData = {
                patientId: '123e4567-e89b-12d3-a456-426614174000',
                doctorId: '123e4567-e89b-12d3-a456-426614174001',
                appointmentDate: tomorrow.toISOString().split('T')[0],
                appointmentTime: '10:00',
                type: 'CONSULTATION' as const,
                reason: 'Regular checkup',
            }

            const result = appointmentSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('should reject past appointment date', () => {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)

            const invalidData = {
                patientId: '123e4567-e89b-12d3-a456-426614174000',
                doctorId: '123e4567-e89b-12d3-a456-426614174001',
                appointmentDate: yesterday.toISOString().split('T')[0],
                appointmentTime: '10:00',
                type: 'CONSULTATION' as const,
                reason: 'Regular checkup',
            }

            const result = appointmentSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })

    describe('labOrderSchema', () => {
        it('should validate a valid lab order', () => {
            const validData = {
                patientId: '123e4567-e89b-12d3-a456-426614174000',
                testType: 'BLOOD' as const,
                testName: 'Complete Blood Count',
                urgency: 'ROUTINE' as const,
                clinicalNotes: 'Patient presents with fatigue',
            }

            const result = labOrderSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })
    })

    describe('prescriptionSchema', () => {
        it('should validate a valid prescription', () => {
            const validData = {
                patientId: '123e4567-e89b-12d3-a456-426614174000',
                medications: [
                    {
                        name: 'Paracetamol',
                        dosage: '500mg',
                        frequency: 'Twice daily',
                        duration: '7 days',
                        quantity: '14',
                    },
                ],
                diagnosis: 'Fever',
            }

            const result = prescriptionSchema.safeParse(validData)
            expect(result.success).toBe(true)
        })

        it('should reject prescription without medications', () => {
            const invalidData = {
                patientId: '123e4567-e89b-12d3-a456-426614174000',
                medications: [],
                diagnosis: 'Fever',
            }

            const result = prescriptionSchema.safeParse(invalidData)
            expect(result.success).toBe(false)
        })
    })
})
