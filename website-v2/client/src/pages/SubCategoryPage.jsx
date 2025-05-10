import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { fetchPapers } from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PaperCard from '../components/PaperCard';

const SubcategoryPage = () => {
  const { categorySlug, subcategorySlug } = useParams();
  const { categories } = useAppContext();
  
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const category = categories.find((cat) => cat.slug === categorySlug);
  const subcategory = category?.subcategories.find((sub) => sub.slug === subcategorySlug);
  
  // Generate an array of years from current year back to 5 years
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  
  useEffect(() => {
    const loadPapers = async () => {
      if (!category || !subcategory) return;
      
      try {
        setLoading(true);
        const papersData = await fetchPapers(categorySlug, subcategorySlug, selectedYear);
        setPapers(papersData);
      } catch (err) {
        setError(err.message);
        console.error('Error loading papers:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadPapers();
  }, [categorySlug, subcategorySlug, selectedYear, category, subcategory]);
  
  if (!category || !subcategory) return <div className="error">Category or subcategory not found</div>;
  
  return (
    <div className="subcategory-page">
      <Header />
      <main className="container">
        <nav className="breadcrumb">
          <Link to="/">Home</Link> / 
          <Link to={`/category/${category.slug}`}>{category.name}</Link> / 
          <span>{subcategory.name}</span>
        </nav>
        
        <div className="subcategory-header">
          <h1>{subcategory.name} Papers</h1>
          <p className="subcategory-description">{subcategory.description}</p>
        </div>
        
        <div className="year-filter">
          <div className="filter-label">Filter by Year:</div>
          <div className="year-tabs">
            {years.map((year) => (
              <button
                key={year}
                className={`year-tab ${selectedYear === year ? 'active' : ''}`}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        
        {loading ? (
          <div className="loading">Loading papers...</div>
        ) : error ? (
          <div className="error">Error: {error}</div>
        ) : papers.length === 0 ? (
          <div className="no-results">No papers found for this subcategory and year.</div>
        ) : (
          <div className="papers-grid">
            {papers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SubcategoryPage;