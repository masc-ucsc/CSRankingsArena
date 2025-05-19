import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        if (token) {
            // Verify token and get user info
            verifyToken(token);
        } else {
            setLoading(false);
        }
    }, []);

    const verifyToken = async (token) => {
        try {
            const response = await getProfile();
            if (response.success) {
                setUser(response.data.user);
                setIsAuthenticated(true);
            } else {
                throw new Error('Failed to verify token');
            }
        } catch (error) {
            console.error('Token verification failed:', error);
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
            
            // Get user profile
            const response = await getProfile();
            
            if (response.success && response.data.user) {
                setUser(response.data.user);
                setIsAuthenticated(true);
                return { success: true };
            } else {
                throw new Error('Invalid user data received');
            }
        } catch (error) {
            console.error('Login error:', error);
            // If token is invalid, clear everything
            logout();
            return {
                success: false,
                error: error.message || 'Login failed'
            };
        }
    };

    const logout = () => {
        // Remove token from localStorage
        localStorage.removeItem('token');
        
        // Clear any stored state
        sessionStorage.removeItem('authRedirectState');
        
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