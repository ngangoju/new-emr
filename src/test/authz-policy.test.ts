import { describe, expect, it } from 'vitest'
import {
    canAccessDashboardRoute,
    canRoleAccessFeature,
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

    it('allows dashboard routes from route permissions when provided', () => {
        expect(
            canAccessDashboardRoute('RECEPTIONIST', '/dashboard/admin', {
                permissions: ['route:/dashboard/admin'],
            }),
        ).toBe(true)
    })

    it('allows nested dashboard routes from matched route prefix permission', () => {
        expect(
            canAccessDashboardRoute('NURSE', '/dashboard/nurse/admissions', {
                permissions: ['route:/dashboard/nurse'],
            }),
        ).toBe(true)
    })

    it('keeps legacy fallback when dynamic permissions are absent', () => {
        expect(
            canAccessDashboardRoute('ADMIN', '/dashboard/admin', {
                permissions: [],
            }),
        ).toBe(true)

        expect(
            canAccessDashboardRoute('RECEPTIONIST', '/dashboard/admin', {
                permissions: [],
            }),
        ).toBe(false)
    })

    it('uses deterministic dynamic-first behavior when route permissions are present', () => {
        // Legacy ADMIN would allow /dashboard/admin, but route permissions only allow lab.
        expect(
            canAccessDashboardRoute('ADMIN', '/dashboard/admin', {
                permissions: ['route:/dashboard/lab'],
            }),
        ).toBe(false)

        // Legacy RECEPTIONIST would deny /dashboard/admin, but route permission explicitly grants it.
        expect(
            canAccessDashboardRoute('RECEPTIONIST', '/dashboard/admin', {
                permissions: ['route:/dashboard/admin'],
            }),
        ).toBe(true)
    })

    it('filters navigation by menu permissions when provided', () => {
        const dynamicAllowedNav = getDashboardNavigationForRole('RECEPTIONIST', {
            permissions: ['menu:/dashboard/admin', 'menu:/dashboard/notifications'],
        })
        expect(dynamicAllowedNav.some((item) => item.href === '/dashboard/admin')).toBe(true)
        expect(dynamicAllowedNav.some((item) => item.href === '/dashboard/notifications')).toBe(true)
        expect(dynamicAllowedNav.some((item) => item.href === '/dashboard/reception')).toBe(false)

        const dynamicDeniedNav = getDashboardNavigationForRole('ADMIN', {
            permissions: ['menu:/dashboard/lab'],
        })
        expect(dynamicDeniedNav.some((item) => item.href === '/dashboard/admin')).toBe(false)
        expect(dynamicDeniedNav.some((item) => item.href === '/dashboard/lab')).toBe(true)
    })

    it('keeps deterministic menu-first behavior when menu permissions exist', () => {
        const nav = getDashboardNavigationForRole('ADMIN', {
            permissions: ['menu:/dashboard/lab'],
        })

        expect(nav.some((item) => item.href === '/dashboard/lab')).toBe(true)
        expect(nav.some((item) => item.href === '/dashboard/admin')).toBe(false)
    })

    it('returns role-specific default dashboard route for restricted roles', () => {
        expect(getRoleDefaultDashboardRoute('CASHIER')).toBe('/dashboard/billing')
        expect(getRoleDefaultDashboardRoute('COO')).toBe('/dashboard/reports')
        expect(getRoleDefaultDashboardRoute('AUDITOR')).toBe('/dashboard/reports')
        expect(getRoleDefaultDashboardRoute('DOCTOR')).toBe('/dashboard')
    })

    it('allows auditor report access without admin navigation fallback', () => {
        expect(canAccessDashboardRoute('AUDITOR', '/dashboard/reports')).toBe(true)
        expect(canAccessDashboardRoute('AUDITOR', '/dashboard/admin')).toBe(false)

        const auditorNavigation = getDashboardNavigationForRole('AUDITOR')
        expect(auditorNavigation.some((item) => item.href === '/dashboard/reports')).toBe(true)
        expect(auditorNavigation.some((item) => item.href === '/dashboard/admin')).toBe(false)
    })

    it('allows chief nurse report access through the standard route policy', () => {
        expect(canAccessDashboardRoute('CHIEF_NURSE', '/dashboard/reports')).toBe(true)
        expect(canAccessDashboardRoute('CHIEF_NURSE', '/dashboard/reports/usage')).toBe(true)
    })

    it('keeps security on public dashboard surfaces only by default', () => {
        expect(canAccessDashboardRoute('SECURITY', '/dashboard')).toBe(true)
        expect(canAccessDashboardRoute('SECURITY', '/dashboard/notifications')).toBe(true)
        expect(canAccessDashboardRoute('SECURITY', '/dashboard/reception')).toBe(false)
        expect(canAccessDashboardRoute('SECURITY', '/dashboard/reports')).toBe(false)

        const securityNavigation = getDashboardNavigationForRole('SECURITY')
        expect(securityNavigation.map((item) => item.href)).toEqual(['/dashboard', '/dashboard/notifications'])
    })

    it('keeps dispense fallback aligned to pharmacy-only default permissions', () => {
        expect(canRoleAccessFeature('PHARMACIST', 'CAN_DISPENSE')).toBe(true)
        expect(canRoleAccessFeature('STORE', 'CAN_DISPENSE')).toBe(false)
        expect(canRoleAccessFeature('DOCTOR', 'CAN_DISPENSE')).toBe(false)
    })

    // F-009 regression: audit probe cases — unauthorized roles must NOT see restricted page shells
    describe('F-009 — unauthorized roles cannot access restricted dashboard segments', () => {
        it('blocks cashier from accessing /dashboard/admin', () => {
            expect(canAccessDashboardRoute('CASHIER', '/dashboard/admin')).toBe(false)
        })

        it('blocks pharmacist from accessing /dashboard/doctor/consultations', () => {
            expect(canAccessDashboardRoute('PHARMACIST', '/dashboard/doctor/consultations')).toBe(false)
        })

        it('blocks receptionist from accessing /dashboard/reports', () => {
            expect(canAccessDashboardRoute('RECEPTIONIST', '/dashboard/reports')).toBe(false)
        })

        it('default-denies unknown route segments (no matching policy)', () => {
            // A route that has no entry in DASHBOARD_ROUTE_POLICIES should be denied
            expect(canAccessDashboardRoute('DOCTOR', '/dashboard/unknown-segment')).toBe(false)
            expect(canAccessDashboardRoute('ADMIN', '/dashboard/unknown-segment')).toBe(false)
        })

        it('route:/dashboard permission does NOT grant access to sub-paths (e.g. /dashboard/admin)', () => {
            // This is the core F-009 vector: a user with only route:/dashboard should not
            // be able to reach privileged segments by exploiting the prefix match.
            expect(
                canAccessDashboardRoute('CASHIER', '/dashboard/admin', {
                    permissions: ['route:/dashboard'],
                }),
            ).toBe(false)

            expect(
                canAccessDashboardRoute('CASHIER', '/dashboard', {
                    permissions: ['route:/dashboard'],
                }),
            ).toBe(true) // root /dashboard itself IS allowed
        })
    })
})
