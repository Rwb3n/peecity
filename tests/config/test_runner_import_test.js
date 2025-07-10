/**
 * @file tests/config/test_runner_import_test.js
 * @description Test to verify @storybook/test-runner can be imported successfully
 * 
 * Context:
 * - This test is part of plan_downgrade_storybook_0036
 * - It confirms the test-runner package is correctly installed and accessible
 * - This validates the primary goal of unblocking UI integration testing
 */

describe('Storybook Test Runner Import', () => {
  test('@storybook/test-runner should be importable', () => {
    let testRunner;
    
    // Attempt to require the test-runner
    expect(() => {
      testRunner = require('@storybook/test-runner');
    }).not.toThrow();
    
    // Verify the import is not null/undefined
    expect(testRunner).not.toBeNull();
    expect(testRunner).not.toBeUndefined();
    
    // The test-runner is typically used as a CLI tool,
    // but we can verify the package exports are available
    expect(typeof testRunner).toBe('object');
  });
  
  test('@storybook/test-runner package.json should be accessible', () => {
    let packageJson;
    
    // Verify we can access the package.json
    expect(() => {
      packageJson = require('@storybook/test-runner/package.json');
    }).not.toThrow();
    
    // Verify package metadata
    expect(packageJson).toBeDefined();
    expect(packageJson.name).toBe('@storybook/test-runner');
    expect(packageJson.version).toBeDefined();
    
    // Log version for debugging
    console.log(`@storybook/test-runner version: ${packageJson.version}`);
  });
});