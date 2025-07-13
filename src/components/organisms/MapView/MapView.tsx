/**
 * @fileoverview MapView organism component - Interactive map displaying toilet locations
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { default as MarkerClusterGroup } from 'react-leaflet-cluster';
import { Icon, divIcon, point } from 'leaflet';
import { MarkerPopup, type Toilet } from '@/components/molecules/MarkerPopup';
import { SearchBar } from '@/components/molecules/SearchBar';
import type { ToiletFeature } from '@/types/geojson';
import { cn } from '@/lib/utils';

// London center coordinates
const LONDON_CENTER: [number, number] = [51.5074, -0.1278];
const DEFAULT_ZOOM = 12;

// Custom marker icons
const createClusterCustomIcon = (cluster: any) => {
  return divIcon({
    html: `<span class="cluster-icon">${cluster.getChildCount()}</span>`,
    className: 'custom-marker-cluster',
    iconSize: point(33, 33, true),
  });
};

// Default marker icon (custom implementation to avoid external dependencies)
const defaultIcon = new Icon({
  iconUrl: '/icons/custom-marker.svg', // Custom local icon
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'custom-default-marker'
});

// Convert ToiletFeature to Toilet interface for MarkerPopup
const convertToiletFeature = (feature: ToiletFeature): Toilet => ({
  id: feature.properties.id,
  name: feature.properties.name,
  lat: feature.geometry.coordinates[1], // GeoJSON is [lng, lat]
  lng: feature.geometry.coordinates[0],
  hours: feature.properties.hours,
  accessible: feature.properties.accessible,
  fee: feature.properties.fee,
  source: feature.properties.source,
  last_verified_at: feature.properties.last_verified_at,
});

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export interface MapViewProps {
  toilets: ToiletFeature[];
  loading?: boolean;
  error?: string;
  searchQuery?: string;
  userLocation?: { lat: number; lng: number };
  searchRadius?: number; // in kilometers
  showUserLocation?: boolean;
  onSearch?: (query: string) => void;
  onLocationRequest?: () => void;
  onMarkerClick?: (toilet: ToiletFeature) => void;
  onPopupClose?: () => void;
  onCenterChange?: (center: [number, number]) => void;
  onZoomChange?: (zoom: number) => void;
  onLocationFound?: (location: { lat: number; lng: number }) => void;
  onDirections?: (toilet: Toilet) => void;
  onReport?: (toiletId: string) => void;
  onShare?: (toilet: Toilet) => void;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  toilets,
  loading = false,
  error,
  searchQuery = '',
  userLocation,
  searchRadius = 5, // 5km default
  showUserLocation = false,
  onSearch,
  onLocationRequest,
  onMarkerClick,
  onPopupClose,
  onCenterChange,
  onZoomChange,
  onLocationFound,
  onDirections,
  onReport,
  onShare,
  className,
}) => {
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);

  // Filter toilets based on search query and proximity
  const filteredToilets = useMemo(() => {
    let filtered = toilets;

    // Filter by search query (name matching)
    if (searchQuery.trim()) {
      filtered = filtered.filter(toilet =>
        toilet.properties.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by proximity if user location provided
    if (userLocation && searchRadius) {
      filtered = filtered.filter(toilet => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          toilet.geometry.coordinates[1], // lat
          toilet.geometry.coordinates[0]  // lng
        );
        return distance <= searchRadius;
      });
    }

    return filtered;
  }, [toilets, searchQuery, userLocation, searchRadius]);

  // Handle marker click
  const handleMarkerClick = useCallback((toilet: ToiletFeature) => {
    const convertedToilet = convertToiletFeature(toilet);
    setSelectedToilet(convertedToilet);
    onMarkerClick?.(toilet);
  }, [onMarkerClick]);

  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setSelectedToilet(null);
    onPopupClose?.();
  }, [onPopupClose]);

  // Handle geolocation for user location tracking
  useEffect(() => {
    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          onLocationFound?.(location);
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  }, [showUserLocation, onLocationFound]);

  // Loading state
  if (loading) {
    return (
      <div 
        data-testid="map-loading" 
        className={cn('flex items-center justify-center bg-gray-100 rounded-lg map-container-height', className)}
        style={{ 
          height: '384px',
          minHeight: '256px'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        data-testid="map-error" 
        className={cn('flex items-center justify-center bg-red-50 border border-red-200 rounded-lg map-container-height', className)}
        style={{ 
          height: '384px',
          minHeight: '256px'
        }}
      >
        <div className="text-center text-red-600 p-4">
          <p className="font-medium">Map Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // No results message
  const showNoResults = filteredToilets.length === 0 && toilets.length > 0;

  return (
    <div className={cn('relative', className)}>
      {/* Search bar integration */}
      {onSearch && (
        <div className="absolute top-4 left-4 right-4 z-[1000]">
          <SearchBar
            onSearch={onSearch}
            onLocationRequest={onLocationRequest}
            value={searchQuery}
            placeholder="Search for toilets near..."
            showLocationButton={!!onLocationRequest}
          />
        </div>
      )}

      {/* Screen reader announcement for toilet count */}
      <div className="sr-only" aria-live="polite">
        {filteredToilets.length} toilets found
      </div>

      {/* No results message */}
      {showNoResults && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white p-4 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">No toilets found matching your search.</p>
        </div>
      )}

      {/* Main map container */}
      <MapContainer
        center={LONDON_CENTER}
        zoom={DEFAULT_ZOOM}
        className={cn('w-full h-full rounded-lg map-container-height', className)}
        style={{ 
          minHeight: '256px' // Fallback minimum height (16rem/256px = h-64)
        }}
        data-testid="map-container"
        aria-label="Interactive map showing toilet locations in London"
        role="application"
      >
        {/* Tile layer for map background */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          data-testid="tile-layer"
        />

        {/* Marker clustering for performance */}
        <MarkerClusterGroup
          data-testid="marker-cluster-group"
          iconCreateFunction={createClusterCustomIcon}
        >
          {filteredToilets.map((toilet) => (
            <Marker
              key={toilet.properties.id}
              position={[toilet.geometry.coordinates[1], toilet.geometry.coordinates[0]]} // [lat, lng]
              icon={defaultIcon}
              data-testid="marker"
              data-default-icon="true"
              eventHandlers={{
                click: () => handleMarkerClick(toilet),
              }}
            >
              {selectedToilet?.id === toilet.properties.id && (
                <Popup
                  data-testid="popup"
                  onClose={handlePopupClose}
                  eventHandlers={{
                    click: (e) => {
                      // Prevent event bubbling to parent components
                      e.originalEvent?.stopPropagation();
                      e.originalEvent?.preventDefault();
                    },
                  }}
                >
                  <MarkerPopup
                    toilet={convertToiletFeature(toilet)}
                    onClose={handlePopupClose}
                    onDirections={onDirections}
                    onReport={onReport}
                    onShare={onShare}
                  />
                </Popup>
              )}
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* CSS for custom cluster styling and map height isolation */}
      <style jsx>{`
        .custom-marker-cluster {
          background-color: #3b82f6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cluster-icon {
          color: white;
          font-weight: bold;
          font-size: 12px;
        }
        /* Map height CSS isolation - allow inheritance with fallbacks */
        .map-container-height {
          min-height: 256px !important; /* Minimum responsive height */
          height: 100% !important; /* Inherit from parent container */
        }
        /* Responsive minimum height adjustments */
        @media (max-width: 640px) {
          .map-container-height {
            min-height: 200px !important; /* Smaller minimum for mobile */
          }
        }
        @media (min-width: 641px) {
          .map-container-height {
            min-height: 256px !important; /* Standard minimum for desktop */
          }
        }
      `}</style>
    </div>
  );
};

MapView.displayName = 'MapView';