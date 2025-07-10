/**
 * Tests for CI performance validation script
 * 
 * @artifact docs/cookbook/recipe_metrics_export.md
 * @task metrics_export_0013_task7
 * @tdd-phase RED
 * 
 * These tests verify that the CI performance validation script correctly:
 * - Loads thresholds from aiconfig.json
 * - Runs validation benchmarks
 * - Compares against ADR-004 SLAs
 * - Generates detailed reports
 * - Exits with appropriate codes
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('CI Performance Validation Script', () => {
  const scriptPath = path.join(__dirname, '../../scripts/validate-performance.js');
  const aiConfigPath = path.join(__dirname, '../../aiconfig.json');

  // Helper function to run script with proper error handling
  const runScript = (args = '', env = {}) => {
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script not found: ${scriptPath}`);
    }
    return execSync(`node ${scriptPath} ${args}`, { 
      encoding: 'utf8',
      env: { ...process.env, ...env }
    });
  };

  beforeAll(() => {
    // Verify aiconfig.json exists and has performance targets
    expect(fs.existsSync(aiConfigPath)).toBe(true);
    const config = JSON.parse(fs.readFileSync(aiConfigPath, 'utf8'));
    expect(config.validated_patterns.performance_targets).toBeDefined();
  });

  describe('Script existence', () => {
    it('should have validate-performance.js script', () => {
      expect(fs.existsSync(scriptPath)).toBe(true);
    });
  });

  // All other tests should skip if script doesn't exist
  const describeIfScriptExists = fs.existsSync(scriptPath) ? describe : describe.skip;

  describeIfScriptExists('Basic functionality', () => {
    it('should be executable', () => {
      const stats = fs.statSync(scriptPath);
      if (process.platform === 'win32') {
        // Windows filesystems do not rely on POSIX execute bits; ensure file exists and has .js extension
        expect(path.extname(scriptPath)).toBe('.js');
      } else {
        expect(stats.mode & 0o100).toBeTruthy();
      }
    });

    it('should run without errors when performance is within SLA', () => {
      const result = runScript('', { PERF_ENV: 'local' });
      expect(result).toContain('Performance validation passed');
    });

    it('should show help information', () => {
      const result = runScript('--help');
      expect(result).toContain('Usage: validate-performance.js [options]');
      expect(result).toContain('--iterations');
      expect(result).toContain('--format');
      expect(result).toContain('--threshold-minimal');
    });
  });

  describeIfScriptExists('Threshold configuration', () => {
    it('should load thresholds from aiconfig.json', () => {
      const result = runScript('--dry-run');
      
      expect(result).toContain('Loading performance thresholds from aiconfig.json');
      expect(result).toContain('Environment: local');
      expect(result).toContain('Minimal validation threshold: 15ms');
      expect(result).toContain('Full validation threshold: 20ms');
    });

    it('should detect CI environment and use CI thresholds', () => {
      const result = runScript('--dry-run', { CI: 'true', PERF_ENV: 'ci' });
      
      expect(result).toContain('Environment: ci');
      expect(result).toContain('Minimal validation threshold: 20ms');
      expect(result).toContain('Full validation threshold: 30ms');
    });
  });

  describeIfScriptExists('Performance benchmarks', () => {
    it('should run minimal payload validation benchmark', () => {
      const result = runScript('--verbose');
      
      expect(result).toContain('Running minimal payload benchmark');
      expect(result).toContain('Properties validated: 9');
      expect(result).toMatch(/P95 latency: \d+\.\d+ms/);
    });

    it('should run full payload validation benchmark', () => {
      const result = runScript('--verbose');
      
      expect(result).toContain('Running full payload benchmark');
      expect(result).toContain('Properties validated: 120');
      expect(result).toMatch(/P95 latency: \d+\.\d+ms/);
    });

    it('should run multiple iterations for statistical accuracy', () => {
      const result = runScript('--iterations 100 --verbose');
      
      expect(result).toContain('Running 100 iterations');
      expect(result).toMatch(/Sample size: 100/);
      expect(result).toMatch(/P50: \d+\.\d+ms/);
      expect(result).toMatch(/P95 latency: \d+\.\d+ms/);  // Match actual output format
      expect(result).toMatch(/P99: \d+\.\d+ms/);
    });
  });

  describeIfScriptExists('SLA violation detection', () => {
    it('should exit with code 1 when minimal validation exceeds threshold', () => {
      expect(() => {
        runScript('--force-fail minimal', { PERF_ENV: 'local' });
      }).toThrow();
      
      try {
        runScript('--force-fail minimal', { PERF_ENV: 'local' });
      } catch (error) {
        expect(error.status).toBe(1);
        expect(error.stdout).toContain('FAIL: Minimal validation exceeds threshold');
        expect(error.stdout).toMatch(/Threshold: 15ms, Actual: \d+\.\d+ms/);
      }
    });

    it('should exit with code 1 when full validation exceeds threshold', () => {
      expect(() => {
        runScript('--force-fail full', { PERF_ENV: 'local' });
      }).toThrow();
      
      try {
        runScript('--force-fail full', { PERF_ENV: 'local' });
      } catch (error) {
        expect(error.status).toBe(1);
        expect(error.stdout).toContain('FAIL: Full validation exceeds threshold');
        expect(error.stdout).toMatch(/Threshold: 20ms, Actual: \d+\.\d+ms/);
      }
    });

    it('should generate detailed performance report on failure', () => {
      try {
        runScript('--force-fail all');
      } catch (error) {
        const output = error.stdout;
        
        // Check for detailed report sections
        expect(output).toContain('=== PERFORMANCE VALIDATION FAILED ===');
        expect(output).toContain('Environment Configuration:');
        expect(output).toContain('Benchmark Results:');
        expect(output).toContain('SLA Violations:');
        expect(output).toContain('Recommendations:');
      }
    });
  });

  describeIfScriptExists('Report formats', () => {
    it('should support JSON output format', () => {
      const result = runScript('--format json');
      
      const report = JSON.parse(result);
      expect(report).toHaveProperty('environment');
      expect(report).toHaveProperty('thresholds');
      expect(report).toHaveProperty('results');
      expect(report).toHaveProperty('passed');
      expect(report.passed).toBe(true);
    });

    it('should support markdown report generation', () => {
      const result = runScript('--format markdown');
      
      expect(result).toContain('# Performance Validation Report');
      expect(result).toContain('## Configuration');
      expect(result).toContain('## Results');
      expect(result).toContain('| Metric | Threshold | Actual | Status |');
    });

    it('should save report to file when requested', () => {
      const reportPath = path.join(__dirname, '../../perf-report.json');
      
      runScript(`--output ${reportPath}`);
      
      expect(fs.existsSync(reportPath)).toBe(true);
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('results');
      
      // Cleanup
      fs.unlinkSync(reportPath);
    });
  });

  describeIfScriptExists('CI integration', () => {
    it('should support GitHub Actions output format', () => {
      const result = runScript('--ci github', { GITHUB_ACTIONS: 'true' });
      
      expect(result).toContain('::group::Performance Validation');
      expect(result).toMatch(/::notice.*Performance validation passed/);
    });

    it('should support quiet mode for CI logs', () => {
      const result = runScript('--quiet');
      
      // Should only output essential information
      expect(result.split('\n').length).toBeLessThan(5);
      expect(result).toContain('PASS');
    });
  });

  describeIfScriptExists('Advanced options', () => {
    it('should support custom threshold overrides', () => {
      const result = runScript('--threshold-minimal 10 --threshold-full 15 --verbose');
      
      expect(result).toContain('Custom threshold override');
      expect(result).toContain('Minimal validation threshold: 10ms');
      expect(result).toContain('Full validation threshold: 15ms');
    });

    it('should handle warmup iterations correctly', () => {
      const result = runScript('--warmup 50 --iterations 100 --verbose');
      
      expect(result).toContain('Running 50 warmup iterations');
      expect(result).toContain('Warmup complete');
    });

    it('should support benchmarking specific validation tiers', () => {
      const result = runScript('--tier core --verbose');
      
      expect(result).toContain('Benchmarking tier: core');
      expect(result).not.toContain('Running full payload benchmark');
    });
  });
});