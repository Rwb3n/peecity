---
id: licensing
title: "Licensing & Attribution"
description: "Project licensing terms, third-party attributions, and legal compliance information"
version: 1.0.0
last_updated: "2025-07-09"
category: reference
---

# Licensing & Attribution

CityPee uses several open-source datasets and libraries. This central reference consolidates repeated licence notes previously scattered across documents.

## OpenStreetMap (OSM)
* **Licence:** Open Database Licence (ODbL) v1.0
* **Requirements:**
  * Database must remain open – derived `toilets.geojson` file is published in the public repo.
  * Display attribution: "© OpenStreetMap contributors".
  * Provide a copy/link to the licence.
* **Reference:** <https://www.openstreetmap.org/copyright>

## Map Tiles
* **Provider:** OSM Tile CDN (or MapTiler Free as fallback)
* **Licence:** Creative Commons Attribution-ShareAlike 2.0

## Icons & Fonts
* **Lucide Icons:** ISC Licence
* **Figma Inter Font:** SIL Open Font Licence 1.1

## Code Dependencies
All software libraries inherit their respective OSS licences. The dependency tree is available via `npm licence-verify`.

---
_This file should be referenced instead of duplicating licencing boilerplate._ 