---
title: "Addendum: Safety Gates for ContributionForm v2 Migration"
description: "Additional safety requirements and gate criteria for plan_contributionform_v2_migration_0066 based on lessons learned from payload fix implementation"
category: planning
version: "1.0.0"
created: "2025-07-12"
related_plans: ["../plans/plan_contributionform_v2_migration_0066.txt", "../plans/plan_fix_contributionform_payload_0065.txt"]
---

# Safety Gates for ContributionForm v2 Migration

This document supplements `plan_contributionform_v2_migration_0066.txt` with additional safety requirements based on successful patterns from the payload fix implementation.

## Enhanced Safety Requirements

### Pre-Conditions (Before Any v2 Work Begins)
1. **All 31 ContributionForm tests must be passing** (established baseline)
2. **Document current v1 API contract** with example payloads
3. **Create feature branch** `feature/contributionform-v2-migration`
4. **Verify mapFeaturesToApi helper** is working correctly (from plan 0065)
5. **Review v2 API documentation** for latest requirements

### Gate Criteria

#### Gate 1: After Payload Transformer Service Creation
- Transformer service has 100% test coverage
- All v1 transformations produce identical output to current implementation
- All v2 transformations pass schema validation
- No changes to ContributionForm component yet

#### Gate 2: After Feature Flag Implementation
- Component behavior unchanged when flag is 'v1' (default)
- All 31 existing tests still pass
- Feature flag can be toggled via prop and environment variable
- Clear precedence: prop > env var > default

#### Gate 3: After v2 Integration Tests
- Separate v2 test file created (no modifications to v1 tests)
- All v2 field mappings verified
- Both success and error scenarios tested
- Performance benchmarks show no degradation

#### Gate 4: After Dual Endpoint Support
- Both v1 and v2 endpoints working independently
- Transformer service properly integrated
- All 31 v1 tests + all v2 tests passing
- Manual testing in development environment successful

#### Gate 5: Before Production Rollout
- Monitoring/logging implemented and verified
- Rollback procedure tested in staging
- Load testing shows v2 performance acceptable
- Documentation and runbook completed

## Insights from Payload Fix Implementation

### 1. Helper Function Extensibility
The `mapFeaturesToApi` helper created in plan 0065 is already designed for extensibility:

```typescript
// Current v1-only implementation
const mapFeaturesToApi = (features?: Features): Record<string, boolean> => {
  // ... v1 mappings
};

// Can be extended for v2 support
const mapFeaturesToApi = (
  features?: Features, 
  apiVersion: 'v1' | 'v2' = 'v1'
): Record<string, any> => {
  if (apiVersion === 'v2') {
    return mapFeaturesToV2Api(features);
  }
  // ... existing v1 logic
};
```

### 2. Test Coverage Provides Safety Net
With 31 comprehensive tests including edge cases, we have strong confidence that any v2 changes won't break v1 functionality.

### 3. Incremental Approach Works
The successful TDD approach (Red-Green-Refactor) from the payload fix should be applied to each v2 migration task.

## Recommended Enhancements to Plan 0066

### 1. Add Explicit Safety Gates
Each task in the plan should specify which gate it satisfies and what the gate criteria are.

### 2. Create v1 Baseline Documentation
Before starting v2 work, create `docs/reference/contributionform-v1-baseline.md` with:
- Current payload structure
- Field mappings
- Example requests/responses
- Current test coverage summary

### 3. Implement Canary Testing
Add a task for canary testing in production:
- Start with internal team members only
- Monitor error rates and success metrics
- Gradually increase percentage of v2 traffic

### 4. Add Rollback Drills
Practice rollback procedures in staging:
- Simulate various failure scenarios
- Time how long rollback takes
- Document any issues found

## Risk Mitigation Updates

### Additional Risks Identified
1. **Timeout differences** - v2 API might have different timeout requirements
2. **Rate limiting** - v2 might have different rate limits
3. **Field validation differences** - v2 might reject values v1 accepts

### Mitigation Strategies
1. Add timeout configuration to transformer service
2. Implement retry logic with exponential backoff
3. Create comprehensive field validation matrix

## Success Criteria Additions

### Measurable Goals
- **Zero production errors** attributable to v2 migration
- **Response time within 10%** of v1 baseline
- **100% feature parity** - all v1 features work in v2
- **Rollback time < 5 minutes** if issues detected

## Conclusion

The v2 migration plan is comprehensive but benefits from explicit safety gates and the lessons learned from the payload fix. By following the proven TDD approach and implementing proper gates, the migration risk is minimized while maintaining the ability to evolve the codebase.