'use client'

import { Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import { useState, useCallback, useEffect } from 'react'

interface Toilet {
  id: string
  name: string
  lat: number
  lng: number
  hours: string
  accessible: boolean
  fee: number
  address: string
}

interface LocationResult {
  lat: number
  lng: number
  name: string
  address?: string
}

interface ToiletMapProps {
  toilets: Toilet[]
  userLocation: LocationResult | null
  onMarkerClick?: (toilet: Toilet) => void
}

// Walking speed constants (meters per minute)
const WALK_SPEED = 83

// Circle styles for walking distances
const CIRCLE_STYLES = {
  5: { fillColor: '#3B82F6', fillOpacity: 0.1, strokeColor: '#3B82F6', strokeOpacity: 0.3, strokeWeight: 1 },
  10: { fillColor: '#F59E0B', fillOpacity: 0.08, strokeColor: '#F59E0B', strokeOpacity: 0.25, strokeWeight: 1 },
  15: { fillColor: '#EF4444', fillOpacity: 0.06, strokeColor: '#EF4444', strokeOpacity: 0.2, strokeWeight: 1 }
}

// Custom Circle component
function WalkingCircle({ center, radius, options }: { center: { lat: number, lng: number }, radius: number, options: any }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    const circle = new google.maps.Circle({
      center,
      radius,
      ...options,
      map
    })

    return () => {
      circle.setMap(null)
    }
  }, [map, center.lat, center.lng, radius, options])

  return null
}

export function ToiletMap({ toilets, userLocation, onMarkerClick }: ToiletMapProps) {
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null)

  // Default center (Central London)
  const mapCenter = userLocation || { lat: 51.5074, lng: -0.1278 }

  const handleMarkerClick = useCallback((toilet: Toilet) => {
    setSelectedToilet(toilet)
    onMarkerClick?.(toilet)
  }, [onMarkerClick])

  const handleInfoWindowClose = useCallback(() => {
    setSelectedToilet(null)
  }, [])

  return (
    <div className="relative">
      <div className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-md">
        <Map
        center={mapCenter}
        zoom={14}
        mapId="DEMO_MAP_ID"
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
      >
        {/* Walking radius circles around user location */}
        {userLocation && (
          <>
            <WalkingCircle
              center={userLocation}
              radius={WALK_SPEED * 5}
              options={CIRCLE_STYLES[5]}
            />
            <WalkingCircle
              center={userLocation}
              radius={WALK_SPEED * 10}
              options={CIRCLE_STYLES[10]}
            />
            <WalkingCircle
              center={userLocation}
              radius={WALK_SPEED * 15}
              options={CIRCLE_STYLES[15]}
            />
          </>
        )}

        {/* User location marker */}
        {userLocation && (
          <AdvancedMarker
            position={userLocation}
          >
            <div className="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold shadow-lg">
              📍
            </div>
          </AdvancedMarker>
        )}

        {/* Toilet markers */}
        {toilets.map((toilet) => (
          <AdvancedMarker
            key={toilet.id}
            position={{ lat: toilet.lat, lng: toilet.lng }}
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

        {/* Info window for selected toilet */}
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
      </div>

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
  )
}