---
id: engineering-explanation
title: "Engineering Notes"
description: "Engineering practices and development workflow explanations for CityPee project"
version: 1.0.0
last_updated: "2025-07-09"
category: explanation
---

# Engineering Notes (Explanation)

This document fuses the **Engineering Spec** and **Engineering Mode Notes** into a concise yet comprehensive technical reference for developers.

## Stack

* **Frontend** – Next.js 14 App Router, React 18, TailwindCSS
* **Backend** – Next.js API routes (Node.js 20)
* **Data** – Flat `toilets.geojson`; upgrade path to PostGIS
* **Testing** – Jest, React Testing Library, Storybook + Chromatic

## Infrastructure

* CI/CD via Vercel
* Optional Docker (node:20-alpine) for local dev
* Secrets via `.env` loaded with `dotenv`

## Performance Targets

* Mobile load < 1.5s, gzip + CDN
* GeoJSON under 500 KB

## Next Steps

See `plans/` for TDD-driven tasks and `docs/cookbook/` for reusable patterns. 