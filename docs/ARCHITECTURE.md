# last updated on: 2025-08-28 12:07:27
# CityPee Architecture

**Simple visual guide to how our toilet finder works**

---

## System Overview

```
User's Phone/Browser
       ↓
┌─────────────────┐
│ FIREBASE HOSTING│  ← Static React App (CDN)
│ peecity.web.app │
└─────────┬───────┘
          │ HTTPS + CORS
          ▼
┌─────────────────┐
│   CLOUD RUN     │  ← Express API Server
│ citypee-api-... │
└─────────┬───────┘
          │
          ▼
   [1,053 Toilets]
```

CityPee is a **microservices architecture**: Firebase Hosting serves the static frontend, Cloud Run hosts the Express API backend. Clean separation for performance and security.

---

## Data Flow

```
1. USER SEARCHES
   └── GPS Location OR Google Places OR Landmark Button
       └── LocationSearch.tsx (Firebase Hosting)

2. FRONTEND CALLS API  
   └── fetch('https://citypee-api-*.run.app/api/search?lat=X&lng=Y')
       └── CORS request to Express API (Cloud Run)
       └── Express reads toilets.geojson (1,053 toilets)
       └── Returns filtered toilets within radius

3. MAP DISPLAYS RESULTS
   └── Google Maps shows:
       ├── Blue circles (5/10/15 min walk)
       ├── User location (📍)
       └── Toilet markers (🚻)
```

---

## File Structure

```
CityPee/
├── 🌐 FRONTEND (Firebase Hosting)
│   ├── src/app/page.tsx           ← Main Google Maps page
│   ├── src/components/LocationSearch.tsx ← GPS + search
│   ├── src/components/ToiletCard.tsx ← Toilet info windows
│   ├── src/components/ui/         ← button, card, input
│   ├── out/                       ← Static build output (21 files)
│   ├── firebase.json              ← Hosting configuration
│   └── next.config.js             ← Static export config
│
├── 🔧 BACKEND (Cloud Run)
│   └── api-server/
│       ├── server.js              ← Express API endpoints
│       ├── data/toilets.geojson   ← 1,053 toilet dataset
│       ├── Dockerfile             ← Container configuration
│       └── package.json           ← API dependencies
│
├── 📊 DATA
│   └── data/toilets.geojson       ← Master toilet dataset
│
└── 📚 DOCUMENTATION
    ├── docs/ARCHITECTURE.md       ← This file
    ├── docs/checkpoints/          ← Project history
    ├── CLAUDE.md                  ← Agent guidance
    └── README.md                  ← Setup instructions
```

**Clean separation**: Frontend and backend are independent deployments.

---

## How the Map Works

```
┌─────────────────────────────────────┐
│            Google Maps              │
│                                     │
│    ○ ○ ○ ○ ○     ← Blue circle     │
│  ○         ○       (5 min walk)    │
│ ○     📍    ○                      │
│  ○         ○     🚻 ← Toilet       │
│    ○ ○ ○ ○ ○       marker          │
│                                     │
│         🚻                          │
│            🚻                       │
└─────────────────────────────────────┘
```

**Walking Circles:**
- Blue = 5 min (415m radius)
- Orange = 10 min (830m radius)  
- Red = 15 min (1,245m radius)
- Formula: 83 meters per minute walking speed

---

## API Design

**Base URL:** `https://citypee-api-310116477099.us-east1.run.app`

### **Health Check Endpoint**
```http
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-28T11:35:00.000Z"
}
```

### **Configuration Endpoint**
```http
GET /api/config
```
**Description:** Returns Google Maps API key for frontend initialization  
**Response:**
```json
{
  "mapsApiKey": "AIzaSyA...rsE",
  "timestamp": "2025-08-28T11:35:00.000Z"
}
```
**Error Responses:**
```json
// Service unavailable (503)
{
  "error": "Configuration unavailable",
  "details": "API key not configured"
}

// Internal error (500)
{
  "error": "Configuration service error",
  "details": "error message"
}
```

### **Toilet Search Endpoint**
```http
GET /api/search?lat={lat}&lng={lng}&radius={radius}&limit={limit}&q={query}
```
**Parameters:**
- `lat` (optional): Search latitude coordinate
- `lng` (optional): Search longitude coordinate  
- `radius` (optional): Search radius in meters (default: 1000)
- `limit` (optional): Maximum results to return (default: 50)
- `q` (optional): Text search query for name/address

**Example Request:**
```http
GET /api/search?lat=51.5074&lng=-0.1278&radius=1000&limit=20&q=public
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "osm_node_123456",
      "name": "Public Toilet",
      "lat": 51.5074,
      "lng": -0.1278,
      "hours": "24/7",
      "accessible": true,
      "fee": 0,
      "address": "London",
      "properties": {
        "id": "osm_node_123456",
        "name": "Public Toilet",
        "hours": "24/7",
        "accessible": true,
        "fee": 0,
        "source": "osm",
        "last_verified_at": "2025-08-26T18:32:20.740Z",
        "verified_by": "ingest-agent"
      }
    }
  ],
  "meta": {
    "total": 15,
    "returned": 15,
    "query": "public",
    "location": { "lat": 51.5074, "lng": -0.1278 },
    "radius": 1000
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Search request failed",
  "details": "error message"
}
```

