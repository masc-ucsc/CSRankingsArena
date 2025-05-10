// src/components/Header.jsx - Site Header
import React from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';

const Header = () => {
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
          <SearchBar />
        </div>
      </div>
    </header>
  );
};

export default Header;