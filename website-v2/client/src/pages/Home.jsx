// src/pages/Home.jsx - Home Page
import React from 'react';
import { useAppContext } from '../context/AppContext';
import CategoryCard from '../components/CategoryCard';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Home = () => {
  const { categories, loading, error } = useAppContext();
  
  if (loading) return <div className="loading">Loading categories...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  
  return (
    <div className="home-page">
      <Header />
      <main className="container">
        <h2 className="section-title">Browse Research Categories</h2>
        <div className="categories-grid">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;