### **Security Features:**
- **CORS Protection**: Browser-level protection for authorized domains
  ```javascript
  // Allowed origins (enforced by browser preflight)
  /^https:\/\/.*\.web\.app$/          // Firebase Hosting
  /^https:\/\/.*\.firebaseapp\.com$/   // Firebase Hosting  
  'http://localhost:3000'              // Local development
  'http://localhost:5000'              // Firebase emulator
  
  // Note: Direct server-to-server requests bypass CORS (expected behavior)
  // Browser requests properly enforce CORS via OPTIONS preflight
  ```
- **Security Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`
- **API Key Isolation**: Google Maps key never exposed to frontend bundle
- **Public Endpoints**: No authentication required, GET and OPTIONS methods only

### **Data Processing:**
- **Source**: Static GeoJSON file (`api-server/data/toilets.geojson`)
- **Dataset**: 1,053 London public toilets
- **Distance Calculation**: Haversine formula for geographic filtering
- **Performance**: In-memory data loading, no database queries

---

## Technology Stack

```
Frontend (Firebase Hosting):
├── Next.js 15 (React 18 + TypeScript) - Static Export
├── @vis.gl/react-google-maps v1.5.5
├── Tailwind CSS
└── Firebase CDN (Global distribution)

Backend (Cloud Run):
├── Node.js Express Server
├── Express CORS middleware
├── Static GeoJSON data serving
└── Docker containerized deployment

APIs:
├── Google Maps JavaScript API
├── Google Places API (autocomplete)
└── Express REST API (/api/config, /api/search)

Data:
└── Static GeoJSON file (1,053 toilets)
```

**Modern microservices**: Frontend CDN + Backend API for performance and security.

---

## Component Hierarchy

```
page.tsx (Main App - Firebase Hosting)
├── API Configuration Fetch (from Express backend)
├── LocationSearch
│   ├── GPS button
│   ├── Google Places input
│   └── Landmark buttons (6 locations)
├── Google Maps (with backend API key)
│   ├── WalkingCircles component
│   ├── User location marker
│   ├── Toilet markers (🚻) ← Data from Express API
│   └── InfoWindow (clicked toilet)
└── Walking legend
```

---

## Deployment Flow

```
FRONTEND (Firebase Hosting):
1. BUILD STATIC EXPORT
   npm run build
   
2. DEPLOY TO FIREBASE
   npx firebase deploy --only hosting
   
3. PRODUCTION FRONTEND
   https://peecity.web.app

BACKEND (Cloud Run):
1. EXPRESS API DEVELOPMENT
   cd api-server && node server.js
   
2. DOCKER BUILD & DEPLOY
   cd api-server
   gcloud run deploy citypee-api --source . --region us-east1
   
3. PRODUCTION BACKEND
   https://citypee-api-310116477099.us-east1.run.app
```

**Environment Variables:**
- Backend only: `GOOGLE_MAPS_API_KEY` (Cloud Run environment)
- Frontend: No environment variables needed (gets API key from backend)

---

## Key Implementation Details

**Walking Circle Math:**
```javascript
const WALK_SPEED = 83 // meters per minute
const radius = WALK_SPEED * minutes
```

**Distance Calculation:**
```javascript
// Haversine formula for "as crow flies" distance
function calculateDistance(lat1, lng1, lat2, lng2) {
  // Returns meters between two points
}
```

**London Bounds:**
```javascript
const LONDON_BOUNDS = {
  north: 51.6918, south: 51.2868,
  east: 0.3340, west: -0.5103
}
```

---

## What Makes This Work

1. **Real Data**: 1,053 toilets from OpenStreetMap, not fake data
2. **Triple Search**: GPS + Google autocomplete + landmark buttons  
3. **Visual Radius**: Walking circles show actual walking distance
4. **Mobile First**: Touch gestures, responsive design
5. **Production Ready**: Docker + Cloud Run deployment

**Philosophy**: Ship useful features, not perfect code.

---

## Common Issues & Solutions

```
❌ Map not loading
   └── Check Express API is running at citypee-api-*.run.app/api/config

❌ CORS errors in browser console  
   └── Verify Firebase domain is in Express CORS configuration

❌ "Cannot read lat of undefined"  
   └── Express API returned invalid toilet data format

❌ GPS permission denied
   └── Falls back to manual search + landmarks

❌ Firebase deploy fails
   └── Run npm run build first to generate out/ directory
```

---

## Architecture Benefits

**🚀 Performance:**
- Static assets served via Firebase Global CDN
- API auto-scales on Cloud Run (0 to N instances)
- Google Maps loads faster with backend API key

**🔒 Security:**  
- API keys never exposed in frontend bundle
- CORS restricted to Firebase domains only
- Independent deployments reduce attack surface

**💰 Cost:**
- Firebase Hosting free tier (generous limits)
- Cloud Run pay-per-request (scales to zero)
- No database costs (static GeoJSON data)

This is the complete technical picture. CityPee finds toilets using modern microservices: Firebase CDN + Express API. Clean, fast, secure.