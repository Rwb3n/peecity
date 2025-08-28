// last updated on: 2025-08-28 12:28:20
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

const app = express()
const PORT = process.env.PORT || 8080

// CORS middleware - Allow Firebase Hosting domains only
const corsOptions = {
  origin: [
    /^https:\/\/.*\.web\.app$/, // Firebase Hosting domains
    /^https:\/\/.*\.firebaseapp\.com$/, // Firebase Hosting domains
    'http://localhost:3000', // Local development
    'http://localhost:5000' // Firebase local emulator
  ],
  credentials: false,
  methods: ['GET', 'OPTIONS'], // Only GET and OPTIONS needed
  allowedHeaders: ['Content-Type']
}

app.use(cors(corsOptions))
app.use(express.json())

// Rate limiting middleware - Protect against API abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    details: 'Please try again later. Limit: 100 requests per 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Apply rate limiting to all API routes
app.use('/api/', limiter)

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  next()
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// Configuration endpoint
app.get('/api/config', (req, res) => {
  try {
    console.log('=== CONFIG API REQUEST ===')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Origin:', req.headers.origin)
    
    // Get API key from environment (proper implementation)
    const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    console.log('Environment variables available:', Object.keys(process.env).length)
    console.log('API Key present:', !!mapsApiKey)
    console.log('API Key length:', mapsApiKey ? mapsApiKey.length : 0)
    console.log('API Key first 10 chars:', mapsApiKey ? mapsApiKey.substring(0, 10) + '...' : 'undefined')
    
    if (!mapsApiKey) {
      console.error('[CONFIG API] Google Maps API key not configured in environment variables')
      return res.status(503).json({ 
        error: 'Configuration unavailable',
        details: 'API key not configured'
      })
    }

    console.log('[CONFIG API] API key found, returning configuration')
    res.json({
      mapsApiKey,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[CONFIG API] Configuration service error:', error)
    res.status(500).json({ 
      error: 'Configuration service error',
      details: error.message
    })
  }
})

// Search endpoint
app.get('/api/search', (req, res) => {
  try {
    const fs = require('fs')
    const path = require('path')
    
    console.log('=== SEARCH API REQUEST ===')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Query params:', req.query)
    console.log('Origin:', req.headers.origin)
    
    const { q: query, lat, lng, radius = '1000', limit = '50' } = req.query
    
    // Load toilet data from GeoJSON file
    const dataPath = path.join(process.cwd(), 'data', 'toilets.geojson')
    console.log('Loading data from:', dataPath)
    
    if (!fs.existsSync(dataPath)) {
      console.error('Toilet data file not found:', dataPath)
      return res.status(500).json({ 
        success: false, 
        error: 'Data file not found',
        details: 'toilets.geojson not accessible'
      })
    }
    
    const toiletData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    
    // Transform GeoJSON features to API format
    const toilets = toiletData.features.map((feature) => ({
      id: feature.properties.id,
      name: feature.properties.name || 'Public Toilet',
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
      hours: feature.properties.hours || 'Unknown',
      accessible: feature.properties.accessible || false,
      fee: feature.properties.fee || 0,
      address: feature.properties.address || 'London',
      properties: feature.properties
    }))
    
    // Filter results based on search parameters
    let results = toilets
    
    if (query) {
      results = results.filter((toilet) => 
        toilet.name.toLowerCase().includes(query.toLowerCase()) ||
        toilet.address.toLowerCase().includes(query.toLowerCase())
      )
    }
    
    // Simple distance filtering if lat/lng provided
    if (lat && lng) {
      const searchLat = parseFloat(lat)
      const searchLng = parseFloat(lng)
      const maxRadius = parseFloat(radius)
      
      results = results.filter((toilet) => {
        const distance = calculateDistance(searchLat, searchLng, toilet.lat, toilet.lng)
        return distance <= maxRadius
      })
    }
    
    // Limit results to prevent overwhelming response
    const limitNum = parseInt(limit)
    const paginatedResults = results.slice(0, limitNum)
    
    console.log(`Found ${results.length} toilets, returning ${paginatedResults.length}`)
    
    res.json({
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
    res.status(500).json({ 
      success: false, 
      error: 'Search request failed',
      details: error.message
    })
  }
})

// Simple distance calculation (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CityPee API server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
  console.log(`Config API: http://localhost:${PORT}/api/config`)
  console.log(`Search API: http://localhost:${PORT}/api/search`)
  console.log('Environment:', process.env.NODE_ENV || 'development')
})