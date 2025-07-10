/**
 * @file tests/config/storybook_version_test.js
 * @description Test to verify that all @storybook/* packages are using version 8.x
 * 
 * Context:
 * - This test is part of plan_downgrade_storybook_0036
 * - It ensures the project uses Storybook v8 to enable test-runner compatibility
 * - This test will initially FAIL, proving the downgrade is required
 */

const fs = require('fs');
const path = require('path');

describe('Storybook Version Requirements', () => {
  test('all @storybook/* packages should be version 8.x', () => {
    // Read package.json
    const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Combine devDependencies and dependencies
    const allDependencies = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };
    
    // Find all @storybook/* packages (excluding special ones)
    const specialPackages = ['@storybook/addon-postcss', '@storybook/test-runner'];
    const storybookPackages = Object.entries(allDependencies)
      .filter(([name]) => (name.startsWith('@storybook/') || name === 'storybook') && !specialPackages.includes(name));
    
    // Check each package version
    const invalidVersions = [];
    storybookPackages.forEach(([name, version]) => {
      // Version should start with ^8. or ~8. or 8.
      if (!version.match(/^[\^~]?8\./)) {
        invalidVersions.push(`${name}: ${version}`);
      }
    });
    
    // Verify test-runner is present
    expect(allDependencies['@storybook/test-runner']).toBeDefined();
    
    // Assert no invalid versions found
    expect(invalidVersions).toEqual([]);
    
    // Also verify we have at least some Storybook packages
    expect(storybookPackages.length).toBeGreaterThan(0);
  });
});