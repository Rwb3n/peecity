---
id: changelog
title: "Changelog"
description: "Project changelog tracking major releases, features, and fixes"
version: 0.1.0
last_updated: "2025-07-09"
category: reference
---

# Changelog

## 2025-07-09
* 🎉 **EPIC COMPLETE: Documentation Standardisation** (`plan_docs_standardisation_0015`)
  * ✅ **All 13 Tasks Completed**: Unified front-matter schema implementation across 46 documentation files
  * ✅ **Schema Implementation**: 4 required fields (title, description, category, last_updated) + 8 optional fields
  * ✅ **Automated Testing**: Comprehensive Jest test suite with 59 tests across 7 suites
  * ✅ **Linting Infrastructure**: CI-optimized documentation linting with caching (`scripts/lint-docs.js`)
  * ✅ **Content Migration**: Phased migration across all documentation categories
  * ✅ **Runbooks System**: Dedicated operational documentation with templated structure
  * ✅ **New Content**: Prometheus exporter recipe, k6 load testing guide, ADR-005 native histograms
  * ✅ **Scaffolding CLI**: Automated documentation generation tool (`scripts/scaffold-doc.js`)
  * ✅ **Diátaxis Compliance**: Proper directory structure with feedback files archived
  * 📊 **Validation**: 100% test coverage, 46/46 files linting clean, all success criteria met

## 2025-07-08
* 🚀 **Started Documentation Standardization Epic** (`plan_docs_standardisation_0015`)
  * Initial schema definition and planning phase
  * Foundation work for comprehensive documentation system

* ✅ **Completed Metrics Export Epic** (`plan_metrics_export_0013`)
  * Implemented Prometheus-compatible `/api/metrics` endpoint for tier validation monitoring
  * Added JSON validation summary API at `/api/validation/summary` for operational insights
  * Created CI/CD performance guardrails via `scripts/validate-performance.js`
  * Developed production-ready Grafana dashboard template for visualization
  * Achieved < 1ms performance overhead (avg 0.104ms, p95 0.066ms)
  * Comprehensive test coverage with 90%+ for all new components
  * Full documentation in `docs/cookbook/recipe_metrics_export.md`

## 2025-07-06
* Consolidated documentation into Diátaxis structure (see plan `docs_refactor_0006`).

## 2025-07-05
* Initial front-end atom components scaffolding.

## 2025-07-04
* Completed Overpass import prototype.
* Added rate-limit service with unit tests.

## 2025-07-03
* Initial Next.js project scaffolding.
* Configured TailwindCSS and custom design tokens.

## 2025-07-02
* Repository created, added aiconfig.json and initial Diátaxis docs scaffold.

## 2025-07-01
* Initial commit – project vision outlined in README.

_Read historical developer logs in `docs/archive/`