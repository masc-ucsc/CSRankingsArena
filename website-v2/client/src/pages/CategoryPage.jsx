import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CategoryPage = () => {
  const { slug } = useParams();
  const { categories, loading, error } = useAppContext();
  
  if (loading) return <div className="loading">Loading category...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  
  const category = categories.find((cat) => cat.slug === slug);
  if (!category) return <div className="error">Category not found</div>;
  
  return (
    <div className="category-page">
      <Header />
      <main className="container">
        <nav className="breadcrumb">
          <Link to="/">Home</Link> / <span>{category.name}</span>
        </nav>
        
        <div className="category-header">
          <h1>{category.name}</h1>
          <p className="category-description">{category.description}</p>
        </div>
        
        <h2 className="section-title">Subcategories</h2>
        <div className="subcategories-grid">
          {category.subcategories.map((subcategory) => (
            <Link 
              key={subcategory.slug} 
              to={`/category/${category.slug}/${subcategory.slug}`}
              className="subcategory-card"
            >
              <h3>{subcategory.name}</h3>
              <p>{subcategory.description}</p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryPage;