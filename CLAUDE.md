# last updated on: 2025-08-27 13:23:55
# CLAUDE.md

**Essential guidance for Claude Code working with CityPee - London's toilet finder**

---

## ⚠️ CRITICAL RULES & GOTCHAS

### Server Management
**ONLY THE USER (Ruben) IS ALLOWED TO START SERVERS.**
- Claude NEVER runs `npm run dev`, `npm start` - these create zombie processes
- Claude can run `npm run build` (short-lived processes only)
- User controls servers: starts with `npm run dev`, stops with `Ctrl+C`

### File Safety
- ALWAYS list files in a directory before starting work
- ALWAYS read files before editing them
- Check dependencies before deleting anything
- Test functionality after changes

### Active Hooks System
**Quick Reference:** This project has 2 production hooks running:
- **SessionStart** → Adds context with date/time when Claude starts
- **PostToolUse** → Auto-timestamps edited files with proper comment syntax
- **Details:** See `.claude/HOOKS.md` for complete documentation if needed

---

## What CityPee Actually Is

**One line:** Google Maps for toilets with Citymapper-style walking radius circles.

**Current status:** Production-ready app with 1,053 real London toilets.

**Core features working:**
- Interactive Google Maps with real toilet markers
- GPS location detection + Google Places autocomplete search  
- Walking radius circles (5/10/15 min visualization)
- Clickable toilet info windows with details
- Mobile-responsive touch gestures

---

## Essential File Structure

```
CityPee/
├── src/app/page.tsx              ← Main Google Maps implementation
├── src/app/api/search/route.ts   ← Toilet data API (1,053 toilets)
├── src/components/
│   ├── LocationSearch.tsx        ← GPS + autocomplete + landmarks
│   ├── ToiletCard.tsx            ← Toilet details component  
│   └── ui/                       ← Basic UI components (button, card, input)
├── data/toilets.geojson          ← 1,053 real London toilets
├── Dockerfile                    ← Cloud Run deployment
├── scripts/deploy-to-cloud-run.sh ← Deployment script
└── docs/
    ├── checkpoints/              ← Important project history
    ├── GOOGLE-MAPS-SETUP.md      ← API key setup guide
    └── README.md                 ← Documentation index
```

---

## Context Runway (Essential Reading Order)

When starting work:
1. **README.md** (2 min) - Current status, quick start commands
2. **DEVELOPER-GUIDE.md** (5 min) - What works, what to work on next  
3. **docs/checkpoints/** - Recent implementation history
4. **docs/GOOGLE-MAPS-SETUP.md** - If working with Maps API

---

## Technology Stack (Keep It Simple)

**Core:**
- Next.js 15 + React 18 + TypeScript
- Google Maps (@vis.gl/react-google-maps v1.5.5)
- Tailwind CSS for styling
- Real toilet data from data/toilets.geojson

**APIs Required:**
- Google Maps JavaScript API (for map display)
- Google Places API (for autocomplete search)

**Deployment:**
- Docker + Google Cloud Run
- Environment: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

---

## Development Commands

```bash
npm run dev          # Start development (USER ONLY!)
npm run build        # Test production build
npm run ingest       # Re-fetch toilet data from OpenStreetMap
./scripts/deploy-to-cloud-run.sh  # Deploy to Cloud Run
```

---

## Key Implementation Details

### Walking Radius Logic
```javascript
const WALK_SPEED = 83 // meters per minute (standard urban pace)
// 5 min: 415m radius, 10 min: 830m, 15 min: 1245m
```

### Data Flow
1. User searches/uses GPS → `LocationSearch.tsx`
2. Fetches toilets → `/api/search` → `data/toilets.geojson`
3. Displays on Google Maps → `page.tsx` with custom markers
4. Shows walking circles around user location

---

## Project Philosophy

**Ship beats perfect** - Working code > perfect code
- Delete unused code, don't comment it out
- Keep complexity minimal - this finds toilets, not launching rockets
- Real user needs: parents, disabled folks, delivery drivers

**Never add:**
- Redux, GraphQL, microservices (overkill)
- Complex validation systems (we deleted 3 of them)  
- Abstract interfaces and over-engineering

---

## Gotchas & Common Issues

- **Build timeouts**: Normal, works fine with `npm run dev`
- **Missing API key**: Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env.local`
- **Map not loading**: Check Google Maps APIs are enabled in Cloud Console
- **Port conflicts**: User must stop dev servers with `Ctrl+C`

---

**Mission:** Build the toilet finder that London actually needs. Not perfect, just useful. 🚻