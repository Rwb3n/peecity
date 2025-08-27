'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

interface LocationResult {
  lat: number
  lng: number
  name: string
  address?: string
}

interface LocationSearchProps {
  onLocationSelect: (location: LocationResult) => void
  loading?: boolean
}

// London bounds for restricting search results
const LONDON_BOUNDS = {
  north: 51.6918,
  south: 51.2868, 
  east: 0.3340,
  west: -0.5103
}

// Popular London locations for quick access
const LONDON_LANDMARKS = {
  'Victoria Station': { lat: 51.4952, lng: -0.1439 },
  'Kings Cross': { lat: 51.5308, lng: -0.1238 },
  'Oxford Circus': { lat: 51.5152, lng: -0.1415 },
  'London Bridge': { lat: 51.5079, lng: -0.0877 },
  'Paddington': { lat: 51.5154, lng: -0.1755 },
  'Canary Wharf': { lat: 51.5054, lng: -0.0235 }
}

export function LocationSearch({ onLocationSelect, loading = false }: LocationSearchProps) {
  const [geolocationLoading, setGeolocationLoading] = useState(false)
  const [autocompleteReady, setAutocompleteReady] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const placesLibrary = useMapsLibrary('places')

  // Setup Google Places Autocomplete
  useEffect(() => {
    if (!placesLibrary || !inputRef.current) return
    
    try {
      const autocomplete = new placesLibrary.Autocomplete(inputRef.current, {
        fields: ['formatted_address', 'geometry', 'name'],
        bounds: LONDON_BOUNDS,
        strictBounds: true,
        types: ['establishment', 'geocode'] // Venues + addresses
      })
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (!place.geometry?.location) {
          console.warn('No geometry found for place:', place.name)
          return
        }
        
        onLocationSelect({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          name: place.name || 'Selected Location',
          address: place.formatted_address
        })
        
        // Clear input after selection
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      })
      
      setAutocompleteReady(true)
    } catch (error) {
      console.error('Failed to initialize Places Autocomplete:', error)
    }
  }, [placesLibrary, onLocationSelect])

  // Handle GPS geolocation
  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser. Please search manually.')
      return
    }
    
    setGeolocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeolocationLoading(false)
        onLocationSelect({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Your Location'
        })
      },
      (error) => {
        setGeolocationLoading(false)
        console.error('Geolocation error:', error)
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert('Location access denied. Please enable location or search manually.')
            break
          case error.POSITION_UNAVAILABLE:
            alert('Location information unavailable. Please search manually.')
            break
          case error.TIMEOUT:
            alert('Location request timed out. Please search manually.')
            break
          default:
            alert('Unable to get your location. Please search manually.')
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      }
    )
  }, [onLocationSelect])

  // Handle landmark button clicks
  const handleLandmarkClick = useCallback((name: string, coords: {lat: number, lng: number}) => {
    onLocationSelect({
      lat: coords.lat,
      lng: coords.lng,
      name
    })
  }, [onLocationSelect])

  const isAnyLoading = loading || geolocationLoading

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Primary: GPS Location */}
        <Button
          onClick={handleGeolocation}
          disabled={isAnyLoading}
          size="lg"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
        >
          {geolocationLoading ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Getting your location...
            </>
          ) : (
            <>📍 Find Toilets Near Me</>
          )}
        </Button>

        {/* Secondary: Google Places Autocomplete */}
        <div className="space-y-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder={autocompleteReady ? "Search any London location..." : "Loading Google Places..."}
            disabled={!autocompleteReady || isAnyLoading}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            {autocompleteReady 
              ? "Try: \"Victoria Station\", \"Oxford Street\", or any London address"
              : "Setting up location search..."
            }
          </p>
        </div>

        {/* Tertiary: Quick Landmark Buttons */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600 font-medium">Popular areas:</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(LONDON_LANDMARKS).map(([name, coords]) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                onClick={() => handleLandmarkClick(name, coords)}
                disabled={isAnyLoading}
                className="text-xs h-8 px-2"
              >
                {name}
              </Button>
            ))}
          </div>
        </div>

        {/* Help text */}
        <div className="text-xs text-gray-400 text-center pt-2 border-t">
          Your location is only used to find nearby toilets and is not stored.
        </div>
      </CardContent>
    </Card>
  )
}