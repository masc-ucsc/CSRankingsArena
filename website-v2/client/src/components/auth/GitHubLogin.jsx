import React, { useContext, useEffect } from 'react';
import { Button, message } from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import API_CONFIG from '../../config/api';

const GitHubLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated } = useContext(AuthContext);

    useEffect(() => {
        // Handle OAuth callback
        const handleCallback = async () => {
            const params = new URLSearchParams(location.search);
            const token = params.get('token');
            const error = params.get('error');

            if (error) {
                message.error('Failed to authenticate with GitHub');
                navigate('/login');
                return;
            }

            if (token) {
                try {
                    // Store token and get user profile
                    await login(token);
                    message.success('Successfully logged in with GitHub');
                    
                    // Redirect to the original destination or home
                    const redirectTo = params.get('redirect') || '/';
                    navigate(redirectTo);
                } catch (err) {
                    message.error('Failed to complete authentication');
                    navigate('/login');
                }
            }
        };

        if (location.pathname === '/auth/callback') {
            handleCallback();
        }
    }, [location, login, navigate]);

    const handleLogin = () => {
        // Store current location for redirect after login
        const currentPath = location.pathname + location.search;
        const redirectUrl = encodeURIComponent(currentPath);
        
        // Redirect to GitHub OAuth
        window.location.href = `${API_CONFIG.baseURL}/auth/github?redirect=${redirectUrl}`;
    };

    if (isAuthenticated) {
        return null;
    }

    return (
        <Button
            type="primary"
            icon={<GithubOutlined />}
            onClick={handleLogin}
            size="large"
            style={{ 
                backgroundColor: '#24292e',
                borderColor: '#24292e',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}
        >
            Sign in with GitHub
        </Button>
    );
};

export default GitHubLogin; 