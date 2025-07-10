/**
 * Jest configuration for @storybook/test-runner
 * This configuration is specifically for running Storybook integration tests
 */

const { getJestConfig } = require('@storybook/test-runner');

module.exports = {
  // Use the default configuration from test-runner
  ...getJestConfig(),
  
  // Specify test file patterns for Storybook tests
  testMatch: [
    '**/tests/storybook/**/*_story_test.[jt]s?(x)',
    '**/tests/storybook/**/*.story.test.[jt]s?(x)'
  ],
  
  // Set test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Module name mapper for TypeScript paths if needed
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};