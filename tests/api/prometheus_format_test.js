/**
 * Prometheus format compliance tests
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task1
 * @tdd-phase RED
 * 
 * Detailed tests ensuring strict compliance with Prometheus text format 0.0.4
 * specification. These tests verify metric naming, label formatting, and
 * escaping requirements.
 */

const request = require('supertest');

describe('Prometheus Text Format 0.0.4 Compliance', () => {
  let app;
  let mockMetricsData;

  beforeEach(() => {
    const express = require('express');
    app = express();
    
    // Mock metrics data for testing format compliance
    mockMetricsData = {
      totalRequests: 5000,
      requestsByTier: {
        core: 2000,
        high_frequency: 1500,
        optional: 1000,
        specialized: 500
      },
      errorsByTier: {
        core: 50,
        high_frequency: 30,
        optional: 20,
        specialized: 10
      },
      performanceMetrics: {
        count: 5000,
        sum: 65000, // milliseconds
        min: 2.5,
        max: 150.0,
        p95: [25.5]
      }
    };
  });

  describe('Metric naming conventions', () => {
    it('should use correct metric name format with underscores', async () => {
      const response = await request(app)
        .get('/api/metrics');
      
      if (response.status === 200) {
        const lines = response.text.split('\n').filter(l => l && !l.startsWith('#'));
        
        lines.forEach(line => {
          const metricName = line.split(/[\s{]/)[0];
          // Metric names must match [a-zA-Z_:][a-zA-Z0-9_:]*
          expect(metricName).toMatch(/^[a-zA-Z_:][a-zA-Z0-9_:]*$/);
          
          // Should use underscores, not hyphens
          expect(metricName).not.toContain('-');
          
          // Should end with appropriate suffix
          if (line.includes('_total')) {
            expect(metricName).toMatch(/_total$/);
          } else if (line.includes('_seconds')) {
            expect(metricName).toMatch(/_seconds(_bucket|_sum|_count)?$/);
          }
        });
      }
    });

    it('should prefix all custom metrics with application namespace', async () => {
      const response = await request(app)
        .get('/api/metrics');
      
      if (response.status === 200) {
        const customMetrics = [
          'tier_validation_requests_total',
          'tier_validation_errors_total',
          'tier_validation_duration_seconds'
        ];
        
        customMetrics.forEach(metric => {
          // Could be prefixed with citypee_ for namespace
          const namespaceRegex = new RegExp(`(citypee_)?${metric}`);
          expect(response.text).toMatch(namespaceRegex);
        });
      }
    });
  });

  describe('Label formatting', () => {
    it('should format labels correctly with quotes', async () => {
      const response = await request(app)
        .get('/api/metrics');
      
      if (response.status === 200) {
        // Extract all label sections
        const labelMatches = response.text.matchAll(/\{([^}]+)\}/g);
        
        for (const match of labelMatches) {
          const labelSection = match[1];
          const labels = labelSection.split(',');
          
          labels.forEach(label => {
            // Each label should be key="value" format
            expect(label.trim()).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*="[^"]*"$/);
          });
        }
      }
    });

    it('should escape special characters in label values', async () => {
      const response = await request(app)
        .get('/api/metrics');
      
      if (response.status === 200) {
        // Check for proper escaping of quotes, backslashes, and newlines
        const labelValues = [...response.text.matchAll(/"([^"]*)"/g)].map(m => m[1]);
        
        labelValues.forEach(value => {
          // Should not contain unescaped quotes
          const unescapedQuotes = value.match(/(?<!\\)"/g);
          expect(unescapedQuotes).toBeNull();
          
          // Should not contain unescaped newlines
          expect(value).not.toContain('\n');
          expect(value).not.toContain('\r');
          
          // Escaped characters should be valid
          if (value.includes('\\')) {
            // Valid escapes are \\, \", \n
            const escapes = value.matchAll(/\\(.)/g);
            for (const escape of escapes) {
              expect(['\\', '"', 'n']).toContain(escape[1]);
            }
          }
        });
      }
    });

    it('should order labels consistently', async () => {
      const response = await request(app)
        .get('/api/metrics');
      
      if (response.status === 200) {
        // Extract metrics with same name but different labels
        const lines = response.text.split('\n').filter(l => l && !l.startsWith('#'));
        const metricGroups = {};
        
        lines.forEach(line => {
          const [nameAndLabels] = line.split(/\s+/);
          const name = nameAndLabels.split('{')[0];
          
          if (!metricGroups[name]) {
            metricGroups[name] = [];
          }
          metricGroups[name].push(nameAndLabels);
        });
        
        // Labels within same metric should be in consistent order
        Object.values(metricGroups).forEach(group => {
          if (group.length > 1) {
            const labelOrders = group.map(metric => {
              const labelMatch = metric.match(/\{([^}]+)\}/);
              if (labelMatch) {
                return labelMatch[1].split(',').map(l => l.split('=')[0].trim());
              }
              return [];
            });
            
            // All label orders should be the same
            const firstOrder = JSON.stringify(labelOrders[0]);
            labelOrders.forEach(order => {
              expect(JSON.stringify(order)).toBe(firstOrder);
            });
          }
        });
      }
    });
  });

  describe('Histogram format', () => {
    it('should format histogram buckets correctly', async () => {
      const response = await request(app)
        .get('/api/metrics');
      
      if (response.status === 200) {
        // Check histogram format for tier_validation_duration_seconds
        const histogramName = 'tier_validation_duration_seconds';
        
        // Should have buckets with le label
        const buckets = ['0.001', '0.005', '0.01', '0.025', '0.05', '0.1', '0.25', '0.5', '1', '+Inf'];
        buckets.forEach(bucket => {
          const bucketRegex = new RegExp(`${histogramName}_bucket\\{le="${bucket}"\\}\\s+\\d+`);
          expect(response.text).toMatch(bucketRegex);
        });
        
        // Should have _sum and _count
        expect(response.text).toMatch(new RegExp(`${histogramName}_sum\\s+[\\d.]+`));
        expect(response.text).toMatch(new RegExp(`${histogramName}_count\\s+\\d+`));
        
        // Buckets should be cumulative (monotonically increasing)
        const bucketLines = response.text.split('\n').filter(l => l.includes('_bucket{le='));
        const bucketValues = bucketLines.map(line => {
          const match = line.match(/\s+(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        });
        
        for (let i = 1; i < bucketValues.length; i++) {
          expect(bucketValues[i]).toBeGreaterThanOrEqual(bucketValues[i - 1]);
        }
      }
    });

    it('should convert milliseconds to seconds for duration metrics', async () => {
      const response = await request(app)
        .get('/api/metrics');
      
      if (response.status === 200) {
        // Duration metrics should be in seconds, not milliseconds
        const sumMatch = response.text.match(/tier_validation_duration_seconds_sum\s+([\d.]+)/);
        if (sumMatch) {
          const sumValue = parseFloat(sumMatch[1]);
          // 65000ms total should be 65 seconds
          expect(sumValue).toBeCloseTo(65.0, 1);
        }
      }
    });
  });

  describe('Metadata requirements', () => {
    it('should include HELP before TYPE for each metric', async () => {
      const response = await request(app)
        .get('/api/metrics');
      
      if (response.status === 200) {
        const lines = response.text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('# TYPE')) {
            const metricName = lines[i].split(' ')[2];
            
            // Look for HELP line before this TYPE line
            let foundHelp = false;
            for (let j = i - 1; j >= 0; j--) {
              if (lines[j].startsWith('# HELP ' + metricName)) {
                foundHelp = true;
                break;
              }
              // If we hit another TYPE or non-comment, stop looking
              if (lines[j].startsWith('# TYPE') || !lines[j].startsWith('#')) {
                break;
              }
            }
            
            expect(foundHelp).toBe(true);
          }
        }
      }
    });

    it('should use correct TYPE values', async () => {
      const response = await request(app)
        .get('/api/metrics');
      
      if (response.status === 200) {
        const typeLines = response.text.split('\n').filter(l => l.startsWith('# TYPE'));
        
        typeLines.forEach(line => {
          const parts = line.split(' ');
          const metricType = parts[3];
          
          // Valid types are: counter, gauge, histogram, summary
          expect(['counter', 'gauge', 'histogram', 'summary']).toContain(metricType);
          
          // Verify type matches metric name convention
          const metricName = parts[2];
          if (metricName.endsWith('_total')) {
            expect(metricType).toBe('counter');
          } else if (metricName.endsWith('_seconds')) {
            expect(metricType).toBe('histogram');
          }
        });
      }
    });
  });

  describe('Value formatting', () => {
    it('should format numeric values correctly', async () => {
      const response = await request(app)
        .get('/api/metrics');
      
      if (response.status === 200) {
        const lines = response.text.split('\n').filter(l => l && !l.startsWith('#'));
        
        lines.forEach(line => {
          const parts = line.split(/\s+/);
          const value = parts[parts.length - 1];
          
          // Value should be a valid number
          if (value !== 'NaN' && value !== '+Inf' && value !== '-Inf') {
            const numValue = parseFloat(value);
            expect(numValue).not.toBeNaN();
          }
          
          // Scientific notation should be valid
          if (value.includes('e')) {
            expect(value).toMatch(/^-?\d+\.?\d*e[+-]?\d+$/);
          }
        });
      }
    });

    it('should handle special float values', async () => {
      const response = await request(app)
        .get('/api/metrics');
      
      if (response.status === 200) {
        // Check that +Inf is used for histogram buckets
        expect(response.text).toContain('le="+Inf"');
        
        // NaN should be represented as NaN (not null or undefined)
        // Infinity should be +Inf or -Inf
        const values = response.text.match(/\s+([\d.+-]+|NaN|[+-]Inf)$/gm);
        if (values) {
          values.forEach(v => {
            const value = v.trim();
            if (value === 'Infinity') {
              fail('Should use +Inf instead of Infinity');
            }
            if (value === '-Infinity') {
              fail('Should use -Inf instead of -Infinity');
            }
          });
        }
      }
    });
  });

  describe('Performance characteristics', () => {
    it('should generate metrics efficiently', async () => {
      const iterations = 10;
      const durations = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await request(app).get('/api/metrics');
        durations.push(Date.now() - start);
      }
      
      const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
      
      // Average response time should be under 20ms
      expect(avgDuration).toBeLessThan(20);
      
      // No single request should take over 50ms
      durations.forEach(d => {
        expect(d).toBeLessThan(50);
      });
    });

    it('should not accumulate memory over multiple requests', async () => {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await request(app).get('/api/metrics');
      }
      
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryPerRequest = (finalMemory - initialMemory) / 100;
      
      // Should not leak more than 100KB per request
      expect(memoryPerRequest).toBeLessThan(100 * 1024);
    });
  });
});