# last updated on: 2025-08-27 23:09:27
# Firebase Hosting + Cloud Run Backend Migration Plan

**Date:** August 27, 2025  
**Issue:** Next.js on Cloud Run has complex environment variable handling preventing Google Maps API key access  
**Solution:** Migrate to Firebase Hosting (static frontend) + Cloud Run (API backend) architecture  
**Status:** Planning Phase  

---

## 🧠 Mental Model: Current vs Proposed Architecture

### Current Architecture (Problematic)
```
┌─────────────────────────────────────┐
│        CLOUD RUN INSTANCE           │
│  ┌─────────────────────────────┐    │
│  │       NEXT.JS SERVER        │    │
│  │                             │    │
│  │  ┌─────────┐  ┌───────────┐ │    │
│  │  │  PAGES  │  │    API    │ │    │
│  │  │         │  │  ROUTES   │ │    │
│  │  │ page.tsx│  │ /config   │ │    │
│  │  │         │  │ /search   │ │    │
│  │  └─────────┘  └───────────┘ │    │
│  │                             │    │
│  │ 🔴 Complex env var handling │    │
│  │ 🔴 Build vs runtime issues  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Problems:**
- `NEXT_PUBLIC_` vars need build-time availability
- Environment variables showing as empty at runtime
- Server-side rendering complexity
- Single deployment artifact containing frontend + backend

### Proposed Architecture (Clean Separation)
```
┌─────────────────────────┐    ┌─────────────────────────┐
│   FIREBASE HOSTING      │    │      CLOUD RUN          │
│                         │    │                         │
│ ┌─────────────────────┐ │    │ ┌─────────────────────┐ │
│ │   STATIC FRONTEND   │ │    │ │   EXPRESS SERVER    │ │
│ │                     │ │    │ │                     │ │
│ │  React Components   │ │    │ │  GET /api/config    │ │
│ │  Google Maps        │◄┼────┼─│  GET /api/search    │ │
│ │  Location Search    │ │    │ │                     │ │
│ │  Client-side JS     │ │    │ │ ✅ Simple env vars  │ │
│ │                     │ │    │ │ ✅ Standard Node.js │ │
│ └─────────────────────┘ │    │ └─────────────────────┘ │
│                         │    │                         │
│ ✅ CDN + Auto SSL      │    │ ✅ Backend focus only   │
│ ✅ Static optimization │    │ ✅ Independent scaling  │
└─────────────────────────┘    └─────────────────────────┘
```

**Benefits:**
- Clean separation of concerns
- Standard environment variable handling
- Independent deployment and scaling
- Leverages Firebase CDN and optimizations

---

## 📋 Migration Steps (Incremental)

### Phase 1: Prepare Backend API Service
**Goal:** Extract API routes to standalone Express server

1. **Create Express server** (`api-server/`)
   ```javascript
   // api-server/server.js
   const express = require('express')
   const app = express()
   
   app.get('/api/config', (req, res) => {
     const apiKey = process.env.GOOGLE_MAPS_API_KEY
     if (!apiKey) {
       return res.status(503).json({ error: 'Configuration unavailable' })
     }
     res.json({ mapsApiKey: apiKey })
   })
   
   app.get('/api/search', (req, res) => {
     // Existing toilet search logic
   })
   ```

2. **Deploy to Cloud Run**
   ```bash
   # Build and deploy API service
   gcloud run deploy citypee-api \
     --source ./api-server \
     --region us-east1 \
     --set-env-vars GOOGLE_MAPS_API_KEY=AIzaSy...
   ```

3. **Test API endpoints**
   ```bash
   curl https://citypee-api-xxx.run.app/api/config
   curl https://citypee-api-xxx.run.app/api/search?lat=51.5&lng=-0.1
   ```

### Phase 2: Prepare Frontend for Static Export
**Goal:** Configure Next.js for static generation

1. **Update `next.config.js`**
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     images: {
       unoptimized: true
     }
   }
   
   module.exports = nextConfig
   ```

2. **Update API calls to use Cloud Run backend**
   ```typescript
   // Update src/app/page.tsx
   const API_BASE = process.env.NODE_ENV === 'production' 
     ? 'https://citypee-api-xxx.run.app'
     : 'http://localhost:8080'
   
   fetch(`${API_BASE}/api/config`)
   fetch(`${API_BASE}/api/search?lat=${lat}&lng=${lng}`)
   ```

3. **Test static build**
   ```bash
   npm run build
   # Should generate ./out/ directory
   ```

