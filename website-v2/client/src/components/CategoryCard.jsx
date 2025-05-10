
// src/components/CategoryCard.jsx - Category Card Component
import React from 'react';
import { Link } from 'react-router-dom';

const CategoryCard = ({ category }) => {
  return (
    <Link to={`/category/${category.slug}`} className="category-card">
      <div className="card-header" style={{ backgroundColor: category.color || '#3498db' }}>
        <h2>{category.name}</h2>
      </div>
      <div className="card-body">
        <p>{category.description}</p>
        <div className="subcategory-preview">
          {category.subcategories.slice(0, 3).map((subcategory) => (
            <span key={subcategory.slug} className="tag">
              {subcategory.name}
            </span>
          ))}
          {category.subcategories.length > 3 && (
            <span className="more-tag">+{category.subcategories.length - 3} more</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;