/**
 * @fileoverview SearchBar component tests - Red phase TDD
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/molecules/SearchBar/SearchBar';

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(window.navigator, 'geolocation', {
  value: mockGeolocation,
  configurable: true,
});

describe('SearchBar Component', () => {
  const mockOnSearch = jest.fn();
  const mockOnLocationRequest = jest.fn();
  const mockOnClear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render search input with proper attributes', () => {
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByPlaceholderText('Search for toilets near...');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'search');
      expect(input).toHaveAttribute('aria-label', 'Search for locations');
    });

    it('should render search button with icon', () => {
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const button = screen.getByRole('button', { name: /search/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Search');
    });

    it('should render location button when showLocationButton is true', () => {
      render(<SearchBar onSearch={mockOnSearch} showLocationButton onLocationRequest={mockOnLocationRequest} />);
      
      const locationButton = screen.getByRole('button', { name: /use my location/i });
      expect(locationButton).toBeInTheDocument();
      expect(locationButton).toHaveAttribute('aria-label', 'Use my location');
    });

    it('should not render location button when showLocationButton is false', () => {
      render(<SearchBar onSearch={mockOnSearch} showLocationButton={false} />);
      
      const locationButton = screen.queryByRole('button', { name: /use my location/i });
      expect(locationButton).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<SearchBar onSearch={mockOnSearch} className="custom-search" />);
      
      const container = screen.getByTestId('search-bar');
      expect(container).toHaveClass('custom-search');
    });

    it('should show loading state', () => {
      render(<SearchBar onSearch={mockOnSearch} loading />);
      
      const input = screen.getByPlaceholderText('Search for toilets near...');
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      expect(input).toBeDisabled();
      expect(searchButton).toBeDisabled();
      expect(searchButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Interactions', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByPlaceholderText('Search for toilets near...');
      await act(async () => {
        await user.type(input, 'London Bridge');
      });
      
      expect(input).toHaveValue('London Bridge');
    });

    it('should call onSearch when form is submitted', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByPlaceholderText('Search for toilets near...');
      await act(async () => {
        await user.type(input, 'Kings Cross');
        await user.keyboard('{Enter}');
      });
      
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('Kings Cross');
    });

    it('should call onSearch when search button is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByPlaceholderText('Search for toilets near...');
      const searchButton = screen.getByRole('button', { name: /search/i });
      
      await act(async () => {
        await user.type(input, 'Victoria Station');
        await user.click(searchButton);
      });
      
      expect(mockOnSearch).toHaveBeenCalledTimes(1);
      expect(mockOnSearch).toHaveBeenCalledWith('Victoria Station');
    });

    it('should not call onSearch with empty input', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const searchButton = screen.getByRole('button', { name: /search/i });
      await act(async () => {
        await user.click(searchButton);
      });
      
      expect(mockOnSearch).not.toHaveBeenCalled();
    });

    it('should show clear button when input has value', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);
      
      const input = screen.getByPlaceholderText('Search for toilets near...');
      
      // Initially no clear button
      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
      
      // Type something
      await act(async () => {
        await user.type(input, 'Test');
      });
      
      // Clear button should appear
      const clearButton = await screen.findByRole('button', { name: /clear/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should clear input when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);
      
      const input = screen.getByPlaceholderText('Search for toilets near...');
      await act(async () => {
        await user.type(input, 'Test query');
      });
      
      const clearButton = await screen.findByRole('button', { name: /clear/i });
      await act(async () => {
        await user.click(clearButton);
      });
      
      await waitFor(() => expect(input).toHaveValue(''));
      expect(mockOnClear).toHaveBeenCalledTimes(1);
    });

    it('should handle location button click', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} showLocationButton onLocationRequest={mockOnLocationRequest} />);
      
      const locationButton = screen.getByRole('button', { name: /use my location/i });
      await act(async () => {
        await user.click(locationButton);
      });
      
      expect(mockOnLocationRequest).toHaveBeenCalledTimes(1);
    });

    it('should disable location button when loading', () => {
      render(<SearchBar onSearch={mockOnSearch} showLocationButton onLocationRequest={mockOnLocationRequest} loading />);
      
      const locationButton = screen.getByRole('button', { name: /use my location/i });
      expect(locationButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<SearchBar onSearch={mockOnSearch} showLocationButton onLocationRequest={mockOnLocationRequest} />);
      
      const form = screen.getByRole('search');
      expect(form).toBeInTheDocument();
      
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('aria-label', 'Search for locations');
      
      const searchButton = screen.getByRole('button', { name: /search/i });
      expect(searchButton).toHaveAttribute('type', 'submit');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} showLocationButton onLocationRequest={mockOnLocationRequest} />);
      
      const input = screen.getByPlaceholderText('Search for toilets near...');
      const searchButton = screen.getByRole('button', { name: /search/i });
      const locationButton = screen.getByRole('button', { name: /use my location/i });
      
      // Tab through elements
      await act(async () => {
        await user.tab();
      });
      expect(input).toHaveFocus();
      
      // Type into input before tabbing away
      await act(async () => {
        await user.type(input, 'test query');
      });
      await waitFor(() => expect(input).toHaveValue('test query'));
      
      await act(async () => {
        await user.tab();
      });
      expect(searchButton).toHaveFocus();
      
      await act(async () => {
        await user.tab();
      });
      expect(locationButton).toHaveFocus();
    });

    it('should announce loading state to screen readers', () => {
      const { rerender } = render(<SearchBar onSearch={mockOnSearch} />);
      
      // Initially not loading
      const searchButton = screen.getByRole('button', { name: /search/i });
      expect(searchButton).not.toHaveAttribute('aria-busy');
      
      // Set loading
      rerender(<SearchBar onSearch={mockOnSearch} loading />);
      expect(searchButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      render(<SearchBar onSearch={mockOnSearch} error="Location not found" />);
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Location not found');
    });

    it('should associate error with input using aria-describedby', () => {
      render(<SearchBar onSearch={mockOnSearch} error="Invalid search query" />);
      
      const input = screen.getByPlaceholderText('Search for toilets near...');
      const errorId = input.getAttribute('aria-describedby');
      
      expect(errorId).toBeTruthy();
      const errorElement = document.getElementById(errorId!);
      expect(errorElement).toHaveTextContent('Invalid search query');
    });
  });

  describe('Mobile Ergonomics', () => {
    it('should have touch-friendly minimum heights', () => {
      render(<SearchBar onSearch={mockOnSearch} showLocationButton onLocationRequest={mockOnLocationRequest} />);
      
      const input = screen.getByPlaceholderText('Search for toilets near...');
      const searchButton = screen.getByRole('button', { name: /search/i });
      const locationButton = screen.getByRole('button', { name: /use my location/i });
      
      // All interactive elements should have min-height of 44px
      expect(input).toHaveClass('min-h-[44px]');
      expect(searchButton).toHaveClass('min-h-[44px]');
      expect(locationButton).toHaveClass('min-h-[44px]');
    });

    it('should support different sizes', () => {
      const { rerender } = render(<SearchBar onSearch={mockOnSearch} size="sm" />);
      let input = screen.getByPlaceholderText('Search for toilets near...');
      expect(input).toHaveClass('h-9');
      
      rerender(<SearchBar onSearch={mockOnSearch} size="md" />);
      input = screen.getByPlaceholderText('Search for toilets near...');
      expect(input).toHaveClass('h-11');
      
      rerender(<SearchBar onSearch={mockOnSearch} size="lg" />);
      input = screen.getByPlaceholderText('Search for toilets near...');
      expect(input).toHaveClass('h-12');
    });
  });
});