### Phase 3: Deploy to Firebase Hosting
**Goal:** Serve static frontend from Firebase CDN

1. **Initialize Firebase**
   ```bash
   firebase init hosting
   # Public directory: out
   # Single-page app: Yes
   # Configure as a single-page app (rewrite all urls to /index.html)? Yes
   ```

2. **Configure `firebase.json` (Latest 2025 Config)**
   ```json
   {
     "hosting": {
       "public": "out",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ],
       "headers": [
         {
           "source": "**/*.@(eot|otf|ttf|ttc|woff|font.css)",
           "headers": [
             {
               "key": "Access-Control-Allow-Origin",
               "value": "*"
             }
           ]
         },
         {
           "source": "**/*.@(js|css)",
           "headers": [
             {
               "key": "Cache-Control",
               "value": "max-age=604800"
             }
           ]
         },
         {
           "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
           "headers": [
             {
               "key": "Cache-Control",
               "value": "max-age=604800"
             }
           ]
         }
       ]
     }
   }
   ```

3. **Deploy**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Phase 4: Update Domain and Cleanup
**Goal:** Switch production traffic and clean up

1. **Update domain configuration**
2. **Test end-to-end functionality**
3. **Remove old Next.js Cloud Run service**
4. **Update documentation**

---

## 🔄 Rollback Plan

If migration fails at any point:
```bash
# Revert to current working state
gcloud run deploy citypee \
  --image gcr.io/peecity/citypee:runtime-config-fix \
  --region us-east1
```

Current working image preserved as backup.

---

## 📊 Success Criteria

### Technical Validation
- [ ] API endpoints respond correctly from Cloud Run
- [ ] Static frontend loads from Firebase Hosting
- [ ] Google Maps integration works end-to-end
- [ ] Environment variables accessible in Express server
- [ ] All 1,053 toilets display correctly
- [ ] Location search and GPS functionality preserved

### Performance Validation
- [ ] Page load time ≤ current performance
- [ ] API response times ≤ 200ms
- [ ] CDN serving static assets correctly

### Documentation Updates Required
- [ ] Update README.md with new architecture
- [ ] Update DEVELOPER-GUIDE.md
- [ ] Update deployment scripts
- [ ] Update CLAUDE.md with new commands

---

## 🛡️ Risk Assessment

### Low Risk
- **API extraction**: Same logic, different server
- **Static export**: Next.js supports this natively
- **Firebase hosting**: Proven, reliable platform

### Medium Risk
- **Environment variable handling**: Should work better, not worse
- **CORS configuration**: May need adjustment
- **Domain switching**: Requires careful coordination

### Mitigation Strategies
- **Incremental deployment**: Deploy backend first, test thoroughly
- **Parallel testing**: Keep current system running during migration
- **Quick rollback**: Preserved working Docker image

---

## 🛡️ Security & Resilience Considerations

### Security Architecture Analysis

#### Current Security Posture (Next.js on Cloud Run)
```
┌─────────────────────────────────────┐
│        SINGLE ATTACK SURFACE       │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    NEXT.JS MONOLITH         │    │
│  │                             │    │
│  │  Frontend + API + Secrets   │    │
│  │  Single Point of Failure    │    │
│  │  Environment Variable Issues│    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘

🔴 Risks: Single point of compromise
🔴 Secrets: Mixed with application code
🔴 Blast radius: Entire application
```

#### Proposed Security Architecture (Firebase + Cloud Run)
```
┌─────────────────────────┐    ┌─────────────────────────┐
│   FIREBASE HOSTING      │    │      CLOUD RUN API      │
│   (Static Assets)       │    │     (Backend Only)      │
│                         │    │                         │
│  ✅ No Server Logic     │    │  ✅ Isolated Secrets    │
│  ✅ CDN Protection      │    │  ✅ Single Purpose      │
│  ✅ DDoS Resilience     │◄───┤  ✅ Proper Env Vars    │
│  ✅ Auto-scaling        │    │  ✅ Network Controls    │
└─────────────────────────┘    └─────────────────────────┘

🟢 Benefits: Separation of concerns
🟢 Secrets: Backend only, properly isolated
🟢 Blast radius: Limited to affected component
```

### Security Measures Implementation

