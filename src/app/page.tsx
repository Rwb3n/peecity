// last updated on: 2025-08-28 15:52:42
'use client'

import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Settings, ChevronUp } from 'lucide-react'
import { NearMeButton } from '@/components/NearMeButton'
import { SearchInput } from '@/components/SearchInput'
import { AdsBlock } from '@/components/AdsBlock'

interface Config {
  mapsApiKey?: string
}

// Map reference component to capture map instance
function MapRefHandler({ onMapLoad }: { onMapLoad: (map: google.maps.Map) => void }) {
  const map = useMap()
  
  useEffect(() => {
    if (map) {
      onMapLoad(map)
    }
  }, [map, onMapLoad])
  
  return null
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
  
  // Drawer state and map ref
  const [drawerOpen, setDrawerOpen] = useState(false)
  const mapRef = useRef<google.maps.Map | null>(null)
  
  // Runtime configuration loading
  const [config, setConfig] = useState<Config>({})
  const [configLoading, setConfigLoading] = useState(true)
  const [configError, setConfigError] = useState<string | null>(null)

  // Express API backend URL
  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://citypee-api-310116477099.us-east1.run.app'
    : 'https://citypee-api-310116477099.us-east1.run.app' // Use remote API for development too

  // Load configuration from runtime API
  useEffect(() => {
    console.log('[CONFIG] Starting configuration load...')
    console.log('[CONFIG] Current URL:', window.location.href)
    
    fetch(`${API_BASE}/api/config`)
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
        const response = await fetch(`${API_BASE}/api/search?lat=51.5074&lng=-0.1278&radius=1000`)
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
      const response = await fetch(`${API_BASE}/api/search?lat=${lat}&lng=${lng}&radius=1000`)
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

  // Auto-center map functionality with drawer auto-close
  const centerMap = useCallback((location: { lat: number, lng: number }) => {
    if (mapRef.current) {
      mapRef.current.panTo(location)
      mapRef.current.setZoom(15)
      // Auto-close drawer when centering to avoid blocking view
      setDrawerOpen(false)
    }
  }, [])

  // Handle marker click with auto-centering
  const handleMarkerClick = useCallback((toilet: Toilet) => {
    setSelectedToilet(toilet)
    centerMap({ lat: toilet.lat, lng: toilet.lng })
  }, [centerMap])

  // Handle info window close
  const handleInfoWindowClose = useCallback(() => {
    setSelectedToilet(null)
  }, [])

  // Handle location search with auto-centering
  const handleLocationSelect = (location: LocationResult) => {
    const newLocation = { lat: location.lat, lng: location.lng }
    setUserLocation(newLocation)
    setCurrentLocation(location)
    centerMap(newLocation)
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
    <div className="h-screen w-full flex flex-col relative bg-gray-50">
      {/* Full-screen map container */}
      <div className="flex-1 relative">
        <APIProvider apiKey={config.mapsApiKey}>
          <div className="absolute inset-0">
            <Map
              defaultCenter={userLocation || {lat: 51.5074, lng: -0.1278}}
              defaultZoom={15}
              mapId="DEMO_MAP_ID"
              gestureHandling="greedy"
              zoomControl={false}
              mapTypeControl={false}
              fullscreenControl={false}
              streetViewControl={false}
              rotateControl={false}
              keyboardShortcuts={false}
              clickableIcons={false}
            >
              {/* Map instance capture */}
              <MapRefHandler onMapLoad={(map) => { mapRef.current = map }} />
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

            {/* Walking Distance Legend - Repositioned for mobile */}
            {userLocation && !drawerOpen && (
              <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg p-3 text-xs">
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
      </div>

      {/* Status info - Fixed positioning */}
      <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
        <p className="text-sm font-medium text-gray-900">🚻 CityPee</p>
        <p className="text-xs text-gray-600">
          {loading ? 'Loading...' : `${toilets.length} toilets found`}
          {currentLocation && ` near ${currentLocation.name}`}
        </p>
      </div>

      {/* Settings cog - Fixed positioning */}
      <button 
        className="absolute top-4 right-4 z-20 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
        onClick={() => alert('Settings coming soon! 🚧')}
        aria-label="Settings"
      >
        <Settings className="w-5 h-5 text-gray-700" />
      </button>

      {/* Bottom Drawer System - Fixed Height with Internal Scroll */}
      <APIProvider apiKey={config.mapsApiKey}>
      <div 
        className={`fixed left-0 right-0 z-30 bg-white rounded-t-2xl shadow-2xl transition-all duration-300 ${
          drawerOpen ? 'bottom-0' : 'bottom-0'
        }`}
        style={{
          height: drawerOpen ? '75vh' : 'auto', // Increased height for better UX
          touchAction: 'manipulation'
        }}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Drawer Handle */}
        <div 
          className="flex justify-center py-2 cursor-pointer select-none"
          onClick={() => setDrawerOpen(!drawerOpen)}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Always Visible Content (No Scroll) */}
        <div className="px-4 pb-4 space-y-4">
          <NearMeButton 
            onLocationSelect={handleLocationSelect} 
            loading={gettingLocation} 
          />
          <SearchInput 
            onLocationSelect={handleLocationSelect}
            loading={loading}
          />
          <AdsBlock />
        </div>

        {/* Scrollable Content Area (Only When Open) */}
        {drawerOpen && (
          <div className="px-4 overflow-y-auto" style={{ maxHeight: '45vh' }}>
            <div className="border-t pt-6 pb-6 space-y-6">
              {/* Filter Buttons */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter Toilets</h3>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-full border border-blue-200 hover:bg-blue-200 transition-colors">
                    ♿ Accessible
                  </button>
                  <button className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded-full border border-green-200 hover:bg-green-200 transition-colors">
                    🚻 Free
                  </button>
                  <button className="px-3 py-2 text-xs bg-amber-100 text-amber-700 rounded-full border border-amber-200 hover:bg-amber-200 transition-colors">
                    💰 Paid
                  </button>
                  <button className="px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded-full border border-purple-200 hover:bg-purple-200 transition-colors">
                    🕒 24/7
                  </button>
                </div>
              </div>

              {/* Popular Locations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Popular Locations</h3>
                <div className="space-y-2">
                  <button 
                    className="w-full text-left px-3 py-2 text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => handleLocationSelect({ lat: 51.4952, lng: -0.1439, name: 'Victoria Station' })}
                  >
                    🗺️ Victoria Station
                  </button>
                  <button 
                    className="w-full text-left px-3 py-2 text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => handleLocationSelect({ lat: 51.5308, lng: -0.1238, name: 'Kings Cross' })}
                  >
                    🗺️ Kings Cross
                  </button>
                </div>
              </div>

              {/* Future Enhancement Annotations */}
              {/* TODO: Drag handle to resize drawer height */}
              {/* TODO: Dynamic height based on content (Option B) */}
              {/* TODO: Map content adjustment when drawer opens */}
              {/* TODO: Gesture-based drawer interactions */}
              
              {/* Extra content for testing scroll */}
              <div className="pb-8 text-xs text-gray-400 text-center">
                Internal scroll area • More content can be added here
              </div>
            </div>
          </div>
        )}

        {/* Collapse Indicator */}
        {drawerOpen && (
          <div 
            className="flex justify-center pb-2 cursor-pointer select-none"
            onClick={() => setDrawerOpen(false)}
          >
            <ChevronUp className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>
      </APIProvider>
    </div>
  )
}