---
title: "Performance Monitoring Runbook"
description: "Operational runbook for CityPee API performance monitoring, alerting, and troubleshooting validation latency issues"
category: runbook
version: "1.0.0"
last_updated: "2025-07-09"
tags: ["performance", "monitoring", "validation", "api"]
author: "DevOps Team"
---

# Performance Monitoring Runbook

**Alert Name**: Validation Latency High  
**Severity**: High  
**Service**: CityPee Validation API  
**Team**: Platform Engineering  

## Alert Overview

**Description**: This alert fires when the CityPee validation API p95 latency exceeds acceptable thresholds, indicating potential performance degradation that could impact user experience.

**Trigger Conditions**: 
- Local development: p95 latency > 5ms (sustained over 2 minutes)
- CI environment: p95 latency > 10ms (sustained over 2 minutes)
- Production: p95 latency > 15ms (sustained over 1 minute)

**Business Impact**:
- Increased API response times affecting user submissions
- Potential timeout failures for user-facing applications
- Risk of cascading failures in dependent services
- SLA breach risk (API response time < 100ms target)

## Symptoms

**Primary Symptoms**:
- Increased API response times visible in monitoring dashboards
- Users report slow or failing toilet suggestion submissions
- Higher error rates in application logs
- Increased server resource utilization

**Secondary Symptoms**:
- Related alerts may fire: "High Error Rate", "Memory Usage High"
- Increased queue depths in load balancer
- Higher CPU utilization on API servers
- Database query latency increases

## Troubleshooting Steps

### Step 1: Initial Assessment
1. **Check alert details**: Review current p95 latency values from Prometheus metrics
2. **Verify scope**: Check if latency increase affects all validation tiers or specific ones
3. **Check dependencies**: Verify Node.js application health and database connectivity

### Step 2: Quick Fixes
1. **Common causes**:
   - Check for recent deployments or configuration changes
   - Verify no ongoing batch processing or data imports
   - Check system resource availability (CPU, memory, disk)

2. **Immediate actions**:
   - Review recent application logs for error patterns
   - Check Node.js garbage collection metrics
   - Verify database query performance

3. **Escalation criteria**: 
   - Escalate to Platform Engineering if latency > 25ms
   - Escalate to Development Team if error rate > 5%
   - Escalate to Management if user-facing impact confirmed

### Step 3: Deep Investigation
1. **Log analysis**: 
   - Location: Application logs in `/var/log/citypee/`
   - Search patterns: "validation_duration", "tier_validation", "performance"
   - Look for: Exception traces, database query logs, GC pressure indicators

2. **Metric analysis**:
   - Dashboard: [CityPee Validation Monitoring](../../templates/grafana-citypee-validation.json)
   - Key metrics: `tier_validation_duration_seconds`, `tier_validation_requests_total`
   - Examine: Request distribution by tier, error rates, throughput patterns

3. **System checks**:
   - CPU usage: `htop` or system monitoring
   - Memory usage: Check for memory leaks or excessive allocation
   - Database: Query performance, connection pool status

### Step 4: Root Cause Analysis
1. **Data collection**:
   - Gather performance metrics from 1 hour before incident
   - Collect application logs with timestamps
   - Document system resource usage patterns

2. **Timeline reconstruction**:
   - Map deployment events to performance changes
   - Correlate external load changes with latency spikes
   - Identify configuration changes or data volume increases

3. **Impact assessment**:
   - Quantify affected users and request volume
   - Measure duration and severity of performance degradation
   - Calculate business impact and SLA breach metrics

## Resolution

### Immediate Actions
- [ ] **Scale resources**: Increase CPU/memory allocation if resource-constrained
- [ ] **Database optimization**: Restart database connections, clear query cache
- [ ] **Application restart**: Restart Node.js application to clear memory leaks
- [ ] **Load balancing**: Redistribute traffic to healthy instances

### Long-term Solutions
- [ ] **Code optimization**: Review and optimize tier validation algorithms (see [Performance Guide](../howto/perf-benchmarks.md))
- [ ] **Caching implementation**: Add caching layer for frequently validated properties
- [ ] **Database indexing**: Optimize database queries and add missing indexes
- [ ] **Resource scaling**: Implement auto-scaling based on performance metrics

### Verification Steps
1. **Metric verification**: Confirm p95 latency returns to < 5ms (local) or < 10ms (CI)
2. **User verification**: Test validation API endpoints manually
3. **System verification**: Check all related performance metrics are within normal ranges

## Prevention

### Monitoring Improvements
- Add alerts for p90 latency (early warning system)
- Implement canary deployment monitoring
- Add database query performance alerts
- Monitor Node.js garbage collection metrics

### System Improvements
- Implement performance regression testing in CI/CD pipeline
- Add automated performance benchmarking (see [benchmarking guide](../howto/perf-benchmarks.md))
- Implement request rate limiting to prevent overload
- Add performance profiling in development environment

### Documentation Updates
- Update performance thresholds based on production data
- Document performance optimization techniques
- Create troubleshooting playbooks for common scenarios

## References

### Documentation
- [Performance Benchmarking Guide](../howto/perf-benchmarks.md)
- [Architecture Documentation](../explanations/architecture.md)
- [Troubleshooting Guide](../reference/troubleshooting.md)
- [Metrics Export Guide](../cookbook/recipe_metrics_export.md)

### Dashboards
- [CityPee Validation Monitoring](../../templates/grafana-citypee-validation.json)
- [Node.js Application Metrics](#)
- [Database Performance Dashboard](#)

### Performance Targets
- **Local Development**: p95 < 5ms (no-op validation ~0.002ms)
- **CI Environment**: p95 < 10ms (2x slower than local)
- **Production**: p95 < 15ms (SLA requirement)

### Escalation Contacts
- **Primary**: Platform Engineering Team - [Slack: #platform-engineering]
- **Secondary**: Development Team - [Slack: #development]  
- **Manager**: Engineering Manager - [On-call rotation]

### Related Runbooks
- [High Error Rate Runbook](./error-rate-monitoring.md)
- [Database Performance Runbook](./database-monitoring.md)

---

**Last Incident**: 2025-07-07 - Latency spike during data migration  
**Next Review**: 2025-08-09  
**Runbook Owner**: Platform Engineering Team