import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888',
    withCredentials: false,
});

api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

import toast from 'react-hot-toast';

// ... (keep existing imports)

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;

        // Handle 401 Unauthorized (Token Refresh)
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const { data } = await axios.post(
                        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888') + '/auth/refresh',
                        {},
                        { headers: { Authorization: `Bearer ${refreshToken}` } }
                    );
                    localStorage.setItem('accessToken', data.accessToken || data.token);
                    original.headers.Authorization = `Bearer ${data.accessToken || data.token}`;
                    return api(original);
                } catch (refreshError) {
                    // Refresh failed, redirect to login or handle logout
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                    console.error('Refresh token failed', refreshError);
                    return Promise.reject(refreshError);
                }
            }
        }

        // Global Error Handling
        let errorMessage = error.response?.data?.message || 'An unexpected error occurred';

        // Append validation errors if present
        if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
            const validationErrors = error.response.data.errors.join(', ');
            if (validationErrors) {
                errorMessage = `${errorMessage}: ${validationErrors}`;
            }
        }

        // Don't show toast for 401s as they are handled by refresh logic or redirect
        // Don't show toast for 404s if they are expected (handled by component)
        if (error.response?.status !== 401 && error.response?.status !== 404) {
            toast.error(errorMessage);
        }

        return Promise.reject(error);
    }
);
