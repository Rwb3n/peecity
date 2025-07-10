---
id: roadmap
title: "Product Roadmap"
description: "Project roadmap outlining planned features, milestones, and development priorities"
version: 1.0.0
last_updated: "2025-07-09"
category: reference
---

# Product Roadmap

This roadmap is intentionally **short, opinionated, and time-boxed**. It reflects the minimum feature set that keeps CityPee valuable while avoiding scope creep. Dates use ISO calendar quarters; all items are incremental and assume the previous milestone is complete and validated.

| Phase | Target Quarter | Theme | Key Deliverables | Success Metric |
|-------|---------------|-------|------------------|----------------|
| **0 – MVP** | 2025 Q3 ✅ | Launch | • London dataset import<br/>• Map UI + Suggest flow<br/>• Vercel deploy | 500 unique visitors first week |
| **1 – Data Quality** | 2025 Q4 | Trust & Accuracy | • Weekly Overpass refresh via monitor-agent<br/>• Duplicate detection & rate-limit middleware<br/>• Manual moderation dashboard (CLI is fine) | < 5% duplicate suggestions |
| **2 – Accessibility & SEO** | 2026 Q1 | Reach | • WCAG AA audit fixes<br/>• Lighthouse ≥ 90 mobile<br/>• Borough static pages generation | Organic traffic +20% |
| **3 – Monetisation** | 2026 Q2 | Revenue | • Featured listings Stripe checkout<br/>• Admin billing panel<br/>• "Filter by featured" toggle in UI | First £500 MRR |
| **4 – Geographic Expansion** | 2026 Q3 | Scale | • Multi-city dataset support (bbox param)<br/>• City selector dropdown<br/>• CDN edge cache for `/toilets.geojson` | 3 UK cities live |
| **5 – Community Contributions** | 2026 Q4 | Engagement | • Suggestion edit history<br/>• Email verification for power users<br/>• Automated weekly digest email | 50 active contributors/month |

### Notes & Assumptions

1. Roadmap assumes a single-person team with occasional open-source help; timelines will shift if scope changes.  
2. Non-functional tasks (tests, docs, CI) are implicit in every phase and handled via TDD cycle tasks.  
3. KPI thresholds are intentionally modest; they act as **go/no-go gates** before investing in the next phase.  
4. Anything not on this list belongs in the issue backlog and must be justified against the guiding principles: **KISS, DRY, SOLID**. 

### Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Overpass API downtime | Medium | Mirror data weekly to S3 and serve from CDN |
| Suggestion spam | High | Already planning rate-limit + hCaptcha in Phase 1 |
| Map library breaking changes | Low | Pin React-Leaflet version, e2e smoke test in CI | 