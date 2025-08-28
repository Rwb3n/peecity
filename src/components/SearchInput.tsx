// last updated on: 2025-08-28 15:42:11
'use client'

import { useState, useRef, useEffect } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'

interface LocationResult {
  lat: number
  lng: number
  name: string
  address?: string
}

interface SearchInputProps {
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

export function SearchInput({ onLocationSelect, loading = false }: SearchInputProps) {
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

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={autocompleteReady ? "Search any London location..." : "Loading Google Places..."}
      disabled={!autocompleteReady || loading}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  )
}