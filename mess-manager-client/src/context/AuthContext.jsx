import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState(null);

    // User object: { id, name, role: 'admin' | 'member', avatar? }
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('mess_user');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error('Failed to parse user from local storage', e);
            return null;
        }
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem('mess_token') || null;
    });

    // Mark initial loading as complete
    useEffect(() => {
        setIsLoading(false);
    }, []);

    // Listen for forced logout events (e.g. session replaced by another device)
    useEffect(() => {
        const handleForceLogout = (e) => {
            const message = e.detail?.message;
            setUser(null);
            setToken(null);
            if (message) {
                setNotification({ message, type: 'error' });
            }
        };
        window.addEventListener('auth:logout', handleForceLogout);
        return () => window.removeEventListener('auth:logout', handleForceLogout);
    }, []);

    useEffect(() => {
        if (user) {
            localStorage.setItem('mess_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('mess_user');
        }
    }, [user]);

    useEffect(() => {
        if (token) {
            localStorage.setItem('mess_token', token);
        } else {
            localStorage.removeItem('mess_token');
        }
    }, [token]);

    const login = async (userId, password, role) => {
        try {
            const res = await api.post('/auth/login', { userId, password, role });
            if (res.data.success && res.data.token) {
                setToken(res.data.token);
                setUser(res.data.user);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login Error:', error.response?.data?.message || error.message);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('mess_user');
        localStorage.removeItem('mess_token');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoading,
            notification,
            setNotification,
            login,
            setUser,
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};
