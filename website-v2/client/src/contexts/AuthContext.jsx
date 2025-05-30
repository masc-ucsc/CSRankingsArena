import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfile } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        // const token = localStorage.getItem('token');
        // if (token) {
        //     // Verify token and get user info
        //     verifyToken(token);
        // } else {
        //     setLoading(false);
        // }
        verifyToken(); 
    }, []);

    const verifyToken = async (token) => {
        try {
            console.log('Verifying token client...');
            const response = await getProfile();
            console.log('Profile response:', response);
            
            if (response.success && response.data.data.user) {
                console.log('Token verified successfully');
                setUser(response.data.data.user);
                setIsAuthenticated(true);
            } else {
                console.error('Invalid profile response:', response);
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
            console.log('Logging in with token...');
            console.log('Token details:', {
                length: token?.length,
                firstChars: token?.substring(0, 10) + '...',
                lastChars: token?.substring(token.length - 10)
            });
            
            // Save token to localStorage
            localStorage.setItem('token', token);
            console.log('Token stored in localStorage');
            
            // Get user profile
            console.log('Fetching user profile...');
            const response = await getProfile();
            console.log('Profile response:', response);
            

            // {
            //     "success": true,
            //     "data": {
            //         "success": true,
            //         "data": {
            //             "user": {
            //                 "id": 8,
            //                 "username": "ngdeva99",
            //                 "email": "ngdeva99@gmail.com",
            //                 "avatar_url": "https://avatars.githubusercontent.com/u/31466229?v=4",
            //                 "created_at": "2025-05-19T02:45:40.372Z"
            //             }
            //         }
            //     }
            // }

            console.log('Response data:', response.data.data);

            if (response.success && response.data && response.data.data && response.data.data.user) {
                console.log('Login successful, user data:', response.data.data.user);
                setUser(response.data.data.user);
                setIsAuthenticated(true);
                return { success: true };
            } else {
                console.error('Invalid profile response:', response);
                throw new Error('Invalid user data received');
            }
        } catch (error) {
            console.error('Login error:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            // If token is invalid, clear everything
            logout();
            return {
                success: false,
                error: error.message || 'Login failed'
            };
        }
    };

    const logout = () => {
        console.log('Logging out...');
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