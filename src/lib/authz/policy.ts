import { ROLE_PERMISSIONS, normalizeRole, type UserRole } from '@/lib/utils/auth'

type FrontendFeaturePolicyMap = {
    [K in keyof typeof ROLE_PERMISSIONS]: readonly UserRole[]
}

export const FRONTEND_FEATURE_POLICY: FrontendFeaturePolicyMap = ROLE_PERMISSIONS

export type DashboardRoutePolicy = {
    routePrefix: string
    allowedRoles: readonly UserRole[]
}

const DASHBOARD_PUBLIC_ROUTES = ['/dashboard', '/dashboard/profile', '/dashboard/settings', '/dashboard/notifications'] as const

export const DASHBOARD_ROUTE_POLICIES: readonly DashboardRoutePolicy[] = [
    {
        routePrefix: '/dashboard/reception',
        allowedRoles: ['ADMIN', 'RECEIPTION', 'RECEPTIONIST', 'CUSTOMER_CARE'],
    },
    {
        routePrefix: '/dashboard/nurse',
        allowedRoles: ['ADMIN', 'NURSE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR'],
    },
    {
        routePrefix: '/dashboard/nurse/admissions',
        allowedRoles: ['ADMIN', 'NURSE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR'],
    },
    {
        routePrefix: '/dashboard/doctor/patients',
        allowedRoles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEIPTION', 'RECEPTIONIST', 'CUSTOMER_CARE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR'],
    },
    {
        routePrefix: '/dashboard/doctor/consultations',
        allowedRoles: ['ADMIN', 'DOCTOR', 'NURSE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR'],
    },
    {
        routePrefix: '/dashboard/doctor/schedule',
        allowedRoles: ['ADMIN', 'DOCTOR', 'NURSE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR', 'RECEIPTION', 'RECEPTIONIST'],
    },
    {
        routePrefix: '/dashboard/schedule',
        allowedRoles: ['ADMIN', 'DOCTOR', 'NURSE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR', 'RECEIPTION', 'RECEPTIONIST'],
    },
    {
        routePrefix: '/dashboard/doctor/records',
        allowedRoles: ['ADMIN', 'DOCTOR', 'NURSE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR'],
    },
    {
        routePrefix: '/dashboard/lab',
        allowedRoles: ['ADMIN', 'LABORANTIN', 'LAB_TECH', 'DOCTOR', 'NURSE', 'CLINICAL_DIRECTOR', 'RADIOLOGIST'],
    },
    {
        routePrefix: '/dashboard/pharmacy',
        allowedRoles: ['ADMIN', 'STORE', 'PHARMACIST', 'DOCTOR', 'CLINICAL_DIRECTOR', 'NURSE'],
    },
    {
        routePrefix: '/dashboard/radiology',
        allowedRoles: ['ADMIN', 'RADIOLOGIST', 'DOCTOR', 'NURSE', 'CLINICAL_DIRECTOR'],
    },
    {
        routePrefix: '/dashboard/billing',
        allowedRoles: ['ADMIN', 'BILLING_OFFICER', 'CASHIER', 'DAF', 'COO', 'NURSE'],
    },
    {
        routePrefix: '/dashboard/cashier/close',
        allowedRoles: ['ADMIN', 'BILLING_OFFICER', 'CASHIER'],
    },
    {
        routePrefix: '/dashboard/admin',
        allowedRoles: ['ADMIN', 'MANAGER', 'DAF', 'COO', 'HUMAN_RESOURCE', 'CLINICAL_DIRECTOR'],
    },
    {
        routePrefix: '/dashboard/admin/roles',
        allowedRoles: ['ADMIN'],
    },
    {
        routePrefix: '/dashboard/reports',
        allowedRoles: ['ADMIN', 'DOCTOR', 'NURSE', 'DAF', 'COO', 'MANAGER', 'CLINICAL_DIRECTOR', 'CHIEF_NURSE', 'ACCOUNTANT'],
    },
    {
        routePrefix: '/dashboard/approvals',
        allowedRoles: ['ADMIN', 'CLINICAL_DIRECTOR'],
    },
] as const

const ORDERED_DASHBOARD_ROUTE_POLICIES = [...DASHBOARD_ROUTE_POLICIES].sort(
    (a, b) => b.routePrefix.length - a.routePrefix.length,
)

export type DashboardNavItem = {
    title: string
    href: string
}

