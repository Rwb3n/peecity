/**
 * Schema Validation Utilities
 * 
 * @artifact docs/cookbook/recipe_schema_validation.md
 * @epic schema_documentation_completion_epic
 * @task schema_documentation_task2
 * @tdd-phase GREEN
 * 
 * Provides JSON Schema validation for core data structures.
 * Integrates with existing validation architecture and ErrorFactory.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import { ErrorFactory } from './errors';

// AJV instance with formats support
const ajv = new Ajv({ 
  allErrors: true,
  verbose: true,
  strict: false // Allow additional properties for flexibility
});
addFormats(ajv);

// Schema cache for performance
const schemaCache = new Map<string, any>();

/**
 * Load and compile a JSON schema
 */
function loadSchema(schemaName: string): any {
  if (schemaCache.has(schemaName)) {
    return schemaCache.get(schemaName);
  }

  try {
    const schemaPath = path.join(process.cwd(), 'schemas', `${schemaName}.schema.json`);
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);
    
    const compiledSchema = ajv.compile(schema);
    schemaCache.set(schemaName, compiledSchema);
    
    return compiledSchema;
  } catch (error) {
    throw ErrorFactory.schemaValidation(
      schemaName,
      [`Failed to load schema: ${error instanceof Error ? error.message : 'Unknown error'}`]
    );
  }
}

/**
 * Generic schema validation result
 */
export interface SchemaValidationResult {
  isValid: boolean;
  errors?: string[];
  data?: any;
}

/**
 * Validate data against a specific schema
 */
export function validateSchema(data: unknown, schemaName: string): SchemaValidationResult {
  const startTime = performance.now();
  
  try {
    const validate = loadSchema(schemaName);
    const isValid = validate(data);
    
    const duration = performance.now() - startTime;
    
    // Performance monitoring (target < 2ms per skeptic recommendation)
    if (duration > 2) {
      console.warn(`Schema validation exceeded 2ms target: ${schemaName} took ${duration.toFixed(2)}ms`);
    }
    
    if (isValid) {
      return {
        isValid: true,
        data
      };
    }
    
    // Format validation errors
    const errors = validate.errors?.map(error => {
      const field = error.instancePath || error.schemaPath || 'root';
      const message = error.message || 'Validation failed';
      return `${field}: ${message}`;
    }) || ['Unknown validation error'];
    
    return {
      isValid: false,
      errors,
      data
    };
    
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Schema validation failed'],
      data
    };
  }
}

/**
 * Validate GeoJSON toilet data
 */
export function validateGeoJsonToilet(data: unknown): SchemaValidationResult {
  return validateSchema(data, 'geoJsonToilet');
}

/**
 * Validate Overpass API query data
 */
export function validateOverpassQuery(data: unknown): SchemaValidationResult {
  return validateSchema(data, 'overpassQuery');
}

/**
 * Validate service response data
 */
export function validateServiceResponse(data: unknown): SchemaValidationResult {
  return validateSchema(data, 'serviceResponse');
}

/**
 * Clear schema cache (useful for testing)
 */
export function clearSchemaCache(): void {
  schemaCache.clear();
}

/**
 * Get schema cache statistics
 */
export function getSchemaCacheStats(): { size: number; schemas: string[] } {
  return {
    size: schemaCache.size,
    schemas: Array.from(schemaCache.keys())
  };
}

/**
 * Validate multiple data items against a schema
 */
export function validateManyWithSchema<T>(
  items: T[], 
  schemaName: string
): { valid: T[]; invalid: { item: T; errors: string[] }[] } {
  const valid: T[] = [];
  const invalid: { item: T; errors: string[] }[] = [];
  
  for (const item of items) {
    const result = validateSchema(item, schemaName);
    
    if (result.isValid) {
      valid.push(item);
    } else {
      invalid.push({
        item,
        errors: result.errors || ['Unknown validation error']
      });
    }
  }
  
  return { valid, invalid };
}

/**
 * Create a validation function for a specific schema
 * Useful for creating reusable validators
 */
export function createSchemaValidator(schemaName: string) {
  return (data: unknown): SchemaValidationResult => {
    return validateSchema(data, schemaName);
  };
}

/**
 * Integration with existing ErrorFactory patterns
 */
export function createSchemaValidationError(
  schemaName: string, 
  errors: string[], 
  data?: any
): any {
  return ErrorFactory.schemaValidation(schemaName, errors, data);
}

/**
 * Performance benchmark for schema validation
 */
export function benchmarkSchemaValidation(
  data: unknown, 
  schemaName: string, 
  iterations: number = 1000
): { averageMs: number; minMs: number; maxMs: number } {
  const times: number[] = [];
  
  // Warm up
  validateSchema(data, schemaName);
  
  // Benchmark iterations
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    validateSchema(data, schemaName);
    const end = performance.now();
    times.push(end - start);
  }
  
  return {
    averageMs: times.reduce((a, b) => a + b, 0) / times.length,
    minMs: Math.min(...times),
    maxMs: Math.max(...times)
  };
}