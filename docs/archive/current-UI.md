  ASCII Diagrams - Current vs Desired

  CURRENT BROKEN DRAWER STATES:
  ┌─────────────────────────────────────┐
  |                                     | ← PROBLEM: Centered content
  │                                     │   gets hidden by drawer
  │            PARTIAL MAP              │
  ├─────────────────────────────────────┤ ← CLOSED STATE
  │ 📍 Find Near Me (NOT EVEN VISIBLE)  │
  │ 🔍 Search Bar                       │
  │ [victoria][kings cross][ etc... ][ etc... ] popular areas  ← REDUNDANT
  │                                     │ 
  │                                     │
  │                                     |
  └─────────────────────────────────────┘

  OPEN STATE (barely different in size but with extra content!):
  ┌─────────────────────────────────────┐
  │            PARTIAL MAP              │
  ├─────────────────────────────────────┤ ← OPEN STATE
  │ 🔍 Search Bar                       │
  │ 📍 Find Near Me (redundant again!)  │
  │ [♿][🚻][💰][🕒] Filter Buttons     │
  │ 📍 Find Near Me (THIRD TIME!)       │ ← REDUNDANT
  │ 🗺️ Popular locations                │
  │ ══════ weird shadow ══════          │ ← VISUAL ISSUE
  └─────────────────────────────────────┘

  DESIRED PROPER DRAWER STATES:
  CLOSED STATE (Maximum Map):
  ┌─────────────────────────────────────┐
  │ 🚻Status              ⚙️Settings   │
  │                                     │
  │            FULL MAP                 │
  │        (centers here ↑)             │ ← SOLUTION: Center higher
  │         OR auto-close               │   OR close drawer
  │                                     │
  │                                     │
  └─────────────────────────────────────┘
  │ 📍icon + 🔍 Search bar Only                      │ ← MINIMAL UI
  │ ═══ handle ═══                      │
  └─────────────────────────────────────┘

  OPEN STATE (Major Visual Difference):
  ┌─────────────────────────────────────┐
  │         PARTIAL MAP (higher up)     │ ← SOLUTION: Account for drawer
  ├─────────────────────────────────────┤
  │ 📍 My Location Button               │ ← Keep this, above search bar
  │ 🔍 Search Bar                       │ ← Keep this
  ├─────────────────────────────────────┤
  │ [♿][🚻][💰][🕒] Filter Buttons   │ ← Add filters
  │ 🗺️ Popular locations                │ ← Remove redundant actions
  │ Clean styling - no weird shadows    │ ← Fix visual issues
  └─────────────────────────────────────┘