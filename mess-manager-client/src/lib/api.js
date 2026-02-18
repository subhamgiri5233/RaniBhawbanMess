import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Request interceptor - Add JWT token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('mess_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle 401 errors (token expired or session replaced)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const code = error.response?.data?.code;
            // Clear auth state
            localStorage.removeItem('mess_token');
            localStorage.removeItem('mess_user');
            // Dispatch custom event that AuthContext can listen to
            if (code === 'SESSION_REPLACED') {
                window.dispatchEvent(new CustomEvent('auth:logout', {
                    detail: { message: 'You have been logged in on another device. Please login again.' }
                }));
            } else {
                window.dispatchEvent(new CustomEvent('auth:logout', { detail: {} }));
            }
        }
        return Promise.reject(error);
    }
);

export default api;
