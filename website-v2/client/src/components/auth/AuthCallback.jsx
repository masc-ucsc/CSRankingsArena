import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Spin, Result, message } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

const AuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const params = new URLSearchParams(location.search);
            const token = params.get('token');
            const error = params.get('error');

            if (error) {
                message.error('Failed to authenticate with GitHub');
                navigate('/?error=auth_failed');
                return;
            }

            if (token) {
                try {
                    await login(token);
                    message.success('Successfully logged in with GitHub');
                    
                    // Redirect to the original destination or home
                    const redirectTo = params.get('redirect') || '/';
                    navigate(redirectTo);
                } catch (err) {
                    console.error('Auth callback error:', err);
                    message.error('Failed to complete authentication');
                    navigate('/?error=auth_failed');
                }
            } else {
                message.error('No authentication token received');
                navigate('/?error=no_token');
            }
        };

        handleCallback();
    }, [location, login, navigate]);

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)'
        }}>
            <Result
                icon={<Spin size="large" />}
                title="Completing authentication..."
                subTitle="Please wait while we log you in"
            />
        </div>
    );
};

export default AuthCallback; 