export type UserRole =
    | 'ADMIN'
    | 'DOCTOR'
    | 'NURSE'
    | 'RECEPTIONIST'
    | 'CUSTOMER_CARE'
    | 'LABORANTIN'
    | 'LAB_TECH'
    | 'PHARMACIST'
    | 'CASHIER'
    | 'AUDITOR'
    | 'BILLING_OFFICER'
    | 'MANAGER'
    | 'CLINICAL_DIRECTOR'
    | 'CHIEF_NURSE'
    | 'RADIOLOGIST'
    | 'SECURITY'
    | 'HUMAN_RESOURCE'
    | 'COO'
    | 'DAF'
    | 'STORE'
    | 'USER'
    | 'ACCOUNTANT';

export const ROLE_PERMISSIONS = {
    CAN_REGISTER_PATIENT: ['ADMIN', 'RECEPTIONIST', 'CUSTOMER_CARE'],
    CAN_VIEW_MEDICAL_RECORDS: ['ADMIN', 'DOCTOR', 'NURSE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR', 'RADIOLOGIST'],
    CAN_PRESCRIBE: ['ADMIN', 'DOCTOR', 'CLINICAL_DIRECTOR'],
    CAN_DISPENSE: ['ADMIN', 'PHARMACIST'],
    CAN_VIEW_LAB: ['ADMIN', 'DOCTOR', 'LABORANTIN', 'LAB_TECH', 'NURSE', 'CLINICAL_DIRECTOR'],
    CAN_BILL: ['ADMIN', 'BILLING_OFFICER', 'CASHIER', 'DAF', 'COO', 'NURSE', 'CHIEF_NURSE'],
    CAN_MANAGE_USERS: ['ADMIN', 'MANAGER', 'HUMAN_RESOURCE', 'DAF', 'COO'],
    CAN_MANAGE_RADIOLOGY: ['ADMIN', 'RADIOLOGIST', 'DOCTOR', 'NURSE', 'CLINICAL_DIRECTOR'],
    CAN_VIEW_REPORTS: ['ADMIN', 'DAF', 'COO', 'ACCOUNTANT', 'MANAGER', 'CLINICAL_DIRECTOR', 'CHIEF_NURSE', 'AUDITOR'],
    CAN_DISCHARGE: ['ADMIN', 'CASHIER'],
    CAN_TRANSFER: ['ADMIN', 'NURSE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR'],
    CAN_REQUEST_DRUGS: ['ADMIN', 'NURSE', 'DOCTOR', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR'],
    CAN_MANAGE_TARIFFS: ['ADMIN', 'CLINICAL_DIRECTOR'],
    CAN_APPROVE: ['ADMIN', 'CLINICAL_DIRECTOR'],
    CAN_ADMIT: ['ADMIN', 'NURSE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR', 'RECEPTIONIST'],
    CAN_VIEW_PHARMACY: ['ADMIN', 'PHARMACIST', 'STORE', 'NURSE', 'DOCTOR', 'CLINICAL_DIRECTOR'],
    CAN_MANAGE_CONSULTATIONS: ['ADMIN', 'DOCTOR', 'CLINICAL_DIRECTOR'],
} as const;

const SESSION_STORAGE_KEYS = {
    // NOTE: ACCESS_TOKEN and REFRESH_TOKEN are intentionally omitted.
    // Tokens are now stored exclusively in HttpOnly cookies managed by the backend.
    // They are invisible to JavaScript by design (Tiger Team Phase 1 Fix 1).
    USER: 'user',
    USER_ROLE: 'userRole',
} as const;

const SESSION_CLEARED_EVENT = 'emr:auth:session-cleared';
const AUTH_INITIALIZED_EVENT = 'emr:auth:initialized';

let authInitialized = false;

export interface SessionUser {
    id?: string;
    username?: string;
    email?: string;
    role?: string;
    roles?: string[];
    permissions?: string[];
    active?: boolean;
}

export interface ClearSessionOptions {
    redirectToLogin?: boolean;
    reason?: 'manual-logout' | 'unauthorized' | 'invalid-session' | 'session-expired';
}

// setAccessToken() and getAccessToken() have been REMOVED.
// Tokens are now stored exclusively in HttpOnly cookies set by the backend.
// They are never accessible to JavaScript — this is the security guarantee
// that prevents XSS-based token exfiltration. (Tiger Team Phase 1 Fix 1)

export function setSessionUser(user: SessionUser) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SESSION_STORAGE_KEYS.USER, JSON.stringify(user));
    if (user.role) {
        localStorage.setItem(SESSION_STORAGE_KEYS.USER_ROLE, user.role);
    }
}

