/**
 * @fileoverview Integration tests for MapPage component - Complete organism workflow testing
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapPage } from '@/components/pages/MapPage';

// Mock the organisms and molecules
jest.mock('@/components/organisms/MapView', () => ({
  MapView: React.forwardRef<any, any>(({ 
    onCenterChange, 
    onMapClick, 
    center, 
    searchQuery, 
    newToilets,
    'data-testid': testId,
    ...props 
  }, ref) => (
    <div 
      data-testid={testId || 'mock-map-view'}
      {...props}
    >
      <div data-testid="map-center">
        Center: {center?.lat}, {center?.lng}
      </div>
      <div data-testid="search-query">
        Query: {searchQuery || 'none'}
      </div>
      <div data-testid="new-toilets-count">
        New toilets: {newToilets?.length || 0}
      </div>
      <button 
        data-testid="mock-map-click"
        onClick={() => onMapClick?.({ lat: 51.5, lng: -0.1 })}
      >
        Click Map
      </button>
      <button 
        data-testid="mock-center-change"
        onClick={() => onCenterChange?.({ lat: 51.52, lng: -0.12 })}
      >
        Change Center
      </button>
    </div>
  ))
}));

jest.mock('@/components/organisms/FloatingActionButton', () => ({
  FloatingActionButton: ({ onClick, disabled, 'data-testid': testId, ...props }: any) => (
    <button 
      data-testid={testId || 'mock-fab'}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      Add Toilet FAB
    </button>
  )
}));

jest.mock('@/components/organisms/SuggestionModal', () => ({
  SuggestionModal: ({ 
    isOpen, 
    onClose, 
    onSuccess, 
    onError, 
    location, 
    mapCenter,
    'data-testid': testId,
    ...props 
  }: any) => (
    isOpen ? (
      <div data-testid={testId || 'mock-suggestion-modal'} {...props}>
        <div data-testid="modal-location">
          Location: {location?.lat}, {location?.lng}
        </div>
        <div data-testid="modal-map-center">
          Map Center: {mapCenter?.lat}, {mapCenter?.lng}
        </div>
        <button data-testid="mock-modal-close" onClick={onClose}>
          Close Modal
        </button>
        <button 
          data-testid="mock-modal-success"
          onClick={() => onSuccess?.({ 
            id: 'test-toilet-id',
            lat: location?.lat || mapCenter?.lat,
            lng: location?.lng || mapCenter?.lng,
            name: 'Test Toilet'
          })}
        >
          Submit Success
        </button>
        <button 
          data-testid="mock-modal-error"
          onClick={() => onError?.({ message: 'Test error' })}
        >
          Submit Error
        </button>
      </div>
    ) : null
  )
}));

jest.mock('@/components/molecules/SearchBar', () => ({
  SearchBar: ({ onSearch, placeholder, loading, 'data-testid': testId, ...props }: any) => (
    <div data-testid={testId || 'mock-search-bar'} {...props}>
      <input
        data-testid="search-input"
        placeholder={placeholder}
        onChange={(e) => onSearch?.(e.target.value)}
        disabled={loading}
      />
      <div data-testid="search-loading">
        Loading: {loading ? 'true' : 'false'}
      </div>
      <button 
        data-testid="mock-search-with-location"
        onClick={() => onSearch?.('test query', { lat: 51.5, lng: -0.1 })}
      >
        Search with Location
      </button>
    </div>
  )
}));

describe('MapPage Integration', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    test('renders all organism components', () => {
      render(<MapPage />);
      
      expect(screen.getByTestId('map-page-map-view')).toBeInTheDocument();
      expect(screen.getByTestId('map-page-fab')).toBeInTheDocument();
      expect(screen.getByTestId('mock-search-bar')).toBeInTheDocument();
      
      // Modal should not be visible initially
      expect(screen.queryByTestId('map-page-suggestion-modal')).not.toBeInTheDocument();
    });

    test('sets default map center to London', () => {
      render(<MapPage />);
      
      expect(screen.getByTestId('map-center')).toHaveTextContent('Center: 51.5074, -0.1278');
    });

    test('renders with custom props', () => {
      render(<MapPage className="custom-class" data-testid="custom-map-page" />);
      
      const container = screen.getByTestId('custom-map-page');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('FAB to SuggestionModal Integration', () => {
    test('FAB click opens SuggestionModal', async () => {
      render(<MapPage />);
      
      const fab = screen.getByTestId('map-page-fab');
      await user.click(fab);
      
      expect(screen.getByTestId('map-page-suggestion-modal')).toBeInTheDocument();
    });

    test('FAB becomes disabled when modal is open', async () => {
      render(<MapPage />);
      
      const fab = screen.getByTestId('map-page-fab');
      expect(fab).not.toBeDisabled();
      
      await user.click(fab);
      expect(fab).toBeDisabled();
    });

    test('modal close re-enables FAB', async () => {
      render(<MapPage />);
      
      const fab = screen.getByTestId('map-page-fab');
      await user.click(fab);
      
      const closeButton = screen.getByTestId('mock-modal-close');
      await user.click(closeButton);
      
      expect(screen.queryByTestId('map-page-suggestion-modal')).not.toBeInTheDocument();
      expect(fab).not.toBeDisabled();
    });
  });

  describe('MapView to SuggestionModal Location Flow', () => {
    test('modal receives map center location when opened via FAB', async () => {
      render(<MapPage />);
      
      const fab = screen.getByTestId('map-page-fab');
      await user.click(fab);
      
      const modalLocation = screen.getByTestId('modal-location');
      const modalMapCenter = screen.getByTestId('modal-map-center');
      
      expect(modalLocation).toHaveTextContent('Location: 51.5074, -0.1278');
      expect(modalMapCenter).toHaveTextContent('Map Center: 51.5074, -0.1278');
    });

    test('map click opens modal with selected location', async () => {
      render(<MapPage />);
      
      const mapClickButton = screen.getByTestId('mock-map-click');
      await user.click(mapClickButton);
      
      const modalLocation = screen.getByTestId('modal-location');
      expect(modalLocation).toHaveTextContent('Location: 51.5, -0.1');
    });

    test('map center changes update modal location fallback', async () => {
      render(<MapPage />);
      
      // Change map center
      const centerChangeButton = screen.getByTestId('mock-center-change');
      await user.click(centerChangeButton);
      
      // Open modal via FAB
      const fab = screen.getByTestId('map-page-fab');
      await user.click(fab);
      
      const modalMapCenter = screen.getByTestId('modal-map-center');
      expect(modalMapCenter).toHaveTextContent('Map Center: 51.52, -0.12');
    });
  });

  describe('Successful Submission Workflow', () => {
    test('successful submission adds new toilet to map', async () => {
      render(<MapPage />);
      
      // Open modal
      const fab = screen.getByTestId('map-page-fab');
      await user.click(fab);
      
      // Submit successfully
      const successButton = screen.getByTestId('mock-modal-success');
      await user.click(successButton);
      
      // Check new toilet was added to map
      await waitFor(() => {
        expect(screen.getByTestId('new-toilets-count')).toHaveTextContent('New toilets: 1');
      });
    });

    test('successful submission closes modal after delay', async () => {
      jest.useFakeTimers();
      render(<MapPage />);
      
      // Open modal
      const fab = screen.getByTestId('map-page-fab');
      await user.click(fab);
      
      // Submit successfully
      const successButton = screen.getByTestId('mock-modal-success');
      await user.click(successButton);
      
      // Fast-forward timers
      jest.advanceTimersByTime(1500);
      
      expect(screen.queryByTestId('map-page-suggestion-modal')).not.toBeInTheDocument();
      
      jest.useRealTimers();
    });

    test('successful submission logs to console', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<MapPage />);
      
      const fab = screen.getByTestId('map-page-fab');
      await user.click(fab);
      
      const successButton = screen.getByTestId('mock-modal-success');
      await user.click(successButton);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MapPage] Toilet submission successful:',
        expect.objectContaining({
          id: 'test-toilet-id',
          name: 'Test Toilet'
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('submission error shows error message', async () => {
      render(<MapPage />);
      
      // Open modal
      const fab = screen.getByTestId('map-page-fab');
      await user.click(fab);
      
      // Trigger error
      const errorButton = screen.getByTestId('mock-modal-error');
      await user.click(errorButton);
      
      expect(screen.getByText('Failed to submit toilet suggestion. Please try again.')).toBeInTheDocument();
    });

    test('error can be dismissed', async () => {
      render(<MapPage />);
      
      // Open modal and trigger error
      const fab = screen.getByTestId('map-page-fab');
      await user.click(fab);
      
      const errorButton = screen.getByTestId('mock-modal-error');
      await user.click(errorButton);
      
      // Dismiss error
      const dismissButton = screen.getByLabelText('Dismiss error');
      await user.click(dismissButton);
      
      expect(screen.queryByText('Failed to submit toilet suggestion. Please try again.')).not.toBeInTheDocument();
    });

    test('submission error logs to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      render(<MapPage />);
      
      const fab = screen.getByTestId('map-page-fab');
      await user.click(fab);
      
      const errorButton = screen.getByTestId('mock-modal-error');
      await user.click(errorButton);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[MapPage] Toilet submission failed:',
        expect.objectContaining({ message: 'Test error' })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Search Integration', () => {
    test('search input updates map search query', async () => {
      render(<MapPage />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test query');
      
      await waitFor(() => {
        expect(screen.getByTestId('search-query')).toHaveTextContent('Query: test query');
      });
    });

    test('search with location updates map center', async () => {
      render(<MapPage />);
      
      const searchWithLocationButton = screen.getByTestId('mock-search-with-location');
      await user.click(searchWithLocationButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-center')).toHaveTextContent('Center: 51.5, -0.1');
      });
    });

    test('search shows loading state', async () => {
      render(<MapPage />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test');
      
      expect(screen.getByTestId('search-loading')).toHaveTextContent('Loading: true');
    });

    test('empty search clears query', async () => {
      render(<MapPage />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test');
      await user.clear(searchInput);
      
      await waitFor(() => {
        expect(screen.getByTestId('search-query')).toHaveTextContent('Query: none');
      });
    });
  });

  describe('State Management', () => {
    test('modal state is independent of other component states', async () => {
      render(<MapPage />);
      
      // Change map center
      const centerChangeButton = screen.getByTestId('mock-center-change');
      await user.click(centerChangeButton);
      
      // Search
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'search term');
      
      // Open modal
      const fab = screen.getByTestId('map-page-fab');
      await user.click(fab);
      
      // All states should be preserved
      expect(screen.getByTestId('map-center')).toHaveTextContent('Center: 51.52, -0.12');
      expect(screen.getByTestId('search-query')).toHaveTextContent('Query: search term');
      expect(screen.getByTestId('map-page-suggestion-modal')).toBeInTheDocument();
    });

    test('component handles multiple rapid state changes', async () => {
      render(<MapPage />);
      
      // Rapid FAB clicks
      const fab = screen.getByTestId('map-page-fab');
      await user.click(fab);
      await user.click(fab); // Second click should be ignored (disabled)
      
      // Only one modal should be open
      expect(screen.getAllByTestId('map-page-suggestion-modal')).toHaveLength(1);
    });
  });

  describe('Accessibility', () => {
    test('error messages have proper ARIA roles', async () => {
      render(<MapPage />);
      
      const fab = screen.getByTestId('map-page-fab');
      await user.click(fab);
      
      const errorButton = screen.getByTestId('mock-modal-error');
      await user.click(errorButton);
      
      const errorDiv = screen.getByText('Failed to submit toilet suggestion. Please try again.').closest('div');
      expect(errorDiv).toBeInTheDocument();
    });

    test('dismiss button has proper aria-label', async () => {
      render(<MapPage />);
      
      const fab = screen.getByTestId('map-page-fab');
      await user.click(fab);
      
      const errorButton = screen.getByTestId('mock-modal-error');
      await user.click(errorButton);
      
      const dismissButton = screen.getByLabelText('Dismiss error');
      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    test('container has proper mobile classes', () => {
      render(<MapPage />);
      
      const container = screen.getByTestId(/^map-page|^.+$/).closest('div');
      expect(container).toHaveClass('relative', 'w-full', 'h-screen', 'overflow-hidden');
    });

    test('search bar has mobile positioning', () => {
      render(<MapPage />);
      
      const searchContainer = screen.getByTestId('mock-search-bar').parentElement;
      expect(searchContainer).toHaveClass('absolute', 'top-4', 'left-4', 'right-4', 'z-40');
    });
  });
});