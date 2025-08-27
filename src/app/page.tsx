// last updated on: 2025-08-27 22:22:59
'use client'

import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import { useState, useEffect, useCallback } from 'react'
import { LocationSearch } from '@/components/LocationSearch'

interface Config {
  mapsApiKey?: string
}

// Walking radius component
function WalkingCircles({ center }: { center: {lat: number, lng: number} }) {
  const map = useMap()
  const WALK_SPEED = 83 // meters per minute

  useEffect(() => {
    if (!map) return

    const circles = [
      new google.maps.Circle({
        center,
        radius: WALK_SPEED * 5, // 5 min walk
        fillColor: '#3B82F6',
        fillOpacity: 0.1,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        map
      }),
      new google.maps.Circle({
        center,
        radius: WALK_SPEED * 10, // 10 min walk
        fillColor: '#F59E0B',
        fillOpacity: 0.08,
        strokeColor: '#F59E0B',
        strokeOpacity: 0.25,
        strokeWeight: 1,
        map
      }),
      new google.maps.Circle({
        center,
        radius: WALK_SPEED * 15, // 15 min walk
        fillColor: '#EF4444',
        fillOpacity: 0.06,
        strokeColor: '#EF4444',
        strokeOpacity: 0.2,
        strokeWeight: 1,
        map
      })
    ]

    return () => {
      circles.forEach(circle => circle.setMap(null))
    }
  }, [map, center.lat, center.lng])

  return null
}

interface Toilet {
  id: string
  name: string
  lat: number
  lng: number
  accessible: boolean
  hours: string
  fee: number
  address: string
}

interface LocationResult {
  lat: number
  lng: number
  name: string
  address?: string
}

