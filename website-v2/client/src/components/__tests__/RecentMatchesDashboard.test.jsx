import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RecentMatchesDashboard from '../RecentMatchesDashboard';

// Mock fetch
global.fetch = jest.fn();

const mockMatches = {
  matches: [
    {
      id: 1,
      paper1: {
        id: 'p1',
        title: 'Paper One'
      },
      paper2: {
        id: 'p2',
        title: 'Paper Two'
      },
      winner: 'p1',
      timestamp: '2024-03-15T10:00:00Z'
    },
    {
      id: 2,
      paper1: {
        id: 'p3',
        title: 'Paper Three'
      },
      paper2: {
        id: 'p4',
        title: 'Paper Four'
      },
      winner: 'p4',
      timestamp: '2024-03-15T11:00:00Z'
    }
  ]
};

describe('RecentMatchesDashboard Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders loading state initially', () => {
    render(<RecentMatchesDashboard subcategory="machine-learning" />);
    expect(screen.getByText('Loading recent matches...')).toBeInTheDocument();
  });

  it('fetches and displays matches', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockMatches)
      })
    );

    render(<RecentMatchesDashboard subcategory="machine-learning" />);

    // Wait for matches to load
    await waitFor(() => {
      expect(screen.getByText('Paper One')).toBeInTheDocument();
    });

    // Verify all matches are displayed
    expect(screen.getByText('Paper One')).toBeInTheDocument();
    expect(screen.getByText('Paper Two')).toBeInTheDocument();
    expect(screen.getByText('Paper Three')).toBeInTheDocument();
    expect(screen.getByText('Paper Four')).toBeInTheDocument();
  });

  it('displays correct winner information', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockMatches)
      })
    );

    render(<RecentMatchesDashboard subcategory="machine-learning" />);

    await waitFor(() => {
      expect(screen.getByText(/Winner: Paper One/)).toBeInTheDocument();
      expect(screen.getByText(/Winner: Paper Four/)).toBeInTheDocument();
    });
  });

  it('formats dates correctly', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockMatches)
      })
    );

    render(<RecentMatchesDashboard subcategory="machine-learning" />);

    await waitFor(() => {
      const dateElements = screen.getAllByText(/Date:/);
      expect(dateElements).toHaveLength(2);
    });
  });

  it('handles empty matches array', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ matches: [] })
      })
    );

    render(<RecentMatchesDashboard subcategory="machine-learning" />);

    await waitFor(() => {
      expect(screen.getByText('Recent Matches (Subcategory: machine-learning)')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('API Error'))
    );

    render(<RecentMatchesDashboard subcategory="machine-learning" />);

    await waitFor(() => {
      expect(screen.getByText('Recent Matches (Subcategory: machine-learning)')).toBeInTheDocument();
    });
  });

  it('refetches when subcategory changes', async () => {
    const { rerender } = render(<RecentMatchesDashboard subcategory="machine-learning" />);

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockMatches)
      })
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Change subcategory
    rerender(<RecentMatchesDashboard subcategory="deep-learning" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenLastCalledWith(
        expect.stringContaining('subcategory=deep-learning')
      );
    });
  });
}); 