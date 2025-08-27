import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius') || '1000' // Default 1km
    
    // Load toilet data from GeoJSON file
    const dataPath = path.join(process.cwd(), 'data', 'toilets.geojson')
    const toiletData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    
    // Transform GeoJSON features to API format
    const toilets = toiletData.features.map((feature: any) => ({
      id: feature.properties.id,
      name: feature.properties.name || 'Public Toilet',
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
      hours: feature.properties.hours || 'Unknown',
      accessible: feature.properties.accessible || false,
      fee: feature.properties.fee || 0,
      address: feature.properties.address || 'London',
      // Include original properties for future use
      properties: feature.properties
    }))
    
    // Filter results based on search parameters
    let results = toilets
    
    if (query) {
      results = results.filter(toilet => 
        toilet.name.toLowerCase().includes(query.toLowerCase()) ||
        toilet.address.toLowerCase().includes(query.toLowerCase())
      )
    }
    
    // Simple distance filtering if lat/lng provided
    if (lat && lng) {
      const searchLat = parseFloat(lat)
      const searchLng = parseFloat(lng)
      const maxRadius = parseFloat(radius)
      
      results = results.filter(toilet => {
        const distance = calculateDistance(searchLat, searchLng, toilet.lat, toilet.lng)
        return distance <= maxRadius
      })
    }
    
    // Limit results to prevent overwhelming response
    const limit = parseInt(searchParams.get('limit') || '50')
    const paginatedResults = results.slice(0, limit)
    
    return NextResponse.json({
      success: true,
      data: paginatedResults,
      meta: {
        total: results.length,
        returned: paginatedResults.length,
        query,
        location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
        radius: parseFloat(radius)
      }
    })
    
  } catch (error) {
    console.error('API Error in /api/search:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Search request failed'
    }, { status: 500 })
  }
}

// Simple distance calculation (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180
  const φ2 = lat2 * Math.PI/180
  const Δφ = (lat2-lat1) * Math.PI/180
  const Δλ = (lng2-lng1) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}