export const DASHBOARD_NAV_ITEMS: readonly DashboardNavItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Reception', href: '/dashboard/reception' },
    { title: 'Nurse', href: '/dashboard/nurse' },
    { title: 'Admissions', href: '/dashboard/nurse/admissions' },
    { title: 'Patients', href: '/dashboard/doctor/patients' },
    { title: 'Consultations', href: '/dashboard/doctor/consultations' },
    { title: 'Schedule', href: '/dashboard/doctor/schedule' },
    { title: 'Notifications', href: '/dashboard/notifications' },
    { title: 'Lab Results', href: '/dashboard/lab' },
    { title: 'Radiology', href: '/dashboard/radiology' },
    { title: 'Pharmacy', href: '/dashboard/pharmacy' },
    { title: 'Billing', href: '/dashboard/billing' },
    { title: 'Cash Close', href: '/dashboard/cashier/close' },
    { title: 'Medical Records', href: '/dashboard/doctor/records' },
    { title: 'Reports', href: '/dashboard/reports' },
    { title: 'Approvals', href: '/dashboard/approvals' },
    { title: 'Admin', href: '/dashboard/admin' },
] as const

const ROLE_DEFAULT_DASHBOARD_ROUTES: Partial<Record<UserRole, string>> = {
    RECEIPTION: '/dashboard/reception',
    RECEPTIONIST: '/dashboard/reception',
    'CUSTOMER_CARE': '/dashboard/reception',
    NURSE: '/dashboard/nurse',
    'CHIEF_NURSE': '/dashboard/nurse',
    STORE: '/dashboard/pharmacy',
    PHARMACIST: '/dashboard/pharmacy',
    LABORANTIN: '/dashboard/lab',
    LAB_TECH: '/dashboard/lab',
    RADIOLOGIST: '/dashboard/radiology',
    BILLING_OFFICER: '/dashboard/billing',
    CASHIER: '/dashboard/billing',
    DAF: '/dashboard/billing',
    COO: '/dashboard/billing',
    MANAGER: '/dashboard/admin',
    'HUMAN_RESOURCE': '/dashboard/admin',
    ACCOUNTANT: '/dashboard/reports',
}

function normalizePath(pathname: string): string {
    if (!pathname) return '/'
    return pathname.replace(/\/+$/, '') || '/'
}

function matchesRoutePrefix(pathname: string, routePrefix: string): boolean {
    const normalizedPath = normalizePath(pathname)
    const normalizedRoutePrefix = normalizePath(routePrefix)

    return normalizedPath === normalizedRoutePrefix || normalizedPath.startsWith(`${normalizedRoutePrefix}/`)
}

export function normalizeUserRole(role?: string | null): UserRole | null {
    return normalizeRole(role);
}

export function canRoleAccessFeature(
    role: UserRole | null,
    feature: keyof typeof FRONTEND_FEATURE_POLICY,
): boolean {
    if (!role) return false
    return FRONTEND_FEATURE_POLICY[feature].includes(role)
}

export function canAccessDashboardRoute(role: UserRole | null, pathname: string): boolean {
    const normalizedPath = normalizePath(pathname)
    const isDashboardPath = normalizedPath === '/dashboard' || normalizedPath.startsWith('/dashboard/')

    if (!isDashboardPath) {
        return true
    }

    if ((DASHBOARD_PUBLIC_ROUTES as readonly string[]).includes(normalizedPath)) {
        return true
    }

    const matchedPolicy = ORDERED_DASHBOARD_ROUTE_POLICIES.find((policy) =>
        matchesRoutePrefix(normalizedPath, policy.routePrefix),
    )

    if (!matchedPolicy || !role) {
        return false
    }

    return matchedPolicy.allowedRoles.includes(role)
}

export function getRoleDefaultDashboardRoute(role: UserRole | null): string {
    if (!role) return '/dashboard'
    return ROLE_DEFAULT_DASHBOARD_ROUTES[role] ?? '/dashboard'
}

export function getDashboardNavigationForRole(role: UserRole | null): DashboardNavItem[] {
    return DASHBOARD_NAV_ITEMS.filter((item) => {
        const shouldHideDashboardMenu = role ? getRoleDefaultDashboardRoute(role) !== '/dashboard' : false

        if (item.href === '/dashboard' && shouldHideDashboardMenu) {
            return false
        }

        return canAccessDashboardRoute(role, item.href)
    })
}
