/**
 * Jest Configuration for Schema Validation Tests
 * 
 * This configuration is specifically for schema validation and performance tests
 * that don't require Next.js integration. It uses a simpler setup to avoid
 * Next.js dependency issues.
 */

module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.performance.js'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
    '^.+\\.jsx?$': 'babel-jest',
  },
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/lib/validation/**/*.{js,jsx,ts,tsx}',
    'src/utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  testMatch: [
    '<rootDir>/tests/performance/**/*_test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/schemas/**/*_test.{js,jsx,ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  cache: false,
  maxWorkers: 1,
  transformIgnorePatterns: [
    'node_modules/(?!(node-cron)/)'
  ],
  // Add explicit timeout for performance tests
  testTimeout: 30000,
  // Disable verbose output in CI mode
  verbose: false,
  // Enable better error reporting
  errorOnDeprecated: true,
};