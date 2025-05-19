import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        if (token) {
            // Set default authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Verify token and get user info
            verifyToken(token);
        } else {
            setLoading(false);
        }
    }, []);

    const verifyToken = async (token) => {
        try {
            const response = await axios.get('/api/v2/auth/verify');
            setUser(response.data.user);
            setIsAuthenticated(true);
        } catch (error) {
            // If token is invalid, clear everything
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (token) => {
        try {
            // Save token to localStorage
            localStorage.setItem('token', token);
            
            // Set default authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Get user profile
            const response = await axios.get('/api/v2/auth/profile');
            setUser(response.data.user);
            setIsAuthenticated(true);
            
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            // If token is invalid, clear everything
            logout();
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const logout = () => {
        // Remove token from localStorage
        localStorage.removeItem('token');
        
        // Remove authorization header
        delete axios.defaults.headers.common['Authorization'];
        
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 