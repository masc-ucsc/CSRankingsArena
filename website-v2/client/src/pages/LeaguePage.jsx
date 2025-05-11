// src/pages/LeaguePage.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const LeaguePage = () => {
  const { category } = useParams();
  const [papers, setPapers] = useState([]);

  useEffect(() => {
    axios.get(`/api/league/${category}`).then((response) => {
      setPapers(response.data);
    });
  }, [category]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">{category} League</h2>
      <ul>
        {papers.map((paper) => (
          <li key={paper.id} className="mb-2">
            {paper.paper_title} - Score: {paper.score}
            <Link to={`/compare/${paper.id}/1`} className="ml-4 text-blue-500">
              Compare
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LeaguePage;
