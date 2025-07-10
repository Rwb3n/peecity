/**
 * withSuggestFs - Higher-Order Jest Helper
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Provides automatic filesystem setup and teardown for suggest-agent tests.
 * Eliminates duplicate beforeEach/afterEach blocks across test suites.
 */

const { setupSuggestionTestFilesystem, teardownSuggestionTestFilesystem } = require('./fs-test-utils');

/**
 * Higher-order function that wraps a test suite with automatic FS setup/teardown
 * @param {string} description Test suite description
 * @param {Function} testSuite Function containing the test suite
 * @param {Object} options Optional configuration
 * @param {boolean} options.setupBeforeAll Setup once before all tests (default: false)
 * @param {boolean} options.cleanupAfterEach Cleanup after each test (default: true)
 */
function withSuggestFs(description, testSuite, options = {}) {
  const {
    setupBeforeAll = false,
    cleanupAfterEach = true
  } = options;

  describe(description, () => {
    if (setupBeforeAll) {
      // Setup once before all tests, cleanup once after all tests
      beforeAll(() => {
        setupSuggestionTestFilesystem();
      });

      afterAll(() => {
        teardownSuggestionTestFilesystem();
      });
    } else {
      // Setup/cleanup before/after each test (default behavior)
      beforeEach(() => {
        setupSuggestionTestFilesystem();
      });

      if (cleanupAfterEach) {
        afterEach(() => {
          teardownSuggestionTestFilesystem();
        });
      }
    }

    // Execute the test suite within the describe block
    testSuite();
  });
}

/**
 * Alternative API - returns setup/teardown functions for manual control
 * @param {Object} options Configuration options
 * @returns {Object} Setup and teardown functions
 */
function createSuggestFsHooks(options = {}) {
  const {
    autoSetup = true,
    autoTeardown = true
  } = options;

  const setup = () => {
    setupSuggestionTestFilesystem();
  };

  const teardown = () => {
    teardownSuggestionTestFilesystem();
  };

  if (autoSetup) {
    beforeEach(setup);
  }

  if (autoTeardown) {
    afterEach(teardown);
  }

  return { setup, teardown };
}

/**
 * Utility for tests that need custom filesystem state
 * @param {Function} customSetup Custom setup function
 * @param {Function} customTeardown Optional custom teardown function
 */
function withCustomSuggestFs(customSetup, customTeardown) {
  beforeEach(() => {
    setupSuggestionTestFilesystem();
    if (customSetup) {
      customSetup();
    }
  });

  afterEach(() => {
    if (customTeardown) {
      customTeardown();
    }
    teardownSuggestionTestFilesystem();
  });
}

/**
 * Export for use with Jest globals or explicit imports
 */
module.exports = {
  withSuggestFs,
  createSuggestFsHooks,
  withCustomSuggestFs
};