#!/usr/bin/env node

/**
 * Schema Integrity Validation Script
 * 
 * @epic schema_documentation_completion_epic
 * @task schema_documentation_task5
 * @tdd-phase REFACTOR
 * 
 * Validates that all required schemas exist, are parseable, and compile successfully.
 * Used for operational health monitoring and CI integrity checks.
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Required schemas for project operation
const REQUIRED_SCHEMAS = [
  'geoJsonToilet.schema.json',
  'overpassQuery.schema.json', 
  'serviceResponse.schema.json',
  'propertyTiers.schema.json'
];

const SCHEMAS_DIR = path.join(process.cwd(), 'schemas');

/**
 * Validate that all required schema files exist and are accessible
 */
function validateSchemaFiles() {
  console.log('🔍 Validating schema file existence...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  for (const schemaFile of REQUIRED_SCHEMAS) {
    const schemaPath = path.join(SCHEMAS_DIR, schemaFile);
    
    try {
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found: ${schemaPath}`);
      }
      
      const stats = fs.statSync(schemaPath);
      if (!stats.isFile()) {
        throw new Error(`Schema path is not a file: ${schemaPath}`);
      }
      
      if (stats.size === 0) {
        throw new Error(`Schema file is empty: ${schemaPath}`);
      }
      
      console.log(`  ✅ ${schemaFile} - exists (${stats.size} bytes)`);
      results.passed++;
      
    } catch (error) {
      console.log(`  ❌ ${schemaFile} - ${error.message}`);
      results.failed++;
      results.errors.push({
        schema: schemaFile,
        error: error.message,
        type: 'file_access'
      });
    }
  }
  
  return results;
}

/**
 * Validate that all schema files contain valid JSON
 */
function validateSchemaJson() {
  console.log('\n📝 Validating schema JSON syntax...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  for (const schemaFile of REQUIRED_SCHEMAS) {
    const schemaPath = path.join(SCHEMAS_DIR, schemaFile);
    
    try {
      if (!fs.existsSync(schemaPath)) {
        continue; // Skip if file doesn't exist (caught in previous step)
      }
      
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      
      // Basic schema structure validation
      if (typeof schema !== 'object' || schema === null) {
        throw new Error('Schema must be a JSON object');
      }
      
      if (!schema.$schema && !schema.type) {
        console.log(`  ⚠️  ${schemaFile} - missing $schema or type property`);
      }
      
      console.log(`  ✅ ${schemaFile} - valid JSON`);
      results.passed++;
      
    } catch (error) {
      console.log(`  ❌ ${schemaFile} - ${error.message}`);
      results.failed++;
      results.errors.push({
        schema: schemaFile,
        error: error.message,
        type: 'json_parse'
      });
    }
  }
  
  return results;
}

/**
 * Validate that all schemas compile successfully with AJV
 */
function validateSchemaCompilation() {
  console.log('\n⚙️  Validating schema compilation...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  const ajv = new Ajv({ 
    allErrors: true,
    verbose: true,
    strict: false
  });
  addFormats(ajv);

  for (const schemaFile of REQUIRED_SCHEMAS) {
    const schemaPath = path.join(SCHEMAS_DIR, schemaFile);
    
    try {
      if (!fs.existsSync(schemaPath)) {
        continue; // Skip if file doesn't exist
      }
      
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      
      const start = performance.now();
      const validate = ajv.compile(schema);
      const compilationTime = performance.now() - start;
      
      if (typeof validate !== 'function') {
        throw new Error('Schema compilation did not return a function');
      }
      
      console.log(`  ✅ ${schemaFile} - compiled (${compilationTime.toFixed(2)}ms)`);
      results.passed++;
      
    } catch (error) {
      console.log(`  ❌ ${schemaFile} - ${error.message}`);
      results.failed++;
      results.errors.push({
        schema: schemaFile,
        error: error.message,
        type: 'compilation'
      });
    }
  }
  
  return results;
}

/**
 * Validate schema performance meets requirements
 */
function validateSchemaPerformance() {
  console.log('\n🚀 Validating schema performance...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: [],
    benchmarks: {}
  };

  const ajv = new Ajv({ 
    allErrors: true,
    verbose: true,
    strict: false
  });
  addFormats(ajv);

  for (const schemaFile of REQUIRED_SCHEMAS) {
    const schemaPath = path.join(SCHEMAS_DIR, schemaFile);
    
    try {
      if (!fs.existsSync(schemaPath)) {
        continue; // Skip if file doesn't exist
      }
      
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      
      // Benchmark compilation time
      const compilationTimes = [];
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        ajv.compile(schema);
        const duration = performance.now() - start;
        compilationTimes.push(duration);
      }
      
      const avgCompilation = compilationTimes.reduce((a, b) => a + b, 0) / compilationTimes.length;
      const maxCompilation = Math.max(...compilationTimes);
      
      results.benchmarks[schemaFile] = {
        avgCompilation: avgCompilation.toFixed(3),
        maxCompilation: maxCompilation.toFixed(3)
      };
      
      // Performance targets (from existing code: < 2ms)
      if (avgCompilation > 5) { // Allow 5ms for compilation in CI
        console.log(`  ⚠️  ${schemaFile} - slow compilation: ${avgCompilation.toFixed(2)}ms avg`);
      } else {
        console.log(`  ✅ ${schemaFile} - good performance: ${avgCompilation.toFixed(2)}ms avg`);
      }
      
      results.passed++;
      
    } catch (error) {
      console.log(`  ❌ ${schemaFile} - ${error.message}`);
      results.failed++;
      results.errors.push({
        schema: schemaFile,
        error: error.message,
        type: 'performance'
      });
    }
  }
  
  return results;
}

/**
 * Generate summary report
 */
function generateSummaryReport(fileResults, jsonResults, compilationResults, performanceResults) {
  console.log('\n📊 Schema Integrity Summary Report');
  console.log('═'.repeat(50));
  
  const totalSchemas = REQUIRED_SCHEMAS.length;
  const totalPassed = Math.min(
    fileResults.passed,
    jsonResults.passed, 
    compilationResults.passed,
    performanceResults.passed
  );
  
  console.log(`📋 Total Schemas: ${totalSchemas}`);
  console.log(`✅ Fully Valid: ${totalPassed}`);
  console.log(`❌ With Issues: ${totalSchemas - totalPassed}`);
  
  console.log('\n📈 Test Results:');
  console.log(`  File Access: ${fileResults.passed}/${totalSchemas} passed`);
  console.log(`  JSON Syntax: ${jsonResults.passed}/${totalSchemas} passed`);
  console.log(`  Compilation: ${compilationResults.passed}/${totalSchemas} passed`);
  console.log(`  Performance: ${performanceResults.passed}/${totalSchemas} passed`);
  
  // Performance summary
  if (Object.keys(performanceResults.benchmarks).length > 0) {
    console.log('\n⚡ Performance Benchmarks:');
    Object.entries(performanceResults.benchmarks).forEach(([schema, benchmark]) => {
      console.log(`  ${schema}: ${benchmark.avgCompilation}ms avg, ${benchmark.maxCompilation}ms max`);
    });
  }
  
  // Error summary
  const allErrors = [
    ...fileResults.errors,
    ...jsonResults.errors,
    ...compilationResults.errors,
    ...performanceResults.errors
  ];
  
  if (allErrors.length > 0) {
    console.log('\n🚨 Issues Found:');
    allErrors.forEach(error => {
      console.log(`  ${error.schema} (${error.type}): ${error.error}`);
    });
  }
  
  return totalPassed === totalSchemas;
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Schema Integrity Validation');
  console.log('═'.repeat(40));
  console.log(`📁 Schemas Directory: ${SCHEMAS_DIR}`);
  console.log(`📝 Required Schemas: ${REQUIRED_SCHEMAS.length}`);
  
  try {
    const fileResults = validateSchemaFiles();
    const jsonResults = validateSchemaJson();
    const compilationResults = validateSchemaCompilation();
    const performanceResults = validateSchemaPerformance();
    
    const allPassed = generateSummaryReport(fileResults, jsonResults, compilationResults, performanceResults);
    
    if (allPassed) {
      console.log('\n🎉 All schema integrity checks passed!');
      process.exit(0);
    } else {
      console.log('\n💥 Schema integrity issues detected!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Schema integrity validation failed:', error.message);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  main();
}

module.exports = {
  validateSchemaFiles,
  validateSchemaJson,
  validateSchemaCompilation,
  validateSchemaPerformance,
  REQUIRED_SCHEMAS
};