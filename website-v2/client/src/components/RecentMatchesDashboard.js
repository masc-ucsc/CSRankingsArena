import React, { useEffect, useState } from 'react';

const cardStyle = {
  border: '1px solid #e0e0e0',
  borderRadius: 8,
  padding: 16,
  margin: '12px 0',
  boxShadow: '0 2px 8px #f0f0f0',
  background: '#fff'
};

const RecentMatchesDashboard = ({ subcategory }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/mock/matches?category=ai&subcategory=${subcategory}`)
      .then((res) => res.json())
      .then((data) => {
         setMatches(data.matches || []);
         setLoading(false);
      });
  }, [subcategory]);

  if (loading) return <div>Loading recent matches...</div>;

  return (
    <div>
      <h2>Recent Matches (Subcategory: {subcategory})</h2>
      {matches.map((match) => (
        <div key={match.id} style={cardStyle}>
          <div>
            <strong>{match.paper1.title}</strong> vs <strong>{match.paper2.title}</strong>
          </div>
          <div style={{ fontSize: 13, color: '#888' }}>
            Winner: <b>{match.winner === match.paper1.id ? match.paper1.title : match.paper2.title}</b>
            <br />
            Date: {new Date(match.timestamp).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentMatchesDashboard; 