export default function HomePage() {
  const [toilets, setToilets] = useState<Toilet[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null)
  const [currentLocation, setCurrentLocation] = useState<LocationResult | null>(null)
  
  // Runtime configuration loading
  const [config, setConfig] = useState<Config>({})
  const [configLoading, setConfigLoading] = useState(true)
  const [configError, setConfigError] = useState<string | null>(null)

  // Load configuration from runtime API
  useEffect(() => {
    console.log('[CONFIG] Starting configuration load...')
    console.log('[CONFIG] Current URL:', window.location.href)
    
    fetch('/api/config')
      .then(res => {
        console.log('[CONFIG] API response status:', res.status)
        return res.json()
      })
      .then(data => {
        console.log('[CONFIG] API response data:', data)
        
        if (data.error) {
          console.error('[CONFIG] Configuration error:', data.error)
          setConfigError(data.error)
        } else {
          console.log('[CONFIG] Configuration loaded successfully')
          console.log('[CONFIG] API key present:', !!data.mapsApiKey)
          console.log('[CONFIG] API key length:', data.mapsApiKey ? data.mapsApiKey.length : 0)
          setConfig(data)
        }
      })
      .catch(err => {
        console.error('[CONFIG] Failed to load configuration:', err)
        setConfigError('Failed to load configuration')
      })
      .finally(() => {
        console.log('[CONFIG] Configuration loading complete')
        setConfigLoading(false)
      })
  }, [])

  // Load real toilet data
  useEffect(() => {
    const fetchToilets = async () => {
      try {
        const response = await fetch('/api/search?lat=51.5074&lng=-0.1278&radius=1000')
        const data = await response.json()
        
        if (data.success) {
          setToilets(data.data.slice(0, 10)) // Show first 10 toilets for testing
        }
      } catch (error) {
        console.error('Failed to fetch toilets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchToilets()
  }, [])

  // Get user's current location
  const handleNearMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }
    
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setUserLocation(location)
        setCurrentLocation({ lat: location.lat, lng: location.lng, name: 'Your Location' })
        setGettingLocation(false)
        
        // Fetch toilets near user location
        fetchToiletsNearLocation(location.lat, location.lng)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Unable to get your location. Please try again.')
        setGettingLocation(false)
      }
    )
  }

  // Fetch toilets near a specific location
  const fetchToiletsNearLocation = async (lat: number, lng: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/search?lat=${lat}&lng=${lng}&radius=1000`)
      const data = await response.json()
      
      if (data.success) {
        setToilets(data.data.slice(0, 10))
      }
    } catch (error) {
      console.error('Failed to fetch toilets:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle marker click
  const handleMarkerClick = useCallback((toilet: Toilet) => {
    setSelectedToilet(toilet)
  }, [])

  // Handle info window close
  const handleInfoWindowClose = useCallback(() => {
    setSelectedToilet(null)
  }, [])

  // Handle location search
  const handleLocationSelect = (location: LocationResult) => {
    setUserLocation({ lat: location.lat, lng: location.lng })
    setCurrentLocation(location)
    fetchToiletsNearLocation(location.lat, location.lng)
  }

  // Loading state while fetching configuration
  if (configLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CityPee...</p>
        </div>
      </div>
    )
  }

  // Error state if configuration failed to load
  if (configError || !config.mapsApiKey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 font-medium mb-2">Service temporarily unavailable</p>
          <p className="text-gray-500 text-sm">Please try again later</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">🚻 CityPee London</h1>
          <p className="text-gray-600">
            🎉 Complete CityPee - {loading ? 'Loading...' : `${toilets.length} toilets found`}
            {currentLocation && ` near ${currentLocation.name}`}
          </p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {/* Location Search */}
        <div className="mb-6">
          <LocationSearch 
            onLocationSelect={handleLocationSelect}
            loading={loading}
          />
        </div>

        <APIProvider apiKey={config.mapsApiKey}>
          <div className="relative w-full h-[500px] rounded-lg overflow-hidden shadow-md">
            <Map
              defaultCenter={userLocation || {lat: 51.5074, lng: -0.1278}}
              defaultZoom={15}
              mapId="DEMO_MAP_ID"
              gestureHandling="greedy"
            >
              {/* Walking radius circles */}
              {userLocation && (
                <WalkingCircles center={userLocation} />
              )}

              {/* User location marker */}
              {userLocation && (
                <AdvancedMarker
                  position={userLocation}
                >
                  <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg">
                    📍
                  </div>
                </AdvancedMarker>
              )}

              {/* Real toilet markers */}
              {!loading && toilets.map((toilet) => (
                <AdvancedMarker 
                  key={toilet.id}
                  position={{lat: toilet.lat, lng: toilet.lng}}
                  onClick={() => handleMarkerClick(toilet)}
                >
                  <div className="bg-white rounded-lg shadow-lg p-2 border-2 border-gray-200 hover:border-blue-400 cursor-pointer transition-colors">
                    <div className="text-lg">🚻</div>
                    {toilet.accessible && (
                      <div className="text-xs">♿</div>
                    )}
                  </div>
                </AdvancedMarker>
              ))}

              {/* Info Window for selected toilet */}
              {selectedToilet && (
                <InfoWindow
                  position={{ lat: selectedToilet.lat, lng: selectedToilet.lng }}
                  onClose={handleInfoWindowClose}
                >
                  <div className="p-2 max-w-xs">
                    <h3 className="font-semibold text-sm mb-1">{selectedToilet.name}</h3>
                    <p className="text-xs text-gray-600 mb-1">{selectedToilet.address}</p>
                    <div className="flex flex-col gap-1 text-xs">
                      <div>Hours: {selectedToilet.hours}</div>
                      <div className="flex items-center gap-2">
                        <span>Fee: {selectedToilet.fee === 0 ? 'Free' : `£${selectedToilet.fee}`}</span>
                        {selectedToilet.accessible && <span className="text-blue-600">♿ Accessible</span>}
                      </div>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>

            {/* Walking Distance Legend */}
            {userLocation && (
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs">
                <div className="font-semibold mb-2">Walking Distance</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 bg-opacity-20 border border-blue-500"></div>
                    <span>5 min walk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-amber-500 bg-opacity-20 border border-amber-500"></div>
                    <span>10 min walk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500 bg-opacity-20 border border-red-500"></div>
                    <span>15 min walk</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </APIProvider>
      </main>
    </div>
  )
}