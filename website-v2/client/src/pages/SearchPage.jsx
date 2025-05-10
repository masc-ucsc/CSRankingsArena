import React from 'react';
import { Link } from 'react-router-dom';

const SearchPage = () => {
  return (
    <div className="search-page">
      <header>
        <h1>CS RankingsArena</h1>
      </header>
      
      <main>
        <h2>Search Results</h2>
        <p>This is a placeholder for search results.</p>
        <Link to="/">Return to Home</Link>
      </main>
      
      <footer>
        <p>CS RankingsArena - A demonstration</p>
      </footer>
    </div>
  );
};

export default SearchPage;