import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Import pages
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import SubcategoryPage from './pages/SubCategoryPage'; // Fixed case sensitivity issue
import SearchPage from './pages/SearchPage';
import NotFoundPage from './pages/NotFoundPage';
import ApiDebugger from './components/ApiDebugger';

// Import styles
import './styles/main.css';

const App = () => {
  return (
    <AppProvider>
      <Router>
        {/* Add ApiDebugger component for debugging network issues */}
        <ApiDebugger />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/category/:categorySlug/:subcategorySlug" element={<SubcategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;