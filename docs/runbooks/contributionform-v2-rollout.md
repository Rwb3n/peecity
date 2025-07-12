---
title: "ContributionForm v2 API Migration Rollout"
description: "Operational runbook for safely migrating ContributionForm from v1 to v2 API with phased rollout, monitoring, and rollback procedures"
category: runbook
version: "1.0.0"
last_updated: "2025-07-12"
tags: ["migration", "api", "v2", "contributionform", "rollout"]
author: "Platform Engineering"
related_plans: ["../../plans/plan_contributionform_v2_migration_0066.txt"]
---

# ContributionForm v2 API Migration Rollout

**Service**: CityPee ContributionForm  
**Migration**: v1 → v2 API  
**Risk Level**: Medium  
**Team**: Platform Engineering  

## Executive Summary

This runbook guides the safe rollout of the ContributionForm v2 API migration, which introduces:
- Strict validation with 8 core required properties
- New property naming conventions (OSM standard)
- Type conversions (boolean → string, number → boolean)
- Backward compatibility via feature flags

**Business Impact**:
- Improved data quality through stricter validation
- Better OpenStreetMap compatibility
- Foundation for future feature enhancements
- Zero downtime migration with rollback capability

## Prerequisites

All safety gates must be verified before proceeding:

| Gate | Component | Status | Verification |
|------|-----------|--------|--------------|
| Gate 1 | Payload Transformer Service | ✅ COMPLETE | 100% test coverage, 35 tests pass |
| Gate 2 | Feature Flag Implementation | ✅ COMPLETE | apiVersion prop working, env var support |
| Gate 3 | v2 Integration Tests | ✅ COMPLETE | 14 v2 tests pass, v1 tests unaffected |
| Gate 4 | Dual Endpoint Support | ✅ COMPLETE | Both endpoints operational |
| Gate 5 | Migration Monitoring | ✅ COMPLETE | API version tracking in logs |

## Rollout Phases

### Phase 1: Development Environment (Immediate)

**Timeline**: Day 1  
**Traffic**: Internal team only  

**Steps**:
1. Deploy latest code with v2 support to development
2. Set environment variable: `NEXT_PUBLIC_SUGGEST_API_VERSION=v2`
3. Test form submissions manually
4. Verify monitoring shows v2 requests

**Validation**:
```bash
# Check logs for v2 usage
grep "apiVersion.*v2" /logs/suggestions.log | tail -20

# Monitor console output
# Should see: [ContributionForm] Submitting suggestion { apiVersion: 'v2', ... }
```

### Phase 2: Staging Validation (Week 1)

**Timeline**: Days 2-7  
**Traffic**: QA team + automated tests  

**Steps**:
1. Deploy to staging environment
2. Keep v1 as default (no env var)
3. Run automated test suite
4. Enable v2 for specific test accounts:
   ```typescript
   <ContributionForm apiVersion="v2" ... />
   ```
5. Compare v1 vs v2 success rates

**Success Criteria**:
- v2 error rate < 5%
- No increase in 500 errors
- All automated tests pass

### Phase 3: Canary Deployment - 10% (Week 2)

**Timeline**: Days 8-14  
**Traffic**: 10% of production users  

**Steps**:
1. Deploy to production (v1 default)
2. Enable v2 for 10% using feature flag service:
   ```javascript
   // In ContributionForm wrapper
   const apiVersion = featureFlags.isEnabled('contribution-form-v2', userId) ? 'v2' : 'v1';
   ```
3. Monitor metrics closely

**Monitoring Queries**:
```sql
-- API version distribution
SELECT 
  apiVersion,
  COUNT(*) as submissions,
  COUNT(CASE WHEN action = 'submitted' THEN 1 END) as successful,
  COUNT(CASE WHEN action = 'validation_failed' THEN 1 END) as failed
FROM suggestion_logs
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY apiVersion;

-- Error rate by version
SELECT 
  apiVersion,
  ROUND(
    COUNT(CASE WHEN action != 'submitted' THEN 1 END)::decimal / 
    COUNT(*)::decimal * 100, 2
  ) as error_rate
FROM suggestion_logs  
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY apiVersion;
```

### Phase 4: Production Rollout - 50% (Week 3)

**Timeline**: Days 15-21  
**Traffic**: 50% of production users  

**Steps**:
1. Increase feature flag to 50%
2. Continue monitoring
3. Check for user complaints
4. Analyze validation error patterns

**Alert Thresholds**:
- v2 error rate > 10% → investigate
- v2 error rate > 15% → consider rollback
- 500 errors > 2% → immediate rollback

### Phase 5: Full Production - 100% (Week 4)

**Timeline**: Days 22-28  
**Traffic**: All users  

**Steps**:
1. Set default to v2: `NEXT_PUBLIC_SUGGEST_API_VERSION=v2`
2. Keep v1 endpoint active for compatibility
3. Monitor for 48 hours
4. If stable, remove feature flag code

## Monitoring & Alerts

### Key Metrics Dashboard

```javascript
// Prometheus queries for Grafana dashboard

// Request rate by API version
rate(tier_validation_requests_total[5m])

// Error rate by API version  
rate(tier_validation_errors_total[5m]) / rate(tier_validation_requests_total[5m])

// P95 latency by version
histogram_quantile(0.95, rate(tier_validation_duration_seconds_bucket[5m]))
```

### Log Monitoring

```bash
# Real-time v2 errors
tail -f /logs/suggestions.log | grep '"apiVersion":"v2"' | grep -E 'validation_failed|error'

# Validation error analysis
jq -r 'select(.apiVersion=="v2" and .action=="validation_failed") | 
  .result.errors[] | "\(.field): \(.message)"' /logs/suggestions.log | 
  sort | uniq -c | sort -nr

# Success rate comparison
echo "v1 Success Rate:"
jq -r 'select(.apiVersion=="v1") | .action' /logs/suggestions.log | 
  awk '{if($0=="submitted") s++; t++} END {printf "%.2f%%\n", s/t*100}'

echo "v2 Success Rate:"  
jq -r 'select(.apiVersion=="v2") | .action' /logs/suggestions.log |
  awk '{if($0=="submitted") s++; t++} END {printf "%.2f%%\n", s/t*100}'
```

## Rollback Procedures

### Immediate Rollback (< 5 minutes)

For urgent issues requiring immediate action:

1. **Set environment variable**:
   ```bash
   # Production deployment platform
   heroku config:set NEXT_PUBLIC_SUGGEST_API_VERSION=v1 -a citypee-prod
   # or
   kubectl set env deployment/citypee-web NEXT_PUBLIC_SUGGEST_API_VERSION=v1
   ```

2. **Verify rollback**:
   ```bash
   # Check new submissions use v1
   tail -f /logs/suggestions.log | grep '"apiVersion"'
   ```

### Feature Flag Rollback (< 30 minutes)

For gradual rollback without deployment:

1. **Disable feature flag**:
   ```javascript
   // In feature flag service
   featureFlags.disable('contribution-form-v2');
   ```

2. **Monitor transition**:
   ```sql
   -- Watch API version shift
   SELECT 
     DATE_TRUNC('minute', timestamp) as minute,
     apiVersion,
     COUNT(*) as requests
   FROM suggestion_logs
   WHERE timestamp > NOW() - INTERVAL '30 minutes'
   GROUP BY 1, 2
   ORDER BY 1 DESC;
   ```

### Code Rollback (< 1 hour)

For issues requiring code changes:

1. **Revert deployment**:
   ```bash
   # Get previous deployment
   git log --oneline -n 5
   
   # Revert to pre-v2 commit
   git revert <commit-hash>
   git push origin main
   ```

2. **Trigger deployment**:
   - Automated deployment will pick up changes
   - Monitor deployment pipeline

## Success Criteria

### Phase Success Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| v2 Error Rate | < 5% | _TBD_ | ⏳ |
| v2 Response Time P95 | < 200ms | _TBD_ | ⏳ |
| User Complaints | < 10/day | _TBD_ | ⏳ |
| Successful Rollback Test | Yes | _TBD_ | ⏳ |

### Final Success Criteria

- [ ] 7 days at 100% v2 with error rate < 5%
- [ ] No increase in support tickets
- [ ] Performance metrics within SLA
- [ ] v1 endpoint deprecated (notifications sent)

## Troubleshooting Guide

### Common Issues

#### 1. "Missing required field" errors

**Symptom**: High validation failure rate for v2  
**Cause**: v2 requires 8 core properties that v1 didn't  

**Solution**:
```javascript
// Check which fields are missing
jq -r 'select(.apiVersion=="v2" and .action=="validation_failed") | 
  .result.errors[] | select(.code=="required") | .field' /logs/suggestions.log |
  sort | uniq -c | sort -nr
```

**Fix**: Update form defaults or transformer logic

#### 2. Type conversion errors

**Symptom**: "Invalid type" validation errors  
**Cause**: v2 expects different types (e.g., wheelchair: string not boolean)  

**Investigation**:
```javascript
// Find type errors
jq -r 'select(.apiVersion=="v2" and .action=="validation_failed") | 
  .result.errors[] | select(.code=="invalid_type")' /logs/suggestions.log
```

**Fix**: Verify SuggestPayloadTransformer mappings

#### 3. Performance degradation

**Symptom**: Increased response times for v2  
**Cause**: Additional validation overhead  

**Monitoring**:
```bash
# Compare p95 latencies
curl http://localhost:3000/api/validation/summary?window=1h | 
  jq '.performance.percentiles'
```

**Fix**: Review TieredValidationService performance

### Escalation Path

1. **Level 1**: On-call engineer follows this runbook
2. **Level 2**: Platform team lead (check #platform-oncall)
3. **Level 3**: Engineering manager + product owner for go/no-go decisions

## Post-Migration Cleanup

After successful migration (Week 5+):

1. **Remove v1 code paths** (keep for 30 days minimum):
   ```typescript
   // Remove from ContributionForm
   - const endpoint = apiVersion === 'v2' ? `${baseUrl}/api/v2/suggest` : `${baseUrl}/api/suggest`;
   + const endpoint = `${baseUrl}/api/v2/suggest`;
   ```

2. **Update documentation**:
   - API docs to show v2 as default
   - Remove v1 examples
   - Archive this runbook

3. **Clean up monitoring**:
   - Remove v1-specific alerts
   - Simplify dashboards

## Appendix

### Useful Commands

```bash
# Full migration status report
cat << 'EOF' > /tmp/migration_report.sh
#!/bin/bash
echo "=== ContributionForm v2 Migration Status ==="
echo "Generated: $(date)"
echo ""
echo "API Version Distribution (Last 24h):"
jq -r 'select(.timestamp > (now - 86400 | strftime("%Y-%m-%dT%H:%M:%S"))) | 
  .apiVersion' /logs/suggestions.log | sort | uniq -c
echo ""
echo "Error Rates by Version:"
# ... (additional reporting logic)
EOF
chmod +x /tmp/migration_report.sh
/tmp/migration_report.sh
```

### References

- [Safety Gates Documentation](../addendum_v2_migration_safety_gates.md)
- [API v2 Specification](../reference/api/suggest-api.md)
- [Monitoring Cookbook](../cookbook/recipe_metrics_export.md)
- [Original Migration Plan](../../plans/plan_contributionform_v2_migration_0066.txt)

---
*Last reviewed: 2025-07-12 by Platform Engineering*