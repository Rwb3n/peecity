// last updated on: 2025-08-28 15:41:32
'use client'

import { useState, useCallback } from 'react'

interface LocationResult {
  lat: number
  lng: number
  name: string
  address?: string
}

interface NearMeButtonProps {
  onLocationSelect: (location: LocationResult) => void
  loading?: boolean
}

export function NearMeButton({ onLocationSelect, loading = false }: NearMeButtonProps) {
  const [gettingLocation, setGettingLocation] = useState(false)

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }
    
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGettingLocation(false)
        onLocationSelect({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Your Location'
        })
      },
      (error) => {
        setGettingLocation(false)
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

  const isDisabled = loading || gettingLocation

  return (
    <button
      onClick={handleGeolocation}
      disabled={isDisabled}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {gettingLocation ? (
        <>
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Getting your location...
        </>
      ) : (
        <>📍 Find toilets near me</>
      )}
    </button>
  )
}