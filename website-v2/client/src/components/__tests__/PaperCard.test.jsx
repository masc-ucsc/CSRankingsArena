import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PaperCard from '../PaperCard';

const mockPaper = {
  title: 'Test Paper Title',
  url: 'https://example.com/paper',
  references: 'Author One, Author Two, Author Three. Conference Name.',
  abstract: 'This is a test abstract for the paper.',
  year: '2023',
  category: 'AI',
  subcategory: 'Machine Learning',
  ranking: {
    rank: 1,
    score: 95,
    winRate: 0.85,
    matches: 20
  }
};

describe('PaperCard Component', () => {
  it('renders paper title correctly', () => {
    render(<PaperCard paper={mockPaper} />);
    expect(screen.getByText('Test Paper Title')).toBeInTheDocument();
  });

  it('renders authors correctly', () => {
    render(<PaperCard paper={mockPaper} />);
    expect(screen.getByText('Author One et al.')).toBeInTheDocument();
  });

  it('renders abstract correctly', () => {
    render(<PaperCard paper={mockPaper} />);
    expect(screen.getByText('This is a test abstract for the paper.')).toBeInTheDocument();
  });

  it('renders tags correctly', () => {
    render(<PaperCard paper={mockPaper} />);
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
  });

  it('renders ranking information correctly', () => {
    render(<PaperCard paper={mockPaper} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('handles paper selection for match', () => {
    const onSelectForMatch = jest.fn();
    render(
      <PaperCard 
        paper={mockPaper} 
        showMatchButton={true}
        onSelectForMatch={onSelectForMatch}
      />
    );
    
    const selectButton = screen.getByText('Select for Match');
    fireEvent.click(selectButton);
    expect(onSelectForMatch).toHaveBeenCalledWith('paper1');
  });

  it('handles paper deselection', () => {
    const onSelectForMatch = jest.fn();
    render(
      <PaperCard 
        paper={mockPaper} 
        showMatchButton={true}
        selectedForMatch="paper1"
        onSelectForMatch={onSelectForMatch}
      />
    );
    
    const deselectButton = screen.getByText('Selected');
    fireEvent.click(deselectButton);
    expect(onSelectForMatch).toHaveBeenCalledWith(null);
  });

  it('opens paper URL in new tab', () => {
    const originalOpen = window.open;
    window.open = jest.fn();
    
    render(<PaperCard paper={mockPaper} />);
    const viewButton = screen.getByText('View Paper');
    fireEvent.click(viewButton);
    
    expect(window.open).toHaveBeenCalledWith('https://example.com/paper', '_blank');
    window.open = originalOpen;
  });

  it('handles missing abstract gracefully', () => {
    const paperWithoutAbstract = { ...mockPaper, abstract: null };
    render(<PaperCard paper={paperWithoutAbstract} />);
    expect(screen.getByText('No abstract available')).toBeInTheDocument();
  });

  it('handles missing authors gracefully', () => {
    const paperWithoutAuthors = { ...mockPaper, references: null };
    render(<PaperCard paper={paperWithoutAuthors} />);
    expect(screen.getByText('Unknown Authors')).toBeInTheDocument();
  });

  it('applies selected styles when paper is selected', () => {
    render(
      <PaperCard 
        paper={mockPaper} 
        showMatchButton={true}
        selectedForMatch="paper1"
      />
    );
    
    const card = screen.getByText('Test Paper Title').closest('.paper-card');
    expect(card).toHaveClass('selected');
  });
}); 