export type UserRole =
    | 'ADMIN'
    | 'DOCTOR'
    | 'NURSE'
    | 'RECEIPTION' // Matches 'Receiption' in SQL
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
    CAN_REGISTER_PATIENT: ['ADMIN', 'RECEIPTION', 'RECEPTIONIST', 'CUSTOMER_CARE'],
    CAN_VIEW_MEDICAL_RECORDS: ['ADMIN', 'DOCTOR', 'NURSE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR', 'RADIOLOGIST'],
    CAN_PRESCRIBE: ['ADMIN', 'DOCTOR', 'CLINICAL_DIRECTOR'],
    CAN_DISPENSE: ['ADMIN', 'STORE', 'DOCTOR', 'PHARMACIST'],
    CAN_VIEW_LAB: ['ADMIN', 'DOCTOR', 'LABORANTIN', 'LAB_TECH', 'NURSE', 'CLINICAL_DIRECTOR'],
    CAN_BILL: ['ADMIN', 'BILLING_OFFICER', 'CASHIER', 'DAF', 'COO', 'NURSE'],
    CAN_MANAGE_USERS: ['ADMIN', 'MANAGER', 'HUMAN_RESOURCE', 'DAF', 'COO'],
    CAN_MANAGE_RADIOLOGY: ['ADMIN', 'RADIOLOGIST', 'DOCTOR', 'NURSE', 'CLINICAL_DIRECTOR'],
    CAN_VIEW_REPORTS: ['ADMIN', 'DAF', 'COO', 'ACCOUNTANT', 'MANAGER', 'CLINICAL_DIRECTOR', 'CHIEF_NURSE', 'AUDITOR'],
    CAN_DISCHARGE: ['ADMIN', 'CASHIER'],
    CAN_TRANSFER: ['ADMIN', 'NURSE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR'],
    CAN_REQUEST_DRUGS: ['ADMIN', 'NURSE', 'DOCTOR', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR'],
    CAN_MANAGE_TARIFFS: ['ADMIN', 'CLINICAL_DIRECTOR'],
    CAN_APPROVE: ['ADMIN', 'CLINICAL_DIRECTOR'],
    CAN_ADMIT: ['ADMIN', 'NURSE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR'],
    CAN_VIEW_PHARMACY: ['ADMIN', 'PHARMACIST', 'STORE', 'NURSE', 'DOCTOR', 'CLINICAL_DIRECTOR'],
    CAN_MANAGE_CONSULTATIONS: ['ADMIN', 'NURSE', 'CHIEF_NURSE', 'CLINICAL_DIRECTOR'],
} as const;

const SESSION_STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    LEGACY_TOKEN: 'token',
    USER: 'user',
    USER_ROLE: 'userRole',
} as const;

const SESSION_CLEARED_EVENT = 'emr:auth:session-cleared';
const AUTH_INITIALIZED_EVENT = 'emr:auth:initialized';

let inMemoryAccessToken: string | null = null;
let authInitialized = false;

export interface SessionUser {
    id?: string;
    username?: string;
    email?: string;
    role?: string;
    permissions?: string[];
    active?: boolean;
}

export interface ClearSessionOptions {
    redirectToLogin?: boolean;
    reason?: 'manual-logout' | 'unauthorized' | 'invalid-session' | 'session-expired';
}

export function setAccessToken(token: string) {
    const normalizedToken = token.trim();
    inMemoryAccessToken = normalizedToken || null;

    if (typeof window === 'undefined') return;

    if (normalizedToken) {
        localStorage.setItem(SESSION_STORAGE_KEYS.ACCESS_TOKEN, normalizedToken);
        return;
    }

    localStorage.removeItem(SESSION_STORAGE_KEYS.ACCESS_TOKEN);
}

export function getAccessToken() {
    if (inMemoryAccessToken) {
        return inMemoryAccessToken;
    }

    if (typeof window === 'undefined') {
        return null;
    }

    const persistedToken = localStorage.getItem(SESSION_STORAGE_KEYS.ACCESS_TOKEN);

    if (!persistedToken) {
        return null;
    }

    inMemoryAccessToken = persistedToken;
    return inMemoryAccessToken;
}

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

    inMemoryAccessToken = null;

    if (typeof window === 'undefined') return;

    localStorage.removeItem(SESSION_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(SESSION_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(SESSION_STORAGE_KEYS.LEGACY_TOKEN);
    localStorage.removeItem(SESSION_STORAGE_KEYS.USER);
    localStorage.removeItem(SESSION_STORAGE_KEYS.USER_ROLE);

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

// Initialize auth state on module load
function initializeAuth() {
    if (typeof window === 'undefined') return;

    // Check if we already have auth data
    const token = localStorage.getItem(SESSION_STORAGE_KEYS.ACCESS_TOKEN);
    const user = localStorage.getItem(SESSION_STORAGE_KEYS.USER);

    if (token && user) {
        inMemoryAccessToken = token;
    }

    // Mark auth as initialized regardless of whether a valid session exists.
    // "initialized" means storage bootstrap is complete, not "authenticated".
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