#### 1. API Key Security (Enhanced)
```yaml
# Current: Problematic environment variable handling
Current State:
  - API key in Cloud Run env vars ❌
  - Next.js build-time complications ❌
  - Visibility in frontend bundle risk ❌

# Proposed: Clean backend-only API key handling
Proposed State:
  - API key in Cloud Run backend only ✅
  - No frontend exposure risk ✅
  - Standard Node.js env var handling ✅
  - Google Console restrictions: 
    - HTTP referrer: https://citypee-xxx.web.app/* ✅
    - API restrictions: Maps JavaScript + Places ✅
```

#### 2. Network Security
```yaml
CORS Configuration:
  - Origin: https://citypee-xxx.web.app
  - Methods: GET only
  - Headers: Content-Type, Authorization (if needed)
  - Credentials: false

API Endpoint Security:
  - Rate limiting: Cloud Run built-in
  - Request validation: Input sanitization
  - Error handling: No sensitive data leakage
  - Logging: Security events without secrets

Firebase Hosting Security:
  - HTTPS enforced automatically
  - Security headers: CSP, HSTS, X-Frame-Options
  - Asset integrity: SRI for critical resources
```

#### 3. Data Protection
```yaml
Toilet Data (Public):
  - Location: Firebase Hosting (static)
  - Caching: CDN-optimized
  - Integrity: Build-time validation
  - No PII: Location data only

API Responses:
  - Minimal data exposure
  - No internal system details
  - Structured error responses
  - Request logging (no sensitive data)
```

### Resilience & Availability

#### 1. Fault Tolerance Design
```yaml
Frontend Resilience (Firebase):
  - Global CDN: Multi-region failover
  - Edge caching: 99.99% availability
  - Static assets: No dynamic dependencies
  - Graceful degradation: Works offline-first capable

Backend Resilience (Cloud Run):
  - Auto-scaling: 0 to 1000+ instances
  - Health checks: HTTP /health endpoint
  - Circuit breaker: Frontend handles API failures
  - Retry logic: Exponential backoff
```

#### 2. Error Handling Strategy
```typescript
// Frontend Error Boundaries
class APIErrorBoundary extends React.Component {
  handleConfigError: {
    // Fallback: Show "Service maintenance" message
    // Retry: Automatic with exponential backoff
    // User action: Manual retry button
  }
  
  handleSearchError: {
    // Fallback: Show cached/default locations
    // Graceful: Map still functions without live data
    // Recovery: Background retry attempts
  }
}

// Backend Error Responses
API Error Standards:
  - 503: Service Unavailable (API key issues)
  - 429: Too Many Requests (rate limiting)
  - 500: Internal Server Error (system issues)
  - 400: Bad Request (invalid parameters)
```

#### 3. Monitoring & Alerting
```yaml
Firebase Hosting Monitoring:
  - Page load metrics
  - Asset delivery performance
  - Error rates and types
  - User engagement metrics

Cloud Run API Monitoring:
  - Response time percentiles
  - Error rate thresholds
  - Memory/CPU utilization
  - Request volume patterns

Critical Alerts:
  - API key configuration failures
  - Search API response degradation
  - Frontend asset delivery issues
  - Unusual traffic patterns
```

### Business Continuity

#### 1. Disaster Recovery
```yaml
RTO (Recovery Time Objective): < 15 minutes
RPO (Recovery Point Objective): < 1 hour

Backup Strategy:
  - Git repository: Multiple remotes
  - Docker images: Container Registry retention
  - Configuration: Infrastructure as Code
  - Data: Toilet data in version control

Recovery Procedures:
  1. Rollback frontend: Firebase hosting rollback
  2. Rollback backend: Cloud Run revision rollback  
  3. Emergency mode: Static fallback with cached data
  4. Communication: Status page for user updates
```

#### 2. Maintenance & Updates
```yaml
Zero-Downtime Deployment:
  - Frontend: Blue-green deployment via Firebase
  - Backend: Cloud Run traffic splitting
  - Database: Not applicable (static data)
  - Testing: Staging environment validation

Maintenance Windows:
  - Planned: None required (rolling updates)
  - Emergency: < 5 minute service interruption
  - Communication: In-app notifications
```

### Compliance & Privacy

#### 1. Data Governance
```yaml
Data Classification:
  - Public: Toilet locations (OpenStreetMap derived)
  - Internal: API usage metrics
  - Confidential: API keys and system configuration
  - No PII: No user personal data stored

Data Retention:
  - Logs: 30 days (Cloud Run/Firebase)
  - Metrics: 1 year (monitoring data)
  - Static data: Indefinite (public toilet locations)
```

