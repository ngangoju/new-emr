import { getSessionUser, ROLE_PERMISSIONS, normalizeRole, type UserRole } from '@/lib/utils/auth'
import { getEffectiveRoles, type CapabilityContext } from '@/lib/authz/capability'

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
        allowedRoles: ['ADMIN', 'RECEPTIONIST', 'CUSTOMER_CARE'],
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
        allowedRoles: ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'CUSTOMER_CARE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR'],
    },
    {
        routePrefix: '/dashboard/doctor/consultations',
        allowedRoles: ['ADMIN', 'DOCTOR', 'CLINICAL_DIRECTOR'],
    },
    {
        routePrefix: '/dashboard/doctor/schedule',
        allowedRoles: ['ADMIN', 'DOCTOR', 'NURSE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR', 'RECEPTIONIST'],
    },
    {
        routePrefix: '/dashboard/schedule',
        allowedRoles: ['ADMIN', 'DOCTOR', 'NURSE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR', 'RECEPTIONIST'],
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
        allowedRoles: ['ADMIN', 'BILLING_OFFICER', 'CASHIER', 'DAF', 'COO', 'NURSE', 'CHIEF_NURSE'],
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
        allowedRoles: ['ADMIN', 'DOCTOR', 'DAF', 'COO', 'MANAGER', 'CLINICAL_DIRECTOR', 'CHIEF_NURSE', 'ACCOUNTANT', 'AUDITOR'],
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
    COO: '/dashboard/reports',
    MANAGER: '/dashboard/admin',
    'HUMAN_RESOURCE': '/dashboard/admin',
    ACCOUNTANT: '/dashboard/reports',
    AUDITOR: '/dashboard/reports',
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

function getPermissionPathsByPrefix(
    permissions: readonly string[] | null | undefined,
    prefix: 'route:' | 'menu:',
): string[] {
    if (!permissions || permissions.length === 0) {
        return []
    }

    const paths = new Set<string>()

    for (const permission of permissions) {
        if (!permission.startsWith(prefix)) {
            continue
        }

        const path = permission.slice(prefix.length)
        if (!path.startsWith('/')) {
            continue
        }

        paths.add(normalizePath(path))
    }

    return [...paths]
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

export function canAccessDashboardRoute(
    role: UserRole | null,
    pathname: string,
    context: Omit<CapabilityContext, 'role'> = {},
): boolean {
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

    if (!matchedPolicy) {
        return false
    }

    const sessionUser = getSessionUser()
    const resolvedRoles = context.roles ?? sessionUser?.roles ?? []
    const resolvedPermissions = context.permissions ?? sessionUser?.permissions ?? []
    const routePermissionPaths = getPermissionPathsByPrefix(resolvedPermissions, 'route:')

    if (routePermissionPaths.length > 0) {
        return routePermissionPaths.some((routePermissionPath) =>
            matchesRoutePrefix(normalizedPath, routePermissionPath),
        )
    }

    const effectiveRoles = getEffectiveRoles({
        role,
        roles: resolvedRoles,
    })

    if (effectiveRoles.length === 0) {
        return false
    }

    return effectiveRoles.some((candidateRole) => matchedPolicy.allowedRoles.includes(candidateRole))
}

export function getRoleDefaultDashboardRoute(role: UserRole | null): string {
    if (!role) return '/dashboard'
    return ROLE_DEFAULT_DASHBOARD_ROUTES[role] ?? '/dashboard'
}

export function getDashboardNavigationForRole(
    role: UserRole | null,
    context: Omit<CapabilityContext, 'role'> = {},
): DashboardNavItem[] {
    const sessionUser = getSessionUser()
    const resolvedPermissions = context.permissions ?? sessionUser?.permissions ?? []
    const menuPermissionPaths = getPermissionPathsByPrefix(resolvedPermissions, 'menu:')
    const hasMenuPermissionPolicies = menuPermissionPaths.length > 0

    return DASHBOARD_NAV_ITEMS.filter((item) => {
        const shouldHideDashboardMenu = !hasMenuPermissionPolicies && role ? getRoleDefaultDashboardRoute(role) !== '/dashboard' : false

        if (item.href === '/dashboard' && shouldHideDashboardMenu) {
            return false
        }

        if (hasMenuPermissionPolicies) {
            return menuPermissionPaths.includes(normalizePath(item.href))
        }

        return canAccessDashboardRoute(role, item.href, context)
    }).map((item) => {
        if (role === 'RECEPTIONIST' && item.href === '/dashboard/doctor/schedule') {
            return { ...item, title: 'Appointments' }
        }

        return item
    })
}
