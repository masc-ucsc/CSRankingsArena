import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './contexts/AuthContext';

// Import pages
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import SubcategoryPage from './pages/SubCategoryPage';
import SubcategoryPageV2 from './pages/v2/SubCategoryPage';
import SearchPage from './pages/SearchPage';
import NotFoundPage from './pages/NotFoundPage';
import CategoryMatchPage from './pages/CategoryMatchPage';
import ApiDebugger from './components/ApiDebugger';
import AuthCallback from './components/auth/AuthCallback';
import Profile from './components/profile/Profile';

// Import competition components
import Dashboard from './components/competition/Dashboard';
import MatchComparison from './components/competition/MatchComparison';
import PaperBrowser from './components/competition/PaperBrowser';
import CreateMatch from './components/competition/CreateMatch';
import MatchDetail from './components/competition/MatchDetail';

// Import styles
import './styles/main.css';

const App = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          {/* Add ApiDebugger component for debugging network issues */}
          <ApiDebugger />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/category/:categorySlug/:subcategorySlug" element={<SubcategoryPage />} />
            <Route path="/v2/category/:categorySlug/:subcategorySlug" element={<SubcategoryPageV2 />} />
            <Route path="/category/:categorySlug/match" element={<CategoryMatchPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/competition" element={<Dashboard />} />
            <Route path="/competition/matches/:matchId" element={<MatchComparison />} />
            <Route path="/competition/papers" element={<PaperBrowser />} />
            <Route path="/competition/create" element={<CreateMatch />} />
            <Route path="/matches/:matchId" element={<MatchDetail />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;