#### 2. Security Incident Response
```yaml
Incident Categories:
  - P0: Service completely unavailable
  - P1: API key compromise
  - P2: Performance degradation
  - P3: Minor functionality issues

Response Procedures:
  1. Detection: Automated monitoring alerts
  2. Assessment: Impact and scope evaluation
  3. Containment: Immediate mitigation steps
  4. Recovery: Service restoration
  5. Documentation: Post-incident review
```

### Security Validation Checklist

#### Pre-Migration Security Audit
- [ ] **API Key Management**
  - [ ] Remove API key from frontend environment variables
  - [ ] Verify backend-only API key storage
  - [ ] Configure Google Console restrictions
  - [ ] Test key rotation procedures

- [ ] **Network Security**
  - [ ] Configure CORS policies
  - [ ] Validate HTTPS enforcement
  - [ ] Test cross-origin request handling
  - [ ] Verify security headers

- [ ] **Access Control**
  - [ ] Firebase project permissions
  - [ ] Cloud Run service account permissions
  - [ ] Container Registry access controls
  - [ ] Deployment pipeline security

#### Post-Migration Security Validation
- [ ] **Penetration Testing**
  - [ ] API endpoint security testing
  - [ ] CORS configuration validation
  - [ ] Rate limiting verification
  - [ ] Error handling security review

- [ ] **Monitoring Setup**
  - [ ] Security alert configuration
  - [ ] Anomaly detection setup
  - [ ] Performance baseline establishment
  - [ ] Incident response procedures tested

---

## 💰 Cost Implications

### Current: Next.js on Cloud Run
- Single Cloud Run service with CPU/memory for full-stack

### Proposed: Firebase + Cloud Run
- **Firebase Hosting**: Free tier likely sufficient (static assets)
- **Cloud Run API**: Lower resource requirements (API only)
- **Net cost**: Likely neutral or lower

---

## 🎯 Decision Framework

### Proceed with Migration if:
✅ You're comfortable with Firebase Hosting  
✅ You want cleaner architecture  
✅ Current env var issue persists after hardcode test  
✅ You prefer separation of concerns  

### Stay with Current if:
❌ Hardcode test resolves the issue completely  
❌ You prefer single-deployment simplicity  
❌ Migration timeline is too long  

---

## ✅ Pre-Flight Checklist

**CRITICAL: Execute these checks before starting migration**

### Current State Verification
- [ ] **Document current working URLs**
  - [ ] Main app: https://citypee-310116477099.us-east1.run.app
  - [ ] API endpoints: `/api/search` returns 1,053 toilets
  - [ ] Current Cloud Run service: `citypee` in `us-east1`
  - [ ] Working Docker image: `gcr.io/peecity/citypee:runtime-config-fix`

- [ ] **Backup current state**
  - [ ] Git commit all current changes
  - [ ] Tag current commit: `git tag pre-firebase-migration`
  - [ ] Verify rollback image available: `gcr.io/peecity/citypee:runtime-config-fix`

- [ ] **Test current functionality**
  - [ ] App loads (even with config error)
  - [ ] Search API returns toilet data: `curl /api/search?lat=51.5&lng=-0.1`
  - [ ] Location components render without crashes
  - [ ] No critical JavaScript errors in browser console

### Environment & Access Verification  
- [ ] **Firebase access confirmed**
  - [ ] Firebase CLI installed: `firebase --version`
  - [ ] Logged into correct account: `firebase projects:list`
  - [ ] Can create/deploy to Firebase project

- [ ] **Google Cloud access confirmed**
  - [ ] Can deploy to Cloud Run: `gcloud run services list`
  - [ ] API key confirmed in console: Google Cloud Console → APIs & Services → Credentials
  - [ ] API key restrictions currently: DISABLED (for testing)

- [ ] **Development environment ready**
  - [ ] All dependencies installed: `npm install`
  - [ ] Can build locally: `npm run build`
  - [ ] No TypeScript errors in IDE

### Data & Dependencies Verification
- [ ] **Core data intact**
  - [ ] Toilet data file exists: `data/toilets.geojson` (1,053 records)
  - [ ] Search logic preserved in current codebase
  - [ ] LocationSearch component functional

- [ ] **Key dependencies identified**
  - [ ] Google Maps: `@vis.gl/react-google-maps v1.5.5`
  - [ ] Next.js: Current version and configuration
  - [ ] Tailwind CSS: Styling preserved

