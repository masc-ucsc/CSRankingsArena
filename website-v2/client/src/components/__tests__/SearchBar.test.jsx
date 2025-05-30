import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SearchBar from '../SearchBar';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('SearchBar Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders search input correctly', () => {
    render(
      <BrowserRouter>
        <SearchBar />
      </BrowserRouter>
    );
    
    expect(screen.getByPlaceholderText('Search by title...')).toBeInTheDocument();
  });

  it('updates input value when typing', () => {
    render(
      <BrowserRouter>
        <SearchBar />
      </BrowserRouter>
    );
    
    const searchInput = screen.getByPlaceholderText('Search by title...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    expect(searchInput.value).toBe('test query');
  });

  it('navigates to search page with query when searching', () => {
    render(
      <BrowserRouter>
        <SearchBar />
      </BrowserRouter>
    );
    
    const searchInput = screen.getByPlaceholderText('Search by title...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.click(screen.getByRole('button'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20query');
  });

  it('does not navigate when search query is empty', () => {
    render(
      <BrowserRouter>
        <SearchBar />
      </BrowserRouter>
    );
    
    const searchInput = screen.getByPlaceholderText('Search by title...');
    fireEvent.change(searchInput, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button'));
    
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('clears input when clear button is clicked', () => {
    render(
      <BrowserRouter>
        <SearchBar />
      </BrowserRouter>
    );
    
    const searchInput = screen.getByPlaceholderText('Search by title...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    
    expect(searchInput.value).toBe('');
  });
}); 