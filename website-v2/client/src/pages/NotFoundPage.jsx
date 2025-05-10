import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => (
  <header className="site-header">
    <div className="logo">
      <h1>CS RankingsArena</h1>
      <p className="subtitle">Discover Top Computer Science Research Papers</p>
    </div>
  </header>
);

const Footer = () => (
  <footer>
    <p>CS RankingsArena - A demonstration for CSE247B</p>
  </footer>
);

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <Header />
      
      <main className="container">
        <div className="not-found-content">
          <h1>404 - Page Not Found</h1>
          <p>The page you are looking for does not exist or has been moved.</p>
          <Link to="/" className="back-link">Return to Home</Link>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFoundPage;