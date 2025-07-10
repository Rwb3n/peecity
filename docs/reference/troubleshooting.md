---
title: "Troubleshooting Reference"
description: "Quick reference guide for common issues and solutions in the CityPee project"
category: reference
version: "1.0.0"
last_updated: "2025-07-09"
---

# Troubleshooting Reference

Quick reference for common issues in the CityPee project.

## Test Failures

### Jest Cannot Find Module
```bash
# Clear cache and reinstall
npm test -- --clearCache
rm -rf node_modules
npm install
```

### TypeScript Import Errors
- Check `tsconfig.json` paths configuration
- Verify `jest.config.js` moduleNameMapper
- Use relative imports in test files

### SIGBUS Errors in WSL
- Known WSL2 limitation with memory-mapped files
- Run tests individually or in smaller batches
- Consider using native Windows or Linux environment

## API Issues

### Suggest API Returns 500
See [Debug Suggest Agent Guide](../howto/debug-suggest-agent.md)

Common causes:
1. Missing `logs/` directory
2. Missing `data/toilets.geojson`
3. Service initialization errors
4. TypeScript compilation issues

### Rate Limiting Not Working
- Check IP extraction from headers
- Verify rate limit store initialization
- Ensure time-based cleanup is running

## Dependency Issues

### Peer Dependency Conflicts
```bash
# Check for conflicts
npm ls

# Common fixes
npm install --legacy-peer-deps
# or
npm install --force
```

### Missing Dependencies
Always check `package.json` after pulling changes:
```bash
npm install
```

## Build Issues

### Next.js Build Failures
```bash
# Clean build cache
rm -rf .next
npm run build
```

### TypeScript Errors
```bash
# Type check without building
npx tsc --noEmit
```

## Development Environment

### Storybook Won't Start
```bash
# Check for port conflicts
lsof -i :6006
# or
npx kill-port 6006
```

### Hot Reload Not Working
- Check file watchers limit (Linux/WSL)
- Restart development server
- Clear Next.js cache

## Data Issues

### No Toilet Data Available
```bash
# Re-run ingest agent
npm run ingest

# Check data file
ls -la data/toilets.geojson
```

### Overpass API Timeouts
- Check API status: https://overpass-api.de/api/status
- Use smaller bounding boxes
- Implement retry logic

## Quick Fixes

### Reset Everything
```bash
# Nuclear option - reset all generated files
rm -rf node_modules .next logs data/*.geojson
npm install
mkdir -p logs
npm run ingest
npm run dev
```

### Verify Installation
```bash
# Check all services are working
node -e "
  const services = require('./src/services');
  console.log('Services loaded:', Object.keys(services));
"
```

## Getting Help

1. Check existing issues: `issues/issue_*.txt`
2. Review relevant cookbook: `docs/cookbook/recipe_*.md`
3. Check test files for usage examples
4. Create new issue with reproduction steps

## Common Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| `ENOENT` | File not found | Create missing file/directory |
| `EACCES` | Permission denied | Check file permissions |
| `EADDRINUSE` | Port in use | Kill process or use different port |
| `MODULE_NOT_FOUND` | Import error | Check path and dependencies |
| `ERR_INVALID_ARG_TYPE` | Type mismatch | Check TypeScript types |

## Monitoring Commands

```bash
# Check system health
npm test -- --listTests | wc -l  # Count tests
find . -name "*.log" -mtime -1   # Recent log files
du -sh node_modules              # Dependencies size
```