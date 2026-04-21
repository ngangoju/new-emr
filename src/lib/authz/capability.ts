import { normalizeRole, ROLE_PERMISSIONS, type UserRole } from '@/lib/utils/auth'

export type CapabilityContext = {
    role?: UserRole | null
    roles?: readonly (string | null | undefined)[] | null
    permissions?: readonly string[] | null
}

export function normalizeRoles(input: readonly (string | null | undefined)[] | null | undefined): UserRole[] {
    if (!Array.isArray(input)) return []

    const deduped = new Set<UserRole>()
    for (const value of input) {
        const normalized = normalizeRole(value)
        if (normalized) {
            deduped.add(normalized)
        }
    }

    return [...deduped]
}

export function getEffectiveRoles(context: CapabilityContext): UserRole[] {
    const fromRoles = normalizeRoles((context.roles as readonly (string | null | undefined)[] | null | undefined) ?? null)
    const normalizedSingleRole = normalizeRole(context.role ?? null)

    if (normalizedSingleRole && !fromRoles.includes(normalizedSingleRole)) {
        return [normalizedSingleRole, ...fromRoles]
    }

    return fromRoles
}

function grantsPermission(grantedPermission: string, requestedPermission: string): boolean {
    if (!grantedPermission) return false
    if (grantedPermission === '*') return true

    if (grantedPermission.endsWith(':*')) {
        const prefix = grantedPermission.slice(0, -1)
        return requestedPermission.startsWith(prefix)
    }

    return grantedPermission === requestedPermission
}

export function hasDynamicPermission(
    permissions: readonly string[] | null | undefined,
    requestedPermissions: readonly string[],
): boolean {
    if (!permissions || permissions.length === 0 || requestedPermissions.length === 0) {
        return false
    }

    return requestedPermissions.some((requestedPermission) =>
        permissions.some((grantedPermission) => grantsPermission(grantedPermission, requestedPermission)),
    )
}

export function hasAnyDynamicPermissions(permissions: readonly string[] | null | undefined): boolean {
    return Boolean(permissions && permissions.length > 0)
}

export function canAccessLegacyFeatureWithRoles(
    feature: keyof typeof ROLE_PERMISSIONS,
    roles: readonly UserRole[],
): boolean {
    const allowedRoles = ROLE_PERMISSIONS[feature] as readonly UserRole[]
    return roles.some((role) => allowedRoles.includes(role))
}

export function canAccessFeature(
    feature: keyof typeof ROLE_PERMISSIONS,
    context: CapabilityContext,
    dynamicPermissionAliases: readonly string[] = [],
): boolean {
    const roles = getEffectiveRoles(context)
    const permissions = context.permissions ?? []

    if (hasAnyDynamicPermissions(permissions)) {
        return hasDynamicPermission(permissions, [feature, ...dynamicPermissionAliases])
    }

    if (roles.length === 0) return false
    return canAccessLegacyFeatureWithRoles(feature, roles)
}
