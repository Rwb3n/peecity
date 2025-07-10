# plans/

Task plans written in JSON (extension `.txt`) strictly follow the **Hybrid_AI_OS** schema.

Each plan enforces:
1. TEST_CREATION
2. IMPLEMENTATION
3. REFACTORING

Update task status as you progress. 

## Plan hierarchy

1. **Master Epic Plans** (`plan_<id>.txt`) – contain tasks of type `EPIC` referencing child plans via `plan_ref`.
2. **Child Epic Plans** (`plan_<epic>.txt`) – standard TDD triads scoped to a single capability.
3. **Archived Plans** – plans with `"archived": true` are kept for historical reference.

### Current active plans
| File | Purpose | Status |
|------|---------|--------|
| `plan_0003.txt` | Master V1 Epic Plan – orchestrates all major initiatives | ACTIVE |
| `plan_metrics_export_0013.txt` | Phase 2 Observability – Prometheus metrics, summary API, CI guardrails | ACTIVE |
| `plan_frontend_ui_detailed.txt` | Front-end UI detailed implementation | IN PROGRESS |
| `plan_frontend_molecules.txt` | Frontend molecules component development | IN PROGRESS |
| `plan_frontend_organisms.txt` | Frontend organisms component development | IN PROGRESS |
| `plan_frontend_pages.txt` | Frontend pages implementation | IN PROGRESS |
| `plan_deploy_pipeline.txt` | Deploy pipeline triad | PENDING |
| `plan_monitor_agent.txt` | Monitor agent triad | PENDING |

### Adding a new epic
1. Create a new child plan `plan_<new_epic>.txt` with TDD triad.
2. Add an `EPIC` task referencing it in the master plan.

### Completed plans (archived)
Plans that have been successfully completed and moved to `archive/`:
- `plan_ingest_agent.txt` - ✅ COMPLETE (98.63% test coverage)
- `plan_suggest_agent.txt` - ✅ COMPLETE (99%+ test coverage) 
- `plan_seo_agent.txt` - ✅ COMPLETE (template-based generation)
- `plan_validation_service_tier_0012.txt` - ✅ COMPLETE (tier-based validation)
- Various diagnostic and fix plans

---
Archived plans (historical):
* `plan_0002.txt` – superseded by master/child structure. 