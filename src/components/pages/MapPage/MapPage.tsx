/**
 * @fileoverview MapPage container component - Integrates all organisms for the main map interface
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import React, { useState, useCallback, useRef } from 'react';
import { MapView } from '@/components/organisms/MapView';
import { FloatingActionButton } from '@/components/organisms/FloatingActionButton';
import { SuggestionModal } from '@/components/organisms/SuggestionModal';
import { SearchBar } from '@/components/molecules/SearchBar';
import { cn } from '@/lib/utils';

export interface MapPageProps {
  /** Additional CSS classes to apply */
  className?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/**
 * MapPage - Container component integrating all organisms for the toilet finder interface
 * 
 * Manages state coordination between MapView, FloatingActionButton, SuggestionModal, and SearchBar.
 * Handles the complete user workflow: search → view → add toilet functionality.
 * 
 * @example
 * ```tsx
 * <MapPage className="min-h-screen" />
 * ```
 */
export const MapPage: React.FC<MapPageProps> = ({
  className,
  'data-testid': testId,
}) => {
  // Modal state management
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Location state for modal pre-population
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 51.5074, lng: -0.1278 }); // London center
  
  // Search state for map filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New toilet markers from successful submissions
  const [newToilets, setNewToilets] = useState<any[]>([]);

  // Ref for accessing map methods
  const mapRef = useRef<any>(null);

  // Handle FAB click to open modal
  const handleFABClick = useCallback(() => {
    setSelectedLocation(null); // Clear any previous selection
    setIsModalOpen(true);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedLocation(null);
    setError(null);
  }, []);

  // Handle map center changes
  const handleMapCenterChange = useCallback((center: { lat: number; lng: number }) => {
    setMapCenter(center);
  }, []);

  // Handle map click for location selection
  const handleMapClick = useCallback((location: { lat: number; lng: number }) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  }, []);

  // Handle successful form submission
  const handleSubmissionSuccess = useCallback((response: any) => {
    console.log('[MapPage] Toilet submission successful:', response);
    
    // Add new toilet to map if we have coordinate data
    if (response && response.lat && response.lng) {
      const newToilet = {
        id: response.id || Date.now().toString(),
        lat: response.lat,
        lng: response.lng,
        name: response.name || 'New Toilet',
        source: 'user_submission',
        last_verified_at: new Date().toISOString(),
        verified_by: 'user',
        ...response
      };
      
      setNewToilets(prev => [...prev, newToilet]);
    }
    
    // Close modal after successful submission
    setTimeout(() => {
      handleModalClose();
    }, 1500);
  }, [handleModalClose]);

  // Handle submission errors
  const handleSubmissionError = useCallback((error: any) => {
    console.error('[MapPage] Toilet submission failed:', error);
    setError('Failed to submit toilet suggestion. Please try again.');
  }, []);

  // Handle search functionality
  const handleSearch = useCallback(async (query: string, location?: { lat: number; lng: number }) => {
    setSearchQuery(query);
    setIsLoading(true);
    setError(null);
    
    try {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      // For now, we'll simulate search results
      // In a real implementation, this would call a search API
      console.log('[MapPage] Searching for:', query, 'near:', location);
      
      // Mock search delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update map center if location provided
      if (location) {
        setMapCenter(location);
      }
      
      setSearchResults([]);
    } catch (err) {
      console.error('[MapPage] Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Determine location for modal (selected location or map center)
  const modalLocation = selectedLocation || mapCenter;

  return (
    <div 
      className={cn('relative w-full h-screen overflow-hidden', className)}
      data-testid={testId}
    >
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-40">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search for toilets or places..."
          className="shadow-lg"
          loading={isLoading}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute top-20 left-4 right-4 z-40">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm shadow-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map View */}
      <MapView
        ref={mapRef}
        center={mapCenter}
        onCenterChange={handleMapCenterChange}
        onMapClick={handleMapClick}
        searchQuery={searchQuery}
        newToilets={newToilets}
        className="w-full h-full"
        data-testid="map-page-map-view"
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={handleFABClick}
        disabled={isModalOpen}
        className={isModalOpen ? 'opacity-50' : ''}
        data-testid="map-page-fab"
      />

      {/* Suggestion Modal */}
      <SuggestionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSubmissionSuccess}
        onError={handleSubmissionError}
        location={modalLocation}
        mapCenter={mapCenter}
        data-testid="map-page-suggestion-modal"
      />
    </div>
  );
};

MapPage.displayName = 'MapPage';