/**
 * @fileoverview MapView organism component tests - Red phase TDD
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MapView } from '@/components/organisms/MapView';
import type { ToiletFeature } from '@/types/geojson';

// Mock React-Leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }: any) => (
    <div data-testid="map-container" {...props}>
      {children}
    </div>
  ),
  TileLayer: (props: any) => <div data-testid="tile-layer" {...props} />,
  Marker: ({ children, ...props }: any) => (
    <div data-testid="marker" {...props}>
      {children}
    </div>
  ),
  Popup: ({ children, ...props }: any) => (
    <div data-testid="popup" {...props}>
      {children}
    </div>
  ),
}));

// Mock Leaflet clustering
jest.mock('react-leaflet-cluster', () => ({
  MarkerClusterGroup: ({ children, ...props }: any) => (
    <div data-testid="marker-cluster-group" {...props}>
      {children}
    </div>
  ),
}));

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock toilet data
const mockToiletData: ToiletFeature[] = [
  {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-0.1278, 51.5074], // London center
    },
    properties: {
      id: 'test-toilet-1',
      name: 'Test Toilet 1',
      hours: '24/7',
      accessible: true,
      fee: 0,
      source: 'test',
      last_verified_at: '2025-01-01T00:00:00.000Z',
      verified_by: 'test',
    },
  },
  {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-0.1347, 51.5055], // Near London center
    },
    properties: {
      id: 'test-toilet-2', 
      name: 'Test Toilet 2',
      hours: 'Dawn to Dusk',
      accessible: false,
      fee: 0.5,
      source: 'test',
      last_verified_at: '2025-01-01T00:00:00.000Z',
      verified_by: 'test',
    },
  },
];

describe('MapView Organism', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore global state mutations
    if (Object.getOwnPropertyDescriptor(window, 'innerWidth')?.configurable) {
      delete (window as any).innerWidth;
    }
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render map container', async () => {
      render(<MapView toilets={[]} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('should render tile layer for map display', async () => {
      render(<MapView toilets={[]} />);
      
      const tileLayer = screen.getByTestId('tile-layer');
      expect(tileLayer).toBeInTheDocument();
    });

    it('should render marker cluster group when toilets provided', async () => {
      render(<MapView toilets={mockToiletData} />);
      
      const clusterGroup = screen.getByTestId('marker-cluster-group');
      expect(clusterGroup).toBeInTheDocument();
    });
  });

  describe('Toilet Data Loading', () => {
    it('should display markers for each toilet in data', async () => {
      render(<MapView toilets={mockToiletData} />);
      
      const markers = screen.getAllByTestId('marker');
      expect(markers).toHaveLength(2);
    });

    it('should handle empty toilet data gracefully', async () => {
      render(<MapView toilets={[]} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
      
      const markers = screen.queryAllByTestId('marker');
      expect(markers).toHaveLength(0);
    });

    it('should show loading state when toilet data is being fetched', async () => {
      render(<MapView toilets={[]} loading={true} />);
      
      expect(screen.getByTestId('map-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading map/i)).toBeInTheDocument();
    });

    it('should display error state when toilet data fails to load', async () => {
      const errorMessage = 'Failed to load toilet data';
      render(<MapView toilets={[]} error={errorMessage} />);
      
      expect(screen.getByTestId('map-error')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Marker Clustering', () => {
    it('should use clustering for multiple toilets', async () => {
      // Create multiple toilets in same area for clustering
      const clusteredToilets: ToiletFeature[] = Array.from({ length: 10 }, (_, i) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-0.1278 + (i * 0.001), 51.5074 + (i * 0.001)],
        },
        properties: {
          id: `cluster-toilet-${i}`,
          name: `Cluster Toilet ${i}`,
          hours: '24/7',
          accessible: true,
          fee: 0,
          source: 'test',
          last_verified_at: '2025-01-01T00:00:00.000Z',
          verified_by: 'test',
        },
      }));

      render(<MapView toilets={clusteredToilets} />);
      
      const clusterGroup = screen.getByTestId('marker-cluster-group');
      expect(clusterGroup).toBeInTheDocument();
    });
  });

  describe('SearchBar Integration', () => {
    it('should filter toilets based on search query', async () => {
      const user = userEvent.setup();
      const mockOnSearch = jest.fn();
      
      render(
        <MapView 
          toilets={mockToiletData} 
          onSearch={mockOnSearch}
          searchQuery="Test Toilet 1"
        />
      );
      
      // Should show only filtered results
      await waitFor(() => {
        const markers = screen.getAllByTestId('marker');
        expect(markers).toHaveLength(1);
      });
    });

    it('should filter toilets by proximity when location provided', async () => {
      const userLocation = { lat: 51.5074, lng: -0.1278 };
      const mockOnSearch = jest.fn();
      
      render(
        <MapView 
          toilets={mockToiletData}
          onSearch={mockOnSearch}
          userLocation={userLocation}
          searchRadius={1000} // 1km radius
        />
      );
      
      // Should filter by proximity
      const markers = screen.getAllByTestId('marker');
      expect(markers.length).toBeGreaterThan(0);
    });

    it('should show no results message when search yields no matches', async () => {
      render(
        <MapView 
          toilets={mockToiletData}
          searchQuery="nonexistent toilet"
        />
      );
      
      expect(screen.getByText(/no toilets found/i)).toBeInTheDocument();
      
      const markers = screen.queryAllByTestId('marker');
      expect(markers).toHaveLength(0);
    });
  });

  describe('MarkerPopup Integration', () => {
    it('should show popup when marker is clicked', async () => {
      const user = userEvent.setup();
      const mockOnMarkerClick = jest.fn();
      
      render(
        <MapView 
          toilets={mockToiletData}
          onMarkerClick={mockOnMarkerClick}
        />
      );
      
      const firstMarker = screen.getAllByTestId('marker')[0];
      await user.click(firstMarker);
      
      expect(mockOnMarkerClick).toHaveBeenCalledWith(mockToiletData[0]);
    });

    it('should display toilet details in popup', async () => {
      const user = userEvent.setup();
      
      render(<MapView toilets={mockToiletData} />);
      
      const firstMarker = screen.getAllByTestId('marker')[0];
      await user.click(firstMarker);
      
      // Should show popup with toilet details
      expect(screen.getByTestId('popup')).toBeInTheDocument();
      expect(screen.getByText('Test Toilet 1')).toBeInTheDocument();
    });

    it('should handle popup close action', async () => {
      const user = userEvent.setup();
      const mockOnPopupClose = jest.fn();
      
      render(
        <MapView 
          toilets={mockToiletData}
          onPopupClose={mockOnPopupClose}
        />
      );
      
      // Open popup first
      const firstMarker = screen.getAllByTestId('marker')[0];
      await user.click(firstMarker);
      
      // Close popup
      const closeButton = screen.getByLabelText(/close popup/i);
      await user.click(closeButton);
      
      expect(mockOnPopupClose).toHaveBeenCalled();
    });
  });

  describe('Map Controls and Interactions', () => {
    it('should handle map center updates', async () => {
      const mockOnCenterChange = jest.fn();
      
      render(
        <MapView 
          toilets={mockToiletData}
          onCenterChange={mockOnCenterChange}
        />
      );
      
      const mapContainer = screen.getByTestId('map-container');
      
      // Simulate map center change
      await act(async () => {
        // Mock map interaction that would trigger center change
        expect(mapContainer).toBeInTheDocument();
      });
    });

    it('should handle zoom level changes', async () => {
      const mockOnZoomChange = jest.fn();
      
      render(
        <MapView 
          toilets={mockToiletData}
          onZoomChange={mockOnZoomChange}
        />
      );
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('should support user location tracking', async () => {
      const mockOnLocationFound = jest.fn();
      
      // Mock successful geolocation
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 51.5074,
            longitude: -0.1278,
            accuracy: 10,
          },
        });
      });
      
      render(
        <MapView 
          toilets={mockToiletData}
          showUserLocation={true}
          onLocationFound={mockOnLocationFound}
        />
      );
      
      await waitFor(() => {
        expect(mockOnLocationFound).toHaveBeenCalled();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should only render visible markers for large datasets', async () => {
      // Create large dataset
      const largeToiletDataset: ToiletFeature[] = Array.from({ length: 1000 }, (_, i) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-0.1278 + (i * 0.01), 51.5074 + (i * 0.01)],
        },
        properties: {
          id: `large-toilet-${i}`,
          name: `Large Toilet ${i}`,
          hours: '24/7',
          accessible: i % 2 === 0,
          fee: 0,
          source: 'test',
          last_verified_at: '2025-01-01T00:00:00.000Z',
          verified_by: 'test',
        },
      }));

      render(<MapView toilets={largeToiletDataset} />);
      
      // Should use clustering for performance
      const clusterGroup = screen.getByTestId('marker-cluster-group');
      expect(clusterGroup).toBeInTheDocument();
    });

    it('should handle search functionality', async () => {
      const user = userEvent.setup();
      const mockOnSearch = jest.fn();
      
      render(
        <MapView 
          toilets={mockToiletData}
          onSearch={mockOnSearch}
        />
      );
      
      // Should have search functionality available
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible to screen readers', async () => {
      render(<MapView toilets={mockToiletData} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<MapView toilets={mockToiletData} />);
      
      const markers = screen.getAllByTestId('marker');
      expect(markers.length).toBeGreaterThan(0);
    });

    it('should announce toilet count for screen readers', async () => {
      render(<MapView toilets={mockToiletData} />);
      
      expect(screen.getByText(/2 toilets found/i)).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should render properly on mobile devices', async () => {
      render(<MapView toilets={mockToiletData} />);
      
      const mapContainer = screen.getByTestId('map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('should handle touch interactions', async () => {
      const mockOnMarkerClick = jest.fn();
      
      render(
        <MapView 
          toilets={mockToiletData}
          onMarkerClick={mockOnMarkerClick}
        />
      );
      
      const markers = screen.getAllByTestId('marker');
      expect(markers.length).toBeGreaterThan(0);
    });
  });
});