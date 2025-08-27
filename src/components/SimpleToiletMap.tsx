'use client'

import { Map, AdvancedMarker } from '@vis.gl/react-google-maps'

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

interface SimpleToiletMapProps {
  toilets: Toilet[]
  userLocation: LocationResult | null
}

export function SimpleToiletMap({ toilets, userLocation }: SimpleToiletMapProps) {
  // Default center (Central London)
  const mapCenter = userLocation || { lat: 51.5074, lng: -0.1278 }

  return (
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
        {/* User location marker */}
        {userLocation && (
          <AdvancedMarker position={userLocation}>
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg">
              📍
            </div>
          </AdvancedMarker>
        )}

        {/* Toilet markers */}
        {toilets.map((toilet) => (
          <AdvancedMarker
            key={toilet.id}
            position={{ lat: toilet.lat, lng: toilet.lng }}
          >
            <div className="bg-white rounded-lg shadow-lg p-2 border-2 border-gray-200 hover:border-blue-400 cursor-pointer transition-colors">
              <div className="text-lg">🚻</div>
              {toilet.accessible && (
                <div className="text-xs">♿</div>
              )}
            </div>
          </AdvancedMarker>
        ))}
      </Map>
    </div>
  )
}