### Risk Assessment
- [ ] **Understand rollback procedure**
  - [ ] Can revert to: `gcloud run deploy citypee --image gcr.io/peecity/citypee:runtime-config-fix`
  - [ ] Rollback time estimate: < 5 minutes
  - [ ] DNS/domain changes required: NO (using same Cloud Run URL initially)

- [ ] **Identify breaking points**
  - [ ] API endpoint changes: `/api/config`, `/api/search` → new Cloud Run service
  - [ ] Frontend asset loading: Next.js → Static Firebase hosting
  - [ ] CORS configuration: May need adjustment for cross-origin API calls

### Success Criteria Defined
- [ ] **Functional requirements**
  - [ ] Google Maps loads with API key
  - [ ] 1,053 toilets display on map  
  - [ ] GPS location detection works
  - [ ] Search/autocomplete functional
  - [ ] Walking radius circles appear
  - [ ] Mobile responsive

- [ ] **Performance requirements**
  - [ ] Page load ≤ current performance
  - [ ] API responses ≤ 500ms
  - [ ] No console errors

---

## 📋 Pre-Flight Execution Commands

### 1. State Documentation
```bash
# Document current service
gcloud run services describe citypee --region=us-east1

# Test current APIs
curl -s https://citypee-310116477099.us-east1.run.app/api/search?lat=51.5074&lng=-0.1278 | head -20

# Check git status
git status
git log --oneline -5
```

### 2. Backup Current State  
```bash
# Commit current state
git add .
git commit -m "Pre-migration backup: Current Next.js on Cloud Run state"
git tag pre-firebase-migration
git push origin main --tags
```

### 3. Environment Verification
```bash
# Firebase CLI
firebase --version
firebase projects:list

# Google Cloud CLI  
gcloud run services list --region=us-east1
gcloud auth list

# Local build test
npm run build
```

### 4. Create Migration Branch
```bash
git checkout -b firebase-migration
```

---

## 🚨 GO/NO-GO Decision Criteria

### ✅ GO Criteria (Proceed with Migration)
- All pre-flight checks passed
- Current state documented and backed up  
- Firebase environment confirmed working
- Team/user ready for potential downtime
- Rollback procedure confirmed tested

### ❌ NO-GO Criteria (Stay with Current Architecture)  
- Any pre-flight check failures
- Cannot access Firebase or Cloud Run
- Critical functionality broken in current state
- User not comfortable with migration risk
- Time constraints prevent proper execution

---

## 📝 Next Actions

1. **Execute pre-flight checklist** (REQUIRED FIRST)
2. **GO/NO-GO decision** based on checklist results
3. **If GO**: Execute Phase 1 (API service extraction)
4. **If NO-GO**: Focus on debugging current environment variable issue

---

*Pre-flight checklist ready for execution - ensuring safe migration with clear rollback path.*

---

## 📚 Firebase Documentation References (2025)

Based on official Firebase documentation consulted via Context7:

### Firebase Hosting Configuration
- **Static Export Support**: Firebase Hosting natively supports Next.js static exports via `out/` directory
- **SPA Routing**: Single-page app rewrites (`"source": "**", "destination": "/index.html"`) handle client-side routing
- **Performance Headers**: Cache-Control headers optimize asset delivery (604800s = 1 week for static assets)
- **CORS Support**: Access-Control-Allow-Origin headers for font assets prevent cross-origin issues

### Firebase CLI Commands (Verified Current)
```bash
# Install globally (confirmed working)
npm -g install firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Deploy hosting only
firebase deploy --only hosting

# Start local emulator
firebase emulators:start --only hosting
```

### Security Best Practices (From Documentation)
- **Environment Variables**: Store API keys in Cloud Run environment only
- **CORS Configuration**: Restrict origins to specific Firebase Hosting domain
- **API Restrictions**: Configure Google Maps API key restrictions in Console
- **Security Headers**: Firebase Hosting automatically adds HTTPS, security headers

### Cloud Run Integration Patterns
- **Environment Variables**: Standard Node.js `process.env` handling (no Next.js complications)
- **CORS Middleware**: Required for cross-origin requests from Firebase Hosting
- **Health Checks**: HTTP `/health` endpoint recommended
- **Auto-scaling**: 0 to 1000+ instances supported

### Performance Optimizations
- **CDN Caching**: Firebase Hosting provides global CDN automatically
- **Asset Optimization**: Automatic compression and optimization
- **Edge Locations**: 180+ edge locations worldwide
- **HTTP/2 Support**: Automatic HTTP/2 and HTTP/3 support

---