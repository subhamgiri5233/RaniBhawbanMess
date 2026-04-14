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
            // Clear auth state
            localStorage.removeItem('mess_token');
            localStorage.removeItem('mess_user');
            // Dispatch logout event
            window.dispatchEvent(new CustomEvent('auth:logout', { detail: {} }));
        }
        return Promise.reject(error);
    }
);

export default api;


