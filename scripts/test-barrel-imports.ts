#!/usr/bin/env ts-node

/**
 * Test Barrel Import Functionality
 * 
 * @phase phase1_task1.1
 * 
 * Verifies that missing critical types are now available via @/lib barrel exports.
 */

// Test import of newly added critical types
import type { 
  SuggestionValidation, 
  SuggestionValidationError,
  ValidationWarning, 
  ProcessedSuggestion 
} from '../src/lib';

// Test compilation - if this compiles, the barrel imports work
const testTypes = (): void => {
  console.log('Testing barrel imports...');
  
  // Type usage tests (compile-time verification)
  const suggestionValidation: SuggestionValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    isDuplicate: false
  };

  const validationWarning: ValidationWarning = {
    field: 'test',
    message: 'Test warning',
    code: 'unusual_value'
  };

  const suggestionValidationError: SuggestionValidationError = {
    field: 'test',
    message: 'Test error',
    code: 'required'
  };

  const processedSuggestion: ProcessedSuggestion = {
    lat: 51.5074,
    lng: -0.1278,
    id: 'test-id',
    submitted_at: new Date().toISOString(),
    status: 'pending'
  };

  console.log('✅ All barrel imports working correctly:', {
    suggestionValidation: typeof suggestionValidation,
    validationWarning: typeof validationWarning,
    suggestionValidationError: typeof suggestionValidationError,
    processedSuggestion: typeof processedSuggestion
  });
};

if (require.main === module) {
  testTypes();
}