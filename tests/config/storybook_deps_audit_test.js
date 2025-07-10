/**
 * @file tests/config/storybook_deps_audit_test.js
 * @description Comprehensive audit test for Storybook package version compatibility
 * 
 * Context:
 * - This test is part of plan_fix_storybook_deps_0037
 * - It ensures ALL @storybook/* packages are at compatible v8.x versions
 * - Special attention to @storybook/test which may be causing export errors
 * - This test will initially FAIL to identify version mismatches
 */

const fs = require('fs');
const path = require('path');

describe('Storybook Dependencies Version Audit', () => {
  test('all @storybook/* packages should be at compatible v8.x versions', () => {
    // Read package.json
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Combine all dependencies
    const allDependencies = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };
    
    // Find ALL @storybook/* packages and storybook itself
    const storybookPackages = Object.entries(allDependencies)
      .filter(([name]) => name.startsWith('@storybook/') || name === 'storybook');
    
    console.log('\nStorybook Package Audit Results:');
    console.log('================================');
    
    // Track issues
    const versionIssues = [];
    const compatibleVersionPattern = /^[\^~]?8\.(6|7|8|9|10)\./; // Allow 8.6.x through 8.10.x
    
    // Special packages that may have different versioning
    const specialPackages = {
      '@storybook/addon-postcss': /^2\.0\./,  // Known to use 2.x
      '@storybook/test-runner': /^0\.(19|20)\./  // Uses 0.x versioning
    };
    
    storybookPackages.forEach(([name, version]) => {
      let isCompatible = false;
      let expectedVersion = '^8.6.x';
      
      // Check if it's a special package
      if (specialPackages[name]) {
        isCompatible = specialPackages[name].test(version);
        expectedVersion = specialPackages[name].toString();
      } else {
        // Regular @storybook/* packages should be v8.x
        isCompatible = compatibleVersionPattern.test(version);
      }
      
      const status = isCompatible ? '✓' : '✗';
      console.log(`  ${status} ${name}: ${version}`);
      
      if (!isCompatible) {
        versionIssues.push({
          package: name,
          current: version,
          expected: expectedVersion
        });
      }
    });
    
    // Special check for @storybook/test (likely culprit)
    const storybookTest = allDependencies['@storybook/test'];
    if (storybookTest) {
      console.log('\nSpecial attention to @storybook/test:');
      console.log(`  Current version: ${storybookTest}`);
      
      // @storybook/test should be v8.x in Storybook v8
      if (!storybookTest.match(/^[\^~]?8\./)) {
        console.log('  ⚠️  @storybook/test appears to be at wrong version!');
        console.log('  This is likely causing the "./test is not exported" error');
      }
    }
    
    // Check for any v9.x packages
    const v9Packages = storybookPackages.filter(([name, version]) => 
      version.match(/^[\^~]?9\./)
    );
    
    if (v9Packages.length > 0) {
      console.log('\n⚠️  Found v9.x packages (should be v8.x):');
      v9Packages.forEach(([name, version]) => {
        console.log(`  - ${name}: ${version}`);
      });
    }
    
    // Summary
    console.log('\nSummary:');
    console.log(`  Total Storybook packages: ${storybookPackages.length}`);
    console.log(`  Compatible packages: ${storybookPackages.length - versionIssues.length}`);
    console.log(`  Incompatible packages: ${versionIssues.length}`);
    
    // Assert no version issues
    if (versionIssues.length > 0) {
      console.log('\nVersion issues found:');
      versionIssues.forEach(issue => {
        console.log(`  ${issue.package}: ${issue.current} (expected ${issue.expected})`);
      });
    }
    
    expect(versionIssues).toHaveLength(0);
    
    // Also verify we have essential v8 packages
    expect(storybookPackages.length).toBeGreaterThan(0);
    expect(allDependencies['storybook']).toMatch(/^[\^~]?8\./);
  });
  
  test('@storybook/test should not be at v9.x', () => {
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const allDependencies = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };
    
    const storybookTest = allDependencies['@storybook/test'];
    
    if (storybookTest) {
      // Should NOT be v9.x
      expect(storybookTest).not.toMatch(/^[\^~]?9\./);
      // Should be v8.x
      expect(storybookTest).toMatch(/^[\^~]?8\./);
    }
  });
});