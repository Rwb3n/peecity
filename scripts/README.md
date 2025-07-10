# scripts/

Utility scripts orchestrating agent workflows.

| Script | Description |
|--------|-------------|
| `ingest.sh` | Runs Overpass QL query via `ingest-agent` |
| `generate-seo.sh` | Generates static pages using `seo-agent` |
| `deploy.sh` | Builds Next.js app & deploys via Vercel |
| `monitor-agent.ts` | Weekly monitoring CLI with Discord notifications |
| `generate_status_skeletons.js` | Generates skeleton status markdowns from plans |

## Running
```bash
./scripts/ingest.sh         # Fetch OSM data
./scripts/generate-seo.sh   # Regenerate static pages
./scripts/deploy.sh         # Build & deploy
tsx scripts/monitor-agent.ts # Run weekly monitoring manually
```

Run:
```bash
node scripts/generate_status_skeletons.js plan_ingest_agent.txt
# or by plan id
node scripts/generate_status_skeletons.js ingest_agent
```

For contributing, ensure each script has a matching test under `tests/scripts/`. 