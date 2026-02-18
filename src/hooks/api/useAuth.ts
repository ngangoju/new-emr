import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { clearSession, getAccessToken, setAccessToken, setSessionUser } from '@/lib/utils/auth';

export interface User {
    id: string;
    username: string;
    email: string;
    role?: string;
    permissions?: string[];
    active?: boolean;
}

export interface LoginPayload {
    username?: string;
    email?: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken?: string;
    userId?: string;
    user?: User;
}

export function useLogin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: LoginPayload) => {
            const { data } = await api.post<AuthResponse>('/auth/login', payload);

            if (!data.accessToken) {
                throw new Error("Login failed: No access token received from server.");
            }

            setAccessToken(data.accessToken);

            // If backend returns full user object, use it
            if (data.user) {
                return data.user;
            }

            // Backend only returns userId, create minimal user object
            // The actual user data will be fetched by useMe hook after redirect
            let userRole = 'USER';
            let userPermissions: string[] = [];
            try {
                const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
                if (payload.roles && payload.roles.length > 0) {
                    userRole = payload.roles[0].replace('ROLE_', '');
                }
                if (payload.permissions) {
                    userPermissions = payload.permissions;
                }
            } catch (e) {
                console.error('Failed to parse token payload', e);
            }

            const normalizedUser = {
                id: data.userId || '',
                username: payload.username || '',
                email: payload.email || '',
                role: userRole,
                permissions: userPermissions,
                active: true
            } as User;

            setSessionUser(normalizedUser);

            return normalizedUser;
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
            if (!getAccessToken()) {
                return null;
            }

            try {
                const { data } = await api.get<User>('/auth/me');
                return data;
            } catch (error) {
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
                await api.post('/auth/logout');
            } catch (error) {
                // Ignore logout errors
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
