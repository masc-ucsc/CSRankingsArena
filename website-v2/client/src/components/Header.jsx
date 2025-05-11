// src/components/Header.jsx - Site Header
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';

const Header = () => {
  const location = useLocation();
  const isCompetitionRoute = location.pathname.startsWith('/competition');

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <Link to="/">
              <h1>CS RankingsArena</h1>
            </Link>
            <p className="subtitle">Discover Top Computer Science Research Papers</p>
          </div>
          <nav className="main-nav">
            <ul className="nav-links">
              <li>
                <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                  Home
                </Link>
              </li>
              <li>
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
            </ul>
          </nav>
          <SearchBar />
        </div>
      </div>
    </header>
  );
};

export default Header;