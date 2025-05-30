import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Spin, Result } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

const AuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                console.log('Processing auth callback...');
                const params = new URLSearchParams(location.search);
                const token = params.get('token');
                const error = params.get('error');
                const redirect = params.get('redirect') || '/';

                console.log('Auth callback params:', {
                    hasToken: !!token,
                    tokenLength: token?.length,
                    error,
                    redirect
                });

                if (error) {
                    console.error('Auth error:', error);
                    navigate(`/?error=${error}`);
                    return;
                }

                if (!token) {
                    console.error('No token received');
                    navigate('/?error=no_token');
                    return;
                }

                // Store token in localStorage before attempting login
                console.log('Storing token in localStorage...');
                localStorage.setItem('token', token);

                // Attempt to login with the token
                console.log('Attempting login with token...');
                const result = await login(token);
                console.log('Login result:', result);

                if (result.success) {
                    // Restore any stored state
                    const storedState = sessionStorage.getItem('authRedirectState');
                    if (storedState) {
                        try {
                            const state = JSON.parse(storedState);
                            console.log('Restoring stored state:', state);
                            
                            // Clear the stored state
                            sessionStorage.removeItem('authRedirectState');
                            
                            // Navigate to the stored path
                            navigate(state.path);
                            return;
                        } catch (e) {
                            console.error('Error parsing stored state:', e);
                            sessionStorage.removeItem('authRedirectState');
                        }
                    }

                    // If no stored state, use the redirect parameter
                    console.log('Navigating to:', redirect);
                    navigate(redirect);
                } else {
                    console.error('Login failed:', result.error);
                    navigate(`/?error=${result.error}`);
                }
            } catch (error) {
                console.error('Auth callback error:', error);
                navigate('/?error=auth_failed');
            }
        };

        handleCallback();
    }, [location, navigate, login]);

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
        }}>
            <Spin size="large" tip="Completing authentication..." />
        </div>
    );
};

export default AuthCallback; 