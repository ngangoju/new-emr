import { describe, expect, it } from 'vitest'
import {
    canAccessDashboardRoute,
    getDashboardNavigationForRole,
    getRoleDefaultDashboardRoute,
    normalizeUserRole,
} from '@/lib/authz/policy'

describe('frontend authz policy', () => {
    describe('normalizeUserRole', () => {
        it('returns null for null/undefined input', () => {
            expect(normalizeUserRole(null)).toBeNull()
            expect(normalizeUserRole(undefined)).toBeNull()
        })

        it('passes through unknown roles unchanged', () => {
            expect(normalizeUserRole('DOCTOR')).toBe('DOCTOR')
            expect(normalizeUserRole('ADMIN')).toBe('ADMIN')
            expect(normalizeUserRole('NURSE')).toBe('NURSE')
        })

        it('converts legacy hyphenated roles to underscore variants', () => {
            expect(normalizeUserRole('CLINICAL-DIRECTOR')).toBe('CLINICAL_DIRECTOR')
            expect(normalizeUserRole('CHIEF-NURSE')).toBe('CHIEF_NURSE')
            expect(normalizeUserRole('CUSTOMER-CARE')).toBe('CUSTOMER_CARE')
            expect(normalizeUserRole('HUMAN-RESOURCE')).toBe('HUMAN_RESOURCE')
        })

        it('handles lowercase legacy roles', () => {
            expect(normalizeUserRole('clinical-director')).toBe('CLINICAL_DIRECTOR')
            expect(normalizeUserRole('chief-nurse')).toBe('CHIEF_NURSE')
        })
    })

    it('shows admin navigation entries for admin role', () => {
        const adminNavigation = getDashboardNavigationForRole('ADMIN')

        expect(adminNavigation.some((item) => item.href === '/dashboard/admin')).toBe(true)
        expect(adminNavigation.some((item) => item.href === '/dashboard/billing')).toBe(true)
    })

    it('hides restricted navigation entries for non-admin role', () => {
        const receptionNavigation = getDashboardNavigationForRole('RECEPTIONIST')

        expect(receptionNavigation.some((item) => item.href === '/dashboard/reception')).toBe(true)
        expect(receptionNavigation.some((item) => item.href === '/dashboard/admin')).toBe(false)
    })

    it('enforces dashboard route access rules for admin and non-admin roles', () => {
        expect(canAccessDashboardRoute('ADMIN', '/dashboard/admin')).toBe(true)
        expect(canAccessDashboardRoute('RECEPTIONIST', '/dashboard/admin')).toBe(false)
        expect(canAccessDashboardRoute('RECEPTIONIST', '/dashboard/reception')).toBe(true)
    })

    it('returns role-specific default dashboard route for restricted roles', () => {
        expect(getRoleDefaultDashboardRoute('CASHIER')).toBe('/dashboard/billing')
        expect(getRoleDefaultDashboardRoute('DOCTOR')).toBe('/dashboard')
    })
})
