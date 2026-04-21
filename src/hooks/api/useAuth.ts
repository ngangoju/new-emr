import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { clearSession, setSessionUser } from '@/lib/utils/auth';

export interface User {
    id: string;
    username: string;
    email?: string;
    role?: string;
    permissions?: string[];
    active?: boolean;
}

export interface LoginPayload {
    username?: string;
    email?: string;
    password: string;
}

export interface ForgotPasswordPayload {
    email: string;
}

export interface ResetPasswordPayload {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

export interface ContactAdministratorPayload {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export interface ContactAdministratorResponse {
    reference?: string;
    message?: string;
}

/**
 * Response from /auth/login after the HttpOnly cookie migration.
 * The accessToken and refreshToken are no longer returned in the JSON body.
 * They are delivered exclusively via Set-Cookie headers and are invisible to JS.
 */
export interface AuthResponse {
    userId?: string;
    user?: User;
}

export function useLogin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: LoginPayload) => {
            // POST /auth/login — the backend sets HttpOnly cookies for accessToken and refreshToken.
            // We only read the userId from the response body. No token is ever accessible to JS.
            const { data } = await api.post<AuthResponse>('/auth/login', payload);

            // If backend returns full user object, use it directly
            if (data.user) {
                setSessionUser(data.user);
                return data.user;
            }

            // Otherwise, fetch the current user profile via /auth/me
            // The accessToken cookie is automatically sent by the browser.
            try {
                const { data: me } = await api.get<User>('/auth/me');
                setSessionUser(me);
                return me;
            } catch {
                // Fallback: build minimal user from userId
                const minimalUser: User = {
                    id: data.userId || '',
                    username: '',
                    role: 'USER',
                    active: true,
                };
                setSessionUser(minimalUser);
                return minimalUser;
            }
        },
        onSuccess: (user) => {
            setSessionUser(user);
            queryClient.setQueryData(['me'], user);
        },
    });
}

export function useMe() {
    return useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            // Auth state is determined entirely by the HttpOnly cookie.
            // If the cookie is present and valid, /auth/me returns the user.
            // No localStorage check needed.
            try {
                const { data } = await api.get<User>('/auth/me');
                return data;
            } catch {
                return null;
            }
        },
        retry: false,
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async () => {
            try {
                // POST /auth/logout — the backend clears the HttpOnly cookies (Max-Age=0).
                // clearSession() clears local metadata (user, role) from localStorage.
                await api.post('/auth/logout');
            } catch {
                // Even if the server call fails, clear local session data
            }
            clearSession({ redirectToLogin: false, reason: 'manual-logout' });
        },
        onSuccess: () => {
            queryClient.setQueryData(['me'], null);
            queryClient.clear();
            router.push('/login');
        },
    });
}

export function useForgotPassword() {
    return useMutation({
        mutationFn: async (payload: ForgotPasswordPayload) => {
            const { data } = await api.post('/auth/forgot-password', payload);
            return data;
        },
    });
}

export function useResetPassword() {
    return useMutation({
        mutationFn: async (payload: ResetPasswordPayload) => {
            const { data } = await api.post('/auth/reset-password', payload);
            return data;
        },
    });
}

export function useContactAdministrator() {
    return useMutation({
        mutationFn: async (payload: ContactAdministratorPayload) => {
            const { data } = await api.post<ContactAdministratorResponse>('/auth/contact-administrator', payload);
            return data;
        },
    });
}