export function setUserRole(role: UserRole) {
    if (typeof window === 'undefined') return;

    // Store in separate key for consistency/legacy support
    localStorage.setItem(SESSION_STORAGE_KEYS.USER_ROLE, role);

    // Also update the main user object if it exists
    const user = getSessionUser() || {};
    user.role = role;
    setSessionUser(user);
}

export function getSessionUser(): SessionUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(SESSION_STORAGE_KEYS.USER);
    if (!raw) return null;

    try {
        return JSON.parse(raw) as SessionUser;
    } catch {
        localStorage.removeItem(SESSION_STORAGE_KEYS.USER);
        return null;
    }
}

export function clearSession(options: ClearSessionOptions = {}) {
    const { redirectToLogin = true, reason = 'invalid-session' } = options;

    // Tokens are HttpOnly cookies — they are cleared server-side by /auth/logout
    // (Max-Age=0). We only clear non-sensitive session metadata here.
    if (typeof window === 'undefined') return;

    localStorage.removeItem(SESSION_STORAGE_KEYS.USER);
    localStorage.removeItem(SESSION_STORAGE_KEYS.USER_ROLE);

    // Also scrub any legacy token keys left over from the pre-migration system
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');

    window.dispatchEvent(new CustomEvent(SESSION_CLEARED_EVENT, { detail: { reason } }));

    if (redirectToLogin && window.location.pathname !== '/login') {
        window.location.assign('/login');
    }
}

export function handleUnauthorized() {
    clearSession({ reason: 'unauthorized' });
}

export const AUTH_EVENTS = {
    SESSION_CLEARED: SESSION_CLEARED_EVENT,
    AUTH_INITIALIZED: AUTH_INITIALIZED_EVENT,
} as const;

// Initialize auth state on module load.
// With HttpOnly cookie auth, there is no token to read from localStorage.
// Authentication state is determined by whether /auth/me succeeds (checked in useMe hook).
function initializeAuth() {
    if (typeof window === 'undefined') return;

    // Clean up any stale pre-migration token keys that may exist in localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');

    // Mark auth as initialized.
    // "initialized" means the bootstrap is complete, not "authenticated".
    authInitialized = true;
    window.dispatchEvent(new CustomEvent(AUTH_INITIALIZED_EVENT));
}

// Run initialization
if (typeof window !== 'undefined') {
    initializeAuth();
}

const LEGACY_ROLE_ALIASES: Record<string, UserRole> = {
    'CLINICAL-DIRECTOR': 'CLINICAL_DIRECTOR',
    'CHIEF-NURSE': 'CHIEF_NURSE',
    'CUSTOMER-CARE': 'CUSTOMER_CARE',
    'HUMAN-RESOURCE': 'HUMAN_RESOURCE',
}

export function normalizeRole(role: string | null | undefined): UserRole | null {
    if (!role) return null;
    const upper = role.toUpperCase();
    return (LEGACY_ROLE_ALIASES[upper] ?? upper) as UserRole;
}

export function getUserRole(): UserRole | null {
    // 1. Try to get from user object
    const user = getSessionUser();
    if (user?.role) {
        return normalizeRole(user.role);
    }

    // 1b. Multi-role support: use first normalized role if present
    if (Array.isArray(user?.roles)) {
        for (const candidateRole of user.roles) {
            const normalized = normalizeRole(candidateRole)
            if (normalized) {
                return normalized
            }
        }
    }

    // 2. Fallback to direct role key
    if (typeof window !== 'undefined') {
        const directRole = localStorage.getItem(SESSION_STORAGE_KEYS.USER_ROLE);
        if (directRole) {
            return normalizeRole(directRole);
        }
    }

    return null;
}

export function isAuthInitialized(): boolean {
    return authInitialized;
}

export function onAuthInitialized(callback: () => void): () => void {
    if (authInitialized) {
        callback();
        return () => { };
    }

    const handler = () => {
        callback();
        window.removeEventListener(AUTH_INITIALIZED_EVENT, handler);
    };

    window.addEventListener(AUTH_INITIALIZED_EVENT, handler);
    return () => window.removeEventListener(AUTH_INITIALIZED_EVENT, handler);
}
