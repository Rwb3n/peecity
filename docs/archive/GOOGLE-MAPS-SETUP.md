# 🗺️ Google Maps API Setup Guide

**Complete setup guide for CityPee's Google Maps integration**

---

## 🎯 Required APIs

CityPee uses these Google Maps APIs:

### 1. Maps JavaScript API
- **Purpose:** Interactive map display
- **Usage:** Main map component with toilet markers
- **Free tier:** 28,000 map loads/month

### 2. Places API
- **Purpose:** Autocomplete search functionality  
- **Usage:** "Type any London location..." search box
- **Free tier:** 10,000 requests/month

---

## 🔧 Setup Instructions

### Step 1: Create Google Cloud Project
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Name it something like "citypee-maps"

### Step 2: Enable Required APIs
1. Go to **APIs & Services** → **Library**
2. Search and enable:
   - **Maps JavaScript API**
   - **Places API**

### Step 3: Create API Key
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the generated key

### Step 4: Secure Your API Key (Optional but Recommended)
1. Click on your API key to edit
2. Under **Application restrictions**:
   - Select **HTTP referrers**
   - Add: `http://localhost:3000/*` (for development)
   - Add your production domain when deploying
3. Under **API restrictions**:
   - Select **Restrict key**
   - Choose: Maps JavaScript API, Places API

### Step 5: Add to CityPee
```bash
# Create .env.local in your project root
echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here" > .env.local
```

---

## 💰 Cost Breakdown

### Free Tier (More than enough for development/personal use):
- **Maps JavaScript API:** 28,000 map loads/month
- **Places API:** 10,000 autocomplete requests/month
- **Geolocation:** Unlimited (browser-based)

### Estimated Usage for CityPee:
- **Development:** ~100 map loads/day = 3,000/month
- **Small production:** ~1,000 map loads/day = 30,000/month
- **Autocomplete:** ~200 searches/day = 6,000/month

**Result:** Free tier covers development and early production easily!

---

## 🔍 How CityPee Uses Each API

### Maps JavaScript API
```javascript
// Main interactive map
<Map
  center={userLocation || {lat: 51.5074, lng: -0.1278}}
  zoom={15}
  mapId="DEMO_MAP_ID"
>
  {/* Toilet markers */}
  <AdvancedMarker position={{lat: toilet.lat, lng: toilet.lng}}>
    🚻
  </AdvancedMarker>
</Map>
```

### Places API  
```javascript
// Autocomplete search
const autocomplete = new placesLibrary.Autocomplete(inputRef.current, {
  fields: ['formatted_address', 'geometry', 'name'],
  bounds: LONDON_BOUNDS,
  strictBounds: true
})
```

### Custom Walking Circles
```javascript
// Not using Google APIs - custom implementation
const circles = [
  new google.maps.Circle({
    center: userLocation,
    radius: 83 * 5, // 5 min walk
    fillColor: '#3B82F6',
    map
  })
]
```

---

## 🐛 Troubleshooting

### "This page didn't load Google Maps correctly"
- ✅ Check API key is in `.env.local`
- ✅ Verify Maps JavaScript API is enabled
- ✅ Check browser console for specific error

### "Autocomplete not working"
- ✅ Verify Places API is enabled  
- ✅ Check API key restrictions allow localhost
- ✅ Confirm API key has Places API permission

### "Over quota" errors
- ✅ Check [Google Cloud Console quota page](https://console.cloud.google.com/apis/api/maps-backend.googleapis.com/quotas)
- ✅ Monitor usage in Console
- ✅ Consider setting billing alerts

### API key visible in browser
- ✅ This is normal for `NEXT_PUBLIC_` variables
- ✅ Secure with domain restrictions in Console
- ✅ Never commit API keys to public repos

---

## 🚀 Production Deployment

### Environment Variables
```bash
# Production .env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_production_key
```

### API Key Security for Production
1. **Domain restrictions:**
   - Add your production domain
   - Remove localhost restrictions
2. **Usage monitoring:**
   - Set up billing alerts
   - Monitor quotas regularly
3. **Key rotation:**
   - Rotate keys periodically
   - Have backup keys ready

---

## 📊 Monitoring Usage

### Google Cloud Console
1. Go to **APIs & Services** → **Quotas**
2. Filter by "Maps JavaScript API" and "Places API"
3. Monitor current usage vs limits

### Setting Up Alerts
1. **Navigation:** Billing → Budgets & alerts
2. **Create alert** when approaching free tier limits
3. **Email notifications** for quota warnings

---

## 🔄 Alternative Providers (If Needed)

If you exceed Google's free tier:

### Mapbox
- More generous free tier
- Different API structure
- Would require code changes

### OpenStreetMap + Leaflet
- Completely free
- No API key required
- Less features than Google Maps

### Azure Maps
- Microsoft alternative
- Different pricing structure

**Recommendation:** Stick with Google Maps - the free tier is generous and the integration is already complete!

---

## ✅ Verification Checklist

- [ ] Google Cloud project created
- [ ] Maps JavaScript API enabled
- [ ] Places API enabled  
- [ ] API key created and copied
- [ ] API key added to `.env.local`
- [ ] CityPee loads without "didn't load Google Maps correctly" error
- [ ] GPS location detection works
- [ ] Autocomplete search works
- [ ] Toilet markers display correctly
- [ ] Walking circles appear around user location

**When all items are checked:** 🎉 **Google Maps integration is complete!**

---

*This setup enables all of CityPee's mapping functionality with Google's generous free tier.*