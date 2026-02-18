import axios, { AxiosRequestConfig, Method } from 'axios';
import toast from 'react-hot-toast';
import { getAccessToken, handleUnauthorized } from '@/lib/utils/auth';

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    withCredentials: false,
});

// Helper function for API requests
export const apiRequest = async <T>(
    method: Method,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
): Promise<{ data: T }> => {
    const response = await api.request<T>({
        method,
        url,
        data,
        ...config,
    })
    return { data: response.data }
}

api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const status = error.response?.status;

        if (status === 401) {
            handleUnauthorized();
            return Promise.reject(error);
        }

        if (status === 403) {
            toast.error('You are not allowed to perform this action.');
            return Promise.reject(error);
        }

        // Global Error Handling
        const errData = error.response?.data;
        let errorMessage = errData?.message || 'An unexpected error occurred';

        // Append details if present
        if (errData?.details && Array.isArray(errData.details)) {
            const detailString = errData.details.join(', ');
            if (detailString) {
                errorMessage = `${errorMessage}: ${detailString}`;
            }
        }

        // Surface traceId for debugging/support
        if (errData?.traceId) {
            errorMessage = `${errorMessage} [Trace: ${errData.traceId}]`;
        }

        // Don't show toast for 401s as they are handled by refresh logic or redirect
        // Don't show toast for 404s if they are expected (handled by component)
        if (status !== 401 && status !== 404) {
            toast.error(errorMessage);
        }

        return Promise.reject(error);
    }
);
