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
        const timer = setTimeout(() => setIsLoading(false), 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleForceLogout = () => {
            setUser(null);
            setToken(null);
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
            const res = await api.post('/auth/login', { 
                userId: userId?.trim(), 
                password: password?.trim(), 
                role 
            });
            if (res.data.success && res.data.token) {
                setToken(res.data.token);
                setUser(res.data.user);
                return { success: true };
            }
            return { 
                success: false, 
                message: res.data?.message || 'Invalid User ID or Password' 
            };
        } catch (error) {
            console.error('Login Error:', error.response?.data?.message || error.message);
            const message = error.response?.data?.message 
                || (error.code === 'ERR_NETWORK' || !error.response 
                    ? 'Cannot connect to backend server. Please make sure the backend server is running on port 5000.' 
                    : error.message);
            return { success: false, message };
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
            login,
            setUser,
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};


