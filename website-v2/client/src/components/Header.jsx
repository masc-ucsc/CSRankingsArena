// src/components/Header.jsx - Site Header
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Avatar, Dropdown, Space } from 'antd';
import { 
  MenuOutlined, 
  SearchOutlined, 
  GithubOutlined, 
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import SearchBar from './SearchBar';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isCompetitionRoute = location.pathname.startsWith('/competition');
  const isHomePage = location.pathname === '/';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogin = () => {
    // Store current location for redirect after login
    const currentPath = location.pathname + location.search;
    const redirectUrl = encodeURIComponent(currentPath);
    
    // Redirect to GitHub OAuth using full server URL
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v2';
    window.location.href = `${serverUrl}/auth/github?redirect=${redirectUrl}`;
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <Link to="/profile">
          <Space>
            <UserOutlined />
            Profile
          </Space>
        </Link>
      )
    },
    {
      key: 'logout',
      label: (
        <a onClick={logout}>
          <Space>
            <LogoutOutlined />
            Logout
          </Space>
        </a>
      )
    }
  ];

  const navItems = [
    {
      key: 'home',
      label: (
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          <Space>
            <HomeOutlined />
            Home
          </Space>
        </Link>
      )
    },
    {
      key: 'about',
      label: (
        <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>
          <Space>
            <RobotOutlined />
            About
          </Space>
        </Link>
      )
    }
  ];

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-content">
          <div className="header-main">
            <div className="logo">
              <Link to="/">
                <h1>CS RankingsArena</h1>
              </Link>
              <p className="subtitle">AI-Powered Research Paper Analysis</p>
            </div>
            
            <button className="mobile-menu-toggle" onClick={toggleMenu}>
              <MenuOutlined />
            </button>
          </div>

          <nav className={`main-nav ${isMenuOpen ? 'active' : ''}`}>
            <ul className="nav-links">
              {navItems.map(item => (
                <li key={item.key}>
                  {item.label}
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions">
            {isHomePage && (
              <div className="header-search">
                <SearchBar />
              </div>
            )}
            
            <div className="auth-section">
              {isAuthenticated ? (
                <Dropdown
                  menu={{ items: userMenuItems }}
                  placement="bottomRight"
                  trigger={['click']}
                >
                  <Space className="user-avatar">
                    <Avatar 
                      src={user?.avatar_url} 
                      icon={<UserOutlined />}
                    />
                    <span className="username">{user?.username || user?.login}</span>
                  </Space>
                </Dropdown>
              ) : (
                <Button
                  type="primary"
                  icon={<GithubOutlined />}
                  onClick={handleLogin}
                  className="login-button"
                >
                  Login with GitHub
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;