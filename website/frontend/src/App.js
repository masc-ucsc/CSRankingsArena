import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  Navbar, 
  Container, 
  Nav,
  Spinner
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// Import components
import Dashboard from './pages/Dashboard';
import LeaderboardPage from './pages/LeaderboardPage';
import PapersPage from './pages/PapersPage';
import MatchesPage from './pages/MatchesPage';
import MatchDetailsPage from './pages/MatchDetailsPage';
import TournamentPage from './pages/TournamentPage';
import ResearchNetworkPage from './pages/ResearchNetworkPage';
import PaperDetailsPage from './pages/PaperDetailsPage';

// Import API service
import api from './services/api';

function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    papers: [],
    matches: [],
    leaderboard: []
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // In a production environment, we would use the real API
        // For now, we'll use mock data for demonstration
        const mockData = api.fetchMockData();
        
        setData({
          papers: mockData.papers,
          matches: mockData.matches,
          leaderboard: mockData.leaderData
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Router>
      <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
        <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
          <Container>
            <Navbar.Brand as={Link} to="/">Paper Evaluation League</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/leaderboard">Leaderboard</Nav.Link>
                <Nav.Link as={Link} to="/papers">Papers</Nav.Link>
                <Nav.Link as={Link} to="/matches">Matches</Nav.Link>
                <Nav.Link as={Link} to="/tournaments">Tournaments</Nav.Link>
                <Nav.Link as={Link} to="/network">Research Network</Nav.Link>
              </Nav>
              <Nav>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <main className="flex-grow-1 bg-light">
          <Container className="py-4">
            <Routes>
              <Route 
                path="/" 
                element={<Dashboard 
                  papers={data.papers}
                  matches={data.matches}
                  leaderboard={data.leaderboard}
                />} 
              />
              <Route 
                path="/leaderboard" 
                element={<LeaderboardPage 
                  leaderboard={data.leaderboard}
                />} 
              />
              <Route 
                path="/papers" 
                element={<PapersPage 
                  papers={data.papers}
                />} 
              />
              <Route 
                path="/papers/:id" 
                element={<PaperDetailsPage />} 
              />
              <Route 
                path="/matches" 
                element={<MatchesPage 
                  matches={data.matches}
                />} 
              />
              <Route 
                path="/matches/:id" 
                element={<MatchDetailsPage />} 
              />
              <Route 
                path="/tournaments" 
                element={<TournamentPage />} 
              />
              <Route 
                path="/network" 
                element={<ResearchNetworkPage 
                  papers={data.papers}
                />} 
              />
            </Routes>
          </Container>
        </main>

        <footer className="bg-dark text-white py-4">
          <Container>
            <div className="d-flex flex-column flex-md-row justify-content-between">
              <div>
                <h5>Paper Evaluation League</h5>
                <p className="mb-0">AI-powered research paper evaluation system</p>
              </div>
              <div>
                <h5>Links</h5>
                <ul className="list-unstyled">
                  <li><Link to="/" className="text-white">Home</Link></li>
                  <li><Link to="/about" className="text-white">About</Link></li>
                  <li><a href="https://github.com/your-username/paper-evaluation-league" className="text-white" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                </ul>
              </div>
            </div>
            <hr className="my-3" />
            <div className="text-center">
              <p className="mb-0">&copy; {new Date().getFullYear()} Paper Evaluation League. All rights reserved.</p>
            </div>
          </Container>
        </footer>
      </div>
    </Router>
  );
}

export default App;