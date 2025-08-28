# last updated on: 2025-08-28 13:05:58
# CLAUDE.md
**Essential guidance for Claude Code agents working with CityPee**

---

## 🎯 CONTEXT RUNWAY

### **Current System Status**
```
┌─────────────────────┐    ┌─────────────────────┐
│ FIREBASE HOSTING    │    │     CLOUD RUN       │
│ peecity.web.app     │◄──►│ citypee-api-...     │
│ Static Next.js      │    │ Express API         │
│ 1,053 toilets       │    │ Rate limited        │
└─────────────────────┘    └─────────────────────┘
```

**Status:** ✅ Production live, enterprise security, 95% excellent performance
**Architecture:** Firebase Hosting + Cloud Run microservices
**Data:** 1,053 London toilets, perfect integrity verified

### **Critical System State**
- **Production URL:** https://peecity.web.app (LIVE)
- **API Backend:** Express server with rate limiting (100 req/15min)
- **Security:** Enterprise-grade (API keys isolated, CORS configured)
- **Performance:** API 160ms avg, Frontend 3.21s (DNS optimization opportunity)

### **Agent Boundaries**
1. **NEVER break production** - Real users depend on this
2. **NEVER start servers** - User controls `npm run dev` only  
3. **Test on production** - Changes affect live infrastructure
4. **Document everything** - Include diagrams and mental models

---

## ⚠️ CRITICAL RULES

### **File Safety Protocol**
- ALWAYS read files before editing them
- NEVER delete files without explicit permission
- NEVER assume file contents or structure
- Check dependencies before making changes

### **Security Protocol**  
- API keys ONLY in backend environment (never frontend)
- Maintain CORS restrictions (Firebase domains only)
- Preserve rate limiting configuration
- No API keys in repository ever

### **Development Protocol**
- User runs servers (`npm run dev`, `Ctrl+C` to stop)
- Agent runs builds (`npm run build` only)
- Test functionality after all changes
- Validate production impact

---

## 🏗️ Essential Architecture

### **What CityPee Is**
Google Maps toilet finder with walking radius circles for London's 1,053 public toilets.

### **File Structure**
```
CityPee/
├── src/app/page.tsx              ← Main Google Maps app
├── src/components/               ← LocationSearch, ToiletCard, UI
├── api-server/server.js          ← Express API with rate limiting
├── api-server/data/toilets.geojson ← 1,053 toilet dataset
├── out/                          ← Static build (Firebase)
├── firebase.json                 ← Hosting config
└── docs/                         ← Strategic plans and checkpoints
```

### **Technology Stack**
- **Frontend:** Next.js 15 + React 18 + TypeScript, static export
- **Backend:** Express.js with rate limiting, CORS, security headers
- **Maps:** Google Maps JavaScript API + Places API
- **Deployment:** Firebase Hosting + Cloud Run containers
- **Data:** Static GeoJSON (1,053 verified London toilets)

### **API Endpoints**
- `GET /health` - System health check
- `GET /api/config` - Returns Google Maps API key securely
- `GET /api/search` - Returns filtered toilet data with geographic search

---

## 🔧 Development Commands

```bash
# Frontend (USER ONLY)
npm run dev          # Start development server
npm run build        # Build static export

# Backend Testing
cd api-server && node server.js  # Local API testing

# Deployment  
firebase deploy --only hosting   # Deploy frontend
gcloud run deploy citypee-api    # Deploy backend
```

---

## 📊 Current Performance Baselines

- **API Config:** 139ms average (72% better than target)
- **API Search:** 160ms average (84% better than target)  
- **Frontend Load:** 3.21s (DNS resolution issue - optimization opportunity)
- **Data Integrity:** 100% (1,053/1,053 toilets verified)
- **Error Handling:** Grade A+ (all scenarios tested)
- **Security:** Enterprise-grade (rate limiting + CORS + validation)

---

## 🎯 Project Status

**Phase 1 Complete:** All strategic plans executed (security, cleanup, deployment review)
**Production Status:** 95% excellent, serving real users
**Next Phase:** User experience optimization (DNS fix, mobile UX, accessibility)

**Mission:** Build the toilet finder London actually needs. Production-ready, not perfect.

---

**Active Hooks:** SessionStart (timestamps), PostToolUse (auto-timestamps files)
**Documentation:** See docs/checkpoints/ for implementation history