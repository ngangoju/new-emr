import { z } from 'zod'

export const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    role: z.string().min(1, 'Role is required'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
    email: z.string().trim().email('A valid email address is required'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
    token: z.string().trim().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const contactAdministratorSchema = z.object({
    name: z.string().trim().min(2, 'Name is required'),
    email: z.string().trim().email('A valid email address is required'),
    subject: z.string().trim().min(3, 'Subject is required'),
    message: z.string().trim().min(10, 'Message must be at least 10 characters'),
})

export type ContactAdministratorInput = z.infer<typeof contactAdministratorSchema>
