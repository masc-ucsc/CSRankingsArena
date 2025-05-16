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
            const params = new URLSearchParams(location.search);
            const token = params.get('token');
            const error = params.get('error');

            if (error) {
                navigate('/?error=auth_failed');
                return;
            }

            if (token) {
                try {
                    await login(token);
                    const redirectTo = params.get('redirect') || '/';
                    navigate(redirectTo);
                } catch (err) {
                    navigate('/?error=auth_failed');
                }
            } else {
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