import React from 'react';

const PaperCard = ({ paper }) => {
  // Format the authors list
  const formatAuthors = (authors) => {
    if (!authors || authors.length === 0) return 'Unknown Authors';
    
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
    
    // If more than 2 authors, show first author + et al.
    return `${authors[0]} et al.`;
  };
  
  // Format the date
  const formatDate = (date) => {
    if (!date) return 'Unknown Date';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="paper-card">
      <h3 className="paper-title">
        <a href={paper.url} target="_blank" rel="noopener noreferrer">
          {paper.title}
        </a>
      </h3>
      <div className="paper-metadata">
        <p className="paper-authors">{formatAuthors(paper.authors)}</p>
        <p className="paper-date">{formatDate(paper.published)}</p>
      </div>
      <p className="paper-abstract">{paper.abstract}</p>
      <div className="paper-actions">
        <a
          href={paper.pdfUrl}
          className="btn btn-primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          PDF
        </a>
        <a
          href={paper.url}
          className="btn btn-secondary"
          target="_blank"
          rel="noopener noreferrer"
        >
          arXiv
        </a>
      </div>
    </div>
  );
};

export default PaperCard;