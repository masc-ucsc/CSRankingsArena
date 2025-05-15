// src/components/Header.jsx - Site Header
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import { List, X } from 'react-bootstrap-icons';

const Header = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isCompetitionRoute = location.pathname.startsWith('/competition');

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-content">
          <div className="header-main">
            <div className="logo">
              <Link to="/">
                <h1>CS RankingsArena</h1>
              </Link>
              <p className="subtitle">Discover Top Computer Science Research Papers</p>
            </div>
            
            <button className="mobile-menu-toggle" onClick={toggleMenu}>
              {isMenuOpen ? <X size={24} /> : <List size={24} />}
            </button>
          </div>

          <nav className={`main-nav ${isMenuOpen ? 'active' : ''}`}>
            <ul className="nav-links">
              <li>
                <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                  Home
                </Link>
              </li>
              <li className="nav-item-dropdown">
                <Link 
                  to="/competition" 
                  className={isCompetitionRoute ? 'active' : ''}
                >
                  Competition
                </Link>
                {isCompetitionRoute && (
                  <ul className="sub-nav">
                    <li>
                      <Link to="/competition" className={location.pathname === '/competition' ? 'active' : ''}>
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link to="/competition/create" className={location.pathname === '/competition/create' ? 'active' : ''}>
                        Create Match
                      </Link>
                    </li>
                    <li>
                      <Link to="/competition/papers" className={location.pathname === '/competition/papers' ? 'active' : ''}>
                        Browse Papers
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              <li>
                <Link to="/categories" className={location.pathname === '/categories' ? 'active' : ''}>
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className={location.pathname === '/leaderboard' ? 'active' : ''}>
                  Leaderboard
                </Link>
              </li>
            </ul>
          </nav>

          <div className="header-search">
            <SearchBar />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;