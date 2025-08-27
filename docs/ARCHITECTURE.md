# CityPee Architecture

**Simple visual guide to how our toilet finder works**

---

## System Overview

```
User's Phone/Browser
       |
   [LocationSearch]
       |
   [Google Maps]
       |
   [1,053 Toilets]
```

CityPee is a Next.js web app that shows toilets on Google Maps with walking circles. That's it.

---

## Data Flow

```
1. USER SEARCHES
   └── GPS Location OR Google Places OR Landmark Button
       └── LocationSearch.tsx

2. APP FETCHES DATA  
   └── /api/search?lat=X&lng=Y
       └── Reads toilets.geojson (1,053 toilets)
       └── Returns toilets within radius

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
├── 🎯 CORE APP (3 files)
│   ├── src/app/page.tsx           ← Main Google Maps page
│   ├── src/app/api/search/route.ts ← Toilet data API
│   └── src/components/LocationSearch.tsx ← GPS + search
│
├── 📊 DATA (1 file)  
│   └── data/toilets.geojson       ← 1,053 real London toilets
│
├── 🎨 UI COMPONENTS (4 files)
│   ├── src/components/ToiletCard.tsx
│   └── src/components/ui/         ← button, card, input
│
└── ⚙️ CONFIG (30 files)
    ├── package.json, next.config.js
    ├── Dockerfile, deploy script
    └── docs/, README files
```

**Total: 38 files. Core functionality: 4 files.**

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

```
GET /api/search?lat=51.5074&lng=-0.1278&radius=1000

Returns:
{
  "success": true,
  "data": [
    {
      "id": "osm_node_123",
      "name": "Public Toilets",
      "lat": 51.5074,
      "lng": -0.1278,
      "hours": "24/7",
      "accessible": true,
      "fee": 0,
      "address": "London"
    }
  ],
  "meta": {
    "total": 15,
    "returned": 15
  }
}
```

**Simple filtering:**
- Location radius (meters)
- Text search (name/address)
- Result limit (default 50)

---

## Technology Stack

```
Frontend:
├── Next.js 15 (React 18 + TypeScript)
├── @vis.gl/react-google-maps v1.5.5
└── Tailwind CSS

APIs:
├── Google Maps JavaScript API
└── Google Places API (autocomplete)

Data:
└── Static GeoJSON file (1,053 toilets)

Deployment:
├── Docker container
└── Google Cloud Run
```

**No databases, no complex state management, no microservices.**

---

## Component Hierarchy

```
page.tsx (Main App)
├── LocationSearch
│   ├── GPS button
│   ├── Google Places input
│   └── Landmark buttons (6 locations)
├── Google Maps
│   ├── WalkingCircles component
│   ├── User location marker
│   ├── Toilet markers (🚻)
│   └── InfoWindow (clicked toilet)
└── Walking legend
```

---

## Deployment Flow

```
1. LOCAL DEVELOPMENT
   npm run dev (USER ONLY - never Claude!)
   
2. BUILD & TEST  
   npm run build
   
3. DOCKER BUILD
   docker build -t citypee .
   
4. DEPLOY TO CLOUD RUN
   ./scripts/deploy-to-cloud-run.sh
   
5. PRODUCTION
   https://citypee-xxx.run.app
```

**Environment needed:**
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

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
   └── Check GOOGLE_MAPS_API_KEY in .env.local

❌ "Cannot read lat of undefined"  
   └── API returned invalid toilet data

❌ GPS permission denied
   └── Falls back to manual search + landmarks

❌ Port 3000 busy
   └── User must stop previous server with Ctrl+C
```

---

This is the complete technical picture. CityPee finds toilets using Google Maps with walking circles. Nothing more, nothing less.