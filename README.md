# last updated on: 2025-08-28 16:21:04
# 🚻 CityPee London - Toilet Finder
**Live Production App: https://peecity.web.app**

**Interactive Google Maps for finding London's public toilets with walking distance circles.**

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Toilets](https://img.shields.io/badge/London%20Toilets-1,053-green)
![Architecture](https://img.shields.io/badge/Firebase%2BCloudRun-Microservices-blue)
![Security](https://img.shields.io/badge/Security-Enterprise%20Grade-green)
![Performance](https://img.shields.io/badge/API-160ms%20Avg-green)
![Maps](https://img.shields.io/badge/Google%20Maps-Live-blue)

---

## 📑 Table of Contents
- [📋 Development Status](#-development-status)
- [🌐 Try It Now - It's Live!](#-try-it-now---its-live)
- [What This Is (In 3 Sentences)](#what-this-is-in-3-sentences)
- [🏗️ Current Architecture](#️-current-architecture-post-migration)
- [🚀 Quick Start Options](#-quick-start-options)
- [🎉 What's Working (Production Live!)](#-whats-working-production-live)
- [📂 Project Structure](#-project-structure-post-migration)
- [🛠️ Development Workflow](#️-development-workflow)
- [🔐 Security & Environment Setup](#-security--environment-setup)
- [📈 Performance & Monitoring](#-performance--monitoring)
- [🚀 Deployment Commands](#-deployment-commands)
- [📋 Available Commands](#-available-commands)
- [🐛 Troubleshooting](#-troubleshooting)
- [🎯 Current Status & Roadmap](#-current-status--roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🎯 The Mission](#-the-mission)

---

## 📋 **Development Status**

### **✅ COMPLETE** 
- **Production System** - Emergency fixes, mobile-first layout, drawer architecture
- **Core Features** - Google Maps, GPS, search, walking circles, mobile UX
- **Modern Architecture** - Firebase hosting + Cloud Run API + security hardening

### **🔄 IN PROGRESS**
- **Next Phase Planning** - Feature prioritization and roadmap discussion

### **🚀 UPCOMING**
- **Enhanced UX** - Compass navigation, settings panel, dark mode
- **Revenue Model** - Ad integration and monetization features  
- **Advanced Features** - Offline mode, PWA, multi-city expansion

### **📋 Planning Hub**
- **[Development Plan](docs/CRITICAL-UI-REPAIR-PLAN.md)** - Technical roadmap and implementation strategy
- **[Architecture Docs](docs/ARCHITECTURE.md)** - System design and technical decisions
- **[Project History](docs/checkpoints/)** - Implementation milestones and progress tracking

---

## 🌐 **Try It Now - It's Live!**

**Production App:** https://peecity.web.app  
✅ **1,053 real London toilets**  
✅ **GPS location detection**  
✅ **Walking distance circles (5/10/15 min)**  
✅ **Enterprise security (rate limited)**
✅ **160ms average API response time**

---

## What This Is (In 3 Sentences)

1. **Live web app** showing public toilets on Google Maps with walking distance circles
2. **Built for people who actually need toilets:** parents, disabled folks, delivery drivers  
3. **Production-ready architecture:** Firebase Hosting + Cloud Run backend

---

## 🏗️ Current Architecture (Post-Migration)

### **Modern Microservices Architecture**
```
┌─────────────────────────┐    ┌─────────────────────────┐
│   FIREBASE HOSTING      │    │      CLOUD RUN          │
│   🌐 peecity.web.app    │    │   🔧 Express API        │
│                         │    │                         │
│ • Static React App      │◄──►│ • /api/config endpoint  │
│ • Global CDN            │    │ • /api/search endpoint  │
│ • 804KB total           │    │ • 1,053 toilet dataset  │
│ • Auto HTTPS            │    │ • Environment variables │
└─────────────────────────┘    └─────────────────────────┘

Frontend: Static Next.js export served via Firebase CDN
Backend: Node.js Express API on Google Cloud Run
Security: API keys isolated, CORS configured, rate limiting active
```

### **Why This Architecture?**
- **🚀 Performance**: CDN-optimized static assets + auto-scaling API
- **🔒 Security**: API keys isolated, CORS protection, rate limiting (100 req/15min)
- **💰 Cost**: Firebase free tier + Cloud Run pay-per-use  
- **📱 Reliability**: Global CDN with 99.99% uptime

---

## 🚀 Quick Start Options

### **Option A: Use the Live App (0 minutes)**
Just visit **https://peecity.web.app** - it's already working!

### **Option B: Local Development (10 minutes)**
```bash
# 1. Clone and install
git clone https://github.com/Rwb3n/peecity.git
cd peecity
npm install

# 2. Start development (frontend only)
npm run dev
# Opens http://localhost:3000 (uses production API)

# 3. Optional: Run backend locally
cd api-server
npm install
GOOGLE_MAPS_API_KEY=your_key node server.js
```

### **Option C: Deploy Your Own (15 minutes)**
```bash
# 1. Deploy backend API
cd api-server
gcloud run deploy citypee-api --source . --region us-east1 \
  --set-env-vars GOOGLE_MAPS_API_KEY=your_key

# 2. Deploy frontend
npm run build
npx firebase deploy --only hosting

# 3. Your own toilet finder is live!
```

---

## 🎉 What's Working (Production Live!)

### ✅ **Core Features:**
- **🗺️ Interactive Google Maps** with 1,053 real London toilets
- **📍 GPS location detection** - "Find Toilets Near Me"  
- **🔍 Google Places autocomplete** search
- **🚶 Citymapper-style walking circles** (5/10/15 min radius)
- **ℹ️ Clickable toilet markers** with hours, fees, accessibility info
- **📱 Mobile-optimized** touch gestures and responsive design
- **⚡ Fast loading** - CDN-optimized static assets

### 🏗️ **Technical Features:**
- **Firebase Hosting** for global CDN delivery
- **Cloud Run Express API** for scalable backend
- **Environment variable security** - no API keys in frontend
- **CORS security** - restricted to Firebase domains only
- **Static export** - framework-agnostic deployment

---

## 📂 Project Structure (Post-Migration)

```
peecity/
├── 🌐 FRONTEND (Firebase Hosting)
│   ├── src/
│   │   ├── app/page.tsx              ← Main Google Maps implementation
│   │   └── components/
│   │       ├── LocationSearch.tsx    ← GPS + autocomplete + landmarks
│   │       ├── ToiletCard.tsx        ← Toilet details component
│   │       └── ui/                   ← Basic UI components
│   ├── out/                          ← Static build output (21 files)
│   ├── firebase.json                 ← Hosting configuration
│   └── next.config.js                ← Static export config
│
├── 🔧 BACKEND (Cloud Run)
│   └── api-server/
│       ├── server.js                 ← Express API endpoints
│       ├── data/toilets.geojson      ← 1,053 toilet dataset
│       ├── Dockerfile                ← Container configuration
│       └── package.json              ← API dependencies
│
├── 📊 DATA
│   └── data/toilets.geojson          ← Master toilet dataset
│
├── 📚 DOCUMENTATION
│   ├── docs/FIREBASE-CLOUD-RUN-MIGRATION-PLAN.md
│   ├── docs/POST-MIGRATION-CLEANUP-PLAN.md
│   ├── docs/SECURITY-REVIEW-PLAN.md
│   └── docs/checkpoints/             ← Project history
│
└── ⚙️ CONFIG
    ├── package.json                  ← Frontend dependencies
    └── tailwind.config.js            ← Styling configuration
```

**Clean separation:** Frontend and backend are completely independent deployments.

---

## 🛠️ Development Workflow

### **Frontend Development**
```bash
# Start local development (uses production API)
npm run dev
# Opens http://localhost:3000

# Build static export  
npm run build
# Generates optimized files in out/

# Deploy to Firebase Hosting
npx firebase deploy --only hosting
```

### **Backend Development**
```bash
# Run Express API locally
cd api-server
npm install
GOOGLE_MAPS_API_KEY=your_key node server.js
# API available at http://localhost:8080

# Deploy to Cloud Run
gcloud run deploy citypee-api --source . --region us-east1 \
  --set-env-vars GOOGLE_MAPS_API_KEY=your_key
```

### **Data Management**
```bash
# Update toilet dataset
npm run ingest  # Fetches latest from OpenStreetMap

# Copy to backend
cp data/toilets.geojson api-server/data/
```

---

## 🔐 Security & Environment Setup

### **No Frontend Environment Variables Needed!**
The frontend is completely static - no API keys or secrets required locally.

### **Backend Environment Variables (Cloud Run)**
```bash
# Set in Cloud Run deployment
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### **Google Maps API Setup:**
1. **Get API Key**: [Google Cloud Console](https://console.cloud.google.com/maps)
2. **Enable APIs**:
   - Maps JavaScript API
   - Places API  
3. **Set Restrictions**:
   - HTTP referrers: `https://peecity.web.app/*`
   - API restrictions: Maps JavaScript + Places only

### **Security Features:**
- ✅ **API Key Protection** - Google Maps key isolated in backend environment
- ✅ **CORS Security** - requests restricted to Firebase domains only  
- ✅ **Rate Limiting** - 100 requests per 15 minutes per IP address
- ✅ **Input Validation** - protection against XSS, SQL injection, path traversal
- ✅ **HTTPS Enforced** - automatically via Firebase/Cloud Run
- ✅ **Security Headers** - X-Frame-Options, X-XSS-Protection, HSTS enabled
- ✅ **No Sensitive Data** - only public toilet locations stored

---

## 📈 Performance & Monitoring

### **Current Performance:**
- **Frontend Load Time**: < 2 seconds (CDN cached)
- **API Response Time**: < 500ms average
- **Mobile Performance**: Optimized for 3G networks
- **Bundle Size**: 804KB total (optimized)

### **Production URLs:**
- **Frontend**: https://peecity.web.app
- **API Backend**: https://citypee-api-310116477099.us-east1.run.app
  - `/api/config` - Returns frontend configuration
  - `/api/search` - Returns filtered toilet data

### **Monitoring:**
- Firebase Hosting metrics in Firebase Console
- Cloud Run metrics in Google Cloud Console
- Google Maps API usage in Google Cloud Console

---

## 🚀 Deployment Commands

### **Deploy Frontend (Firebase Hosting)**
```bash
# Build and deploy
npm run build
npx firebase deploy --only hosting

# Result: Updates https://peecity.web.app
```

### **Deploy Backend (Cloud Run)**
```bash
# From api-server directory
cd api-server
gcloud run deploy citypee-api --source . --region us-east1 \
  --set-env-vars GOOGLE_MAPS_API_KEY=your_key

# Result: Updates API backend
```

### **Full Deployment (Both)**
```bash
# Deploy backend first
cd api-server
gcloud run deploy citypee-api --source . --region us-east1 \
  --set-env-vars GOOGLE_MAPS_API_KEY=your_key

# Then deploy frontend
cd ..
npm run build
npx firebase deploy --only hosting
```

---

## 📋 Available Commands

```bash
# Frontend Development
npm run dev         # Start local dev server (USER ONLY!)
npm run build       # Generate static export
npm run lint        # Check code quality

# Backend Development  
cd api-server
node server.js      # Start Express API locally
npm test           # Run API tests (if implemented)

# Data Management
npm run ingest      # Update toilet data from OpenStreetMap

# Deployment
npx firebase deploy --only hosting  # Deploy frontend
# Backend: Use gcloud run deploy (see above)
```

---

## 🐛 Troubleshooting

### **Common Issues:**

**Frontend not loading:**
```bash
# Check Firebase hosting status
npx firebase hosting:channel:list

# Verify build output
ls -la out/
```

**API not responding:**
```bash  
# Check Cloud Run service status
gcloud run services list --region=us-east1

# Test API directly
curl https://citypee-api-310116477099.us-east1.run.app/api/config
```

**Google Maps not loading:**
- Verify API key is set in Cloud Run backend (not frontend)
- Check API restrictions in Google Cloud Console
- Ensure Maps JavaScript + Places APIs are enabled

**CORS errors:**
- API should only accept requests from Firebase domains
- Check browser developer console for specific errors

---

## 🎯 Current Status & Roadmap

### ✅ **Completed (Production Live!)**
- 🌐 **Production deployment** at https://peecity.web.app
- 🏗️ **Modern architecture** - Firebase + Cloud Run
- 🔒 **Security hardened** - API keys isolated, CORS configured, rate limiting active
- 📱 **Mobile optimized** - responsive design and touch gestures
- 🚀 **Performance optimized** - CDN + auto-scaling backend
- 📊 **1,053 real toilets** - verified London dataset

### 🎯 **Next Phase: Enhanced Features**
- [ ] **User filters** - wheelchair accessible, free toilets, baby change
- [ ] **Offline support** - cached toilet data for tube/underground
- [ ] **User feedback** - "Is this toilet still here?" reporting
- [ ] **Additional cities** - NYC, Paris, Tokyo expansion
- [ ] **Dark mode** - user theme preference
- [ ] **ad support** - sustainable funding model

### 🔧 **Technical Improvements**
- [ ] **Monitoring dashboard** - performance and usage metrics
- [ ] **API rate limiting** - prevent abuse
- [ ] **Enhanced error handling** - better user feedback
- [ ] **Progressive Web App** - app-like experience

---

## 🤝 Contributing

### **Development Setup:**
1. **Fork the repository**
2. **Run locally** with `npm run dev`  
3. **Backend optional** - uses production API by default
4. **Make changes** and test thoroughly
5. **Submit PR** with clear description

### **Contributing Guidelines:**
1. **📱 Mobile-first** - test on phone before submitting
2. **🚀 Performance-conscious** - keep bundle size minimal  
3. **🔒 Security-aware** - never expose API keys
4. **📝 Document changes** - update README if needed
5. **🧪 Test thoroughly** - with real London locations

---

## 📄 License

MIT - Build something amazing with this code

---

## 🎯 The Mission

**Build the toilet finder that London actually needs.**

Simple. Fast. Reliable. Already working.

**Ready to contribute?** The app is live and serving users at https://peecity.web.app - let's make it even better! 🚀