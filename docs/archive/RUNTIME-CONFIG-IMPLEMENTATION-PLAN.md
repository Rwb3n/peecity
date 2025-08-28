# last updated on: 2025-08-27 21:50:59
# CityPee Runtime Config Implementation Plan

**Date:** August 27, 2025  
**Issue:** Google Maps API key not available at client-side due to Next.js build-time requirements  
**Solution:** Runtime configuration API approach (secure, conventional)  

---

## 🎯 Problem Analysis (Five Whys Complete)

**Root Cause:** Next.js `NEXT_PUBLIC_` variables must be available at BUILD TIME to be embedded in client bundle, but we only set environment variables at Cloud Run RUNTIME.

**Current Status:** 
- ✅ Cloud Run environment variable set correctly
- ✅ App code properly checks for API key  
- ❌ API key undefined in production client bundle

---

## 🔐 Security & Resilience Measures

### Security Implementation
```javascript
// 1. Google Maps API Key Restrictions (YOU MUST DO)
// - Add HTTP referrer restrictions: citypee-*.run.app/*
// - Add IP restrictions if needed
// - Restrict to Maps JavaScript API only
```

### API Endpoint Security
```javascript
// /api/config endpoint design
return {
  mapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY // ONLY this key
  // Never: return { env: process.env } - security risk
}
```

### Error Handling
```javascript
// Graceful degradation patterns
if (!config.mapsApiKey) {
  // Show "Service temporarily unavailable" instead of breaking
  return <ServiceUnavailableMessage />
}
```

---

## 📋 Implementation Steps

### Step 1: Create Config API Endpoint (Claude)
**File:** `src/app/api/config/route.ts`

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!mapsApiKey) {
      return NextResponse.json(
        { error: 'Configuration unavailable' }, 
        { status: 503 }
      )
    }

    return NextResponse.json({
      mapsApiKey
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Configuration service error' }, 
      { status: 500 }
    )
  }
}
```

### Step 2: Update Page Component (Claude)
**File:** `src/app/page.tsx`

```typescript
// Replace this:
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

// With this:
const [config, setConfig] = useState<{mapsApiKey?: string}>({})
const [configLoading, setConfigLoading] = useState(true)
const [configError, setConfigError] = useState<string | null>(null)

useEffect(() => {
  fetch('/api/config')
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        setConfigError(data.error)
      } else {
        setConfig(data)
      }
    })
    .catch(err => setConfigError('Failed to load configuration'))
    .finally(() => setConfigLoading(false))
}, [])

// Loading state
if (configLoading) {
  return <div className="...">Loading CityPee...</div>
}

// Error state  
if (configError || !config.mapsApiKey) {
  return <div className="...">Service temporarily unavailable</div>
}

// Use config.mapsApiKey instead of apiKey
<APIProvider apiKey={config.mapsApiKey}>
```

### Step 3: Google Maps API Security Configuration (USER)
**Location:** Google Cloud Console → APIs & Services → Credentials

```yaml
API Key Restrictions:
  Application restrictions:
    - HTTP referrers (web sites)
    - Add: https://citypee-310116477099.us-east1.run.app/*
    - Add: https://*.run.app/* (for future domains)
  
  API restrictions:
    - Restrict key to specific APIs
    - Select: Maps JavaScript API
    - Select: Places API
```

### Step 4: Test Implementation (Both)
```bash
# Test config endpoint
curl https://citypee-310116477099.us-east1.run.app/api/config

# Expected response:
{"mapsApiKey":"AIzaSy..."}
```

### Step 5: Deploy & Verify (Claude)
```bash
# No Docker changes needed - uses existing Cloud Run env vars
gcloud run deploy citypee \
  --image gcr.io/peecity/citypee:latest \
  --region us-east1
```

---

## 🚦 Failure Prevention

### What NOT to do (Security Disasters)
- ❌ Hardcode API key in source code
- ❌ Commit `.env.local` to Git  
- ❌ Return `process.env` object from API
- ❌ Skip API key restrictions in Google Console

### What NOT to do (Over-Engineering)
- ❌ Add Redis/database for config caching
- ❌ Create complex secret management systems
- ❌ Use Kubernetes secrets for this simple case
- ❌ Build custom authentication for public config

---

## 🎨 User Experience States

```
Loading State → Show "Loading CityPee..." with spinner
Success State → Maps loads normally  
Error State → "Service temporarily unavailable" with retry button
Network Error → "Please check your connection" with retry
```

---

## 📊 Success Metrics

- ✅ API endpoint responds with valid key
- ✅ Maps loads without "API key not configured" error
- ✅ No console errors about missing API key
- ✅ Toilet markers display correctly
- ✅ Location search functions work

---

## 🔄 Rollback Plan

If implementation fails:
```bash
# Revert to previous working image
gcloud run deploy citypee \
  --image gcr.io/peecity/citypee:previous-tag \
  --region us-east1
```

Current working state preserved in: `gcr.io/peecity/citypee:latest`

---

## 📝 Implementation Checklist

### Claude Tasks:
- [ ] Create `/api/config` endpoint with security measures
- [ ] Update page.tsx with runtime config loading
- [ ] Add loading and error states
- [ ] Test config endpoint locally if possible
- [ ] Deploy to Cloud Run (no Docker changes needed)
- [ ] Verify maps load correctly

### User Tasks:
- [ ] Set up Google Maps API key restrictions in Console
- [ ] Test the live application in browser
- [ ] Verify no console errors
- [ ] Confirm toilet markers and search work

---

## 📚 Google Maps Documentation References

Based on latest Google documentation:
- Maps JavaScript API uses standard HTTPS referrer restrictions
- Environment variables in Next.js must be available at build-time for `NEXT_PUBLIC_` prefix
- Runtime configuration via API endpoints is the recommended pattern for production
- API key restrictions should be configured for production deployments

---

**Next Action:** Implement `/api/config` endpoint and update page component.