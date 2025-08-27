#!/usr/bin/env node

/**
 * Test Import Pattern Detection
 * 
 * @phase phase1_task1.4
 * 
 * Tests the classification logic for different import patterns
 * identified in Phase 0 audit without requiring ts-morph compilation.
 */

const fs = require('fs');
const path = require('path');

// Mock barrel exports from our actual lib/index.ts
const BARREL_EXPORTS = new Set([
  'validateSuggestion', 'sanitizeSuggestion', 'validateRequestBody', 'generateSuggestionId',
  'validatePropertyByTier', 'aggregateValidationByTier', 'validateManyProperties',
  'ErrorCode', 'HttpStatus', 'AppError', 'ValidationError', 'ValidationErrorMessages', 'ErrorFactory',
  'createErrorResponse', 'createSuccessResponse', 'formatFieldName', 'calculateDistance',
  'isWithinLondonBounds', 'toRadians', 'toDegrees', 'formatCoordinates', 'validateCoordinates',
  'createSpatialIndex', 'findNearestToilet', 'clearSpatialIndexCache', 'getSpatialIndexCacheStats',
  'queryOverpass', 'TOILET_QUERIES', 'getPerformanceMetrics', 'clearCache', 'benchmarkQuery',
  'cn', 'ToiletSuggestion', 'ToiletFeature', 'ToiletCollection', 'ProcessedSuggestion',
  'SuggestionValidation', 'SuggestionValidationError', 'ValidationWarning', 'SuggestionResponse',
  'SuggestionLogEntry', 'SuggestionConfig', 'RateLimitInfo', 'Point', 'ToiletProperties',
  'OverpassElement', 'OverpassResponse', 'RequestOptions', 'IngestConfig',
  'DuplicateCheckRequest', 'DuplicateCheckResult', 'IngestOptions', 'IngestResult',
  'LogSuggestionRequest', 'RateLimitRequest', 'RateLimitResult', 'MonitorConfig', 'MonitorResult',
  'ToiletDataProvider', 'CachedToiletDataProvider', 'FileToiletDataConfig',
  'MetricsCollector', 'MetricsData', 'MetricsCollectionResult',
  'AlertSender', 'AlertData', 'AlertSendResult', 'ValidationRequest', 'ValidationResult',
  'TierConfig', 'PropertyMetadata', 'ValidationMetrics', 'ValidationContext',
  'TieredValidationResult', 'ValidationService', 'ServiceComposition', 'PerformanceBenchmark',
  'GenericCacheEntry', 'LogEntry', 'LoggerConfig', 'ValidationConfig', 'RateLimitConfig',
  'DuplicateDetectionConfig', 'FilePathsConfig', 'FileLogConfig', 'SystemConfig',
  'BaseEntity', 'BaseResponse', 'PaginatedResponse', 'DeepPartial', 'KeysOfType',
  'PartialKeys', 'RequiredKeys', 'OverpassConfig', 'CacheEntry'
]);

// Test cases from Phase 0 audit findings
const TEST_CASES = [
  {
    name: 'Basic relative type import',
    import: 'import { SuggestionValidation } from "../../types/suggestions";',
    expectedCategory: 'library',
    expectedTransform: 'import { SuggestionValidation } from "@/lib";'
  },
  {
    name: 'Multiple named imports with conflict',
    import: 'import { ValidationError, ValidationWarning } from "../types/suggestions";',
    expectedCategory: 'conflict_resolution',
    expectedTransform: 'import { SuggestionValidationError, ValidationWarning } from "@/lib";'
  },
  {
    name: 'Type-only imports',
    import: 'import type { OverpassResponse } from "../../types/geojson";',
    expectedCategory: 'library',
    expectedTransform: 'import type { OverpassResponse } from "@/lib";'
  },
  {
    name: 'Aliased imports',
    import: 'import { ValidationError as SuggestError } from "../types/suggestions";',
    expectedCategory: 'conflict_resolution',
    expectedTransform: 'import { SuggestionValidationError as SuggestError } from "@/lib";'
  },
  {
    name: 'Utility import (preserve)',
    import: 'import { createAgentLogger } from "../utils/logger";',
    expectedCategory: 'utilities',
    expectedTransform: 'PRESERVED'
  },
  {
    name: 'Namespace import (preserve)',
    import: 'import * as Utils from "../../utils/overpass";',
    expectedCategory: 'utilities',
    expectedTransform: 'PRESERVED'
  },
  {
    name: 'Framework import (preserve)',
    import: 'import { NextResponse } from "next/server";',
    expectedCategory: 'framework',
    expectedTransform: 'PRESERVED'
  },
  {
    name: 'External package (preserve)',
    import: 'import { useState } from "react";',
    expectedCategory: 'external',
    expectedTransform: 'PRESERVED'
  },
  {
    name: 'Circular dependency risk',
    import: 'import { ToiletSuggestion } from "../../types/suggestions";',
    file: 'src/lib/validation/core.ts',
    expectedCategory: 'circular_risk',
    expectedTransform: 'PRESERVED'
  },
  {
    name: 'Missing barrel export',
    import: 'import { NonExistentType } from "../types/custom";',
    expectedCategory: 'missing_barrel',
    expectedTransform: 'NEEDS_BARREL_ADDITION'
  }
];

class ImportPatternTester {
  constructor() {
    this.barrelExports = BARREL_EXPORTS;
  }

  parseImport(importStatement) {
    // Simple regex-based parsing for testing
    const matches = importStatement.match(/import\s+(type\s+)?(\*\s+as\s+\w+|\{[^}]+\}|\w+)\s+from\s+["']([^"']+)["']/);
    
    if (!matches) {
      return null;
    }

    const [, typeOnly, importClause, modulePath] = matches;
    const isTypeOnly = !!typeOnly;
    
    let importedNames = [];
    let aliases = [];
    let importType = 'named';

    if (importClause.startsWith('*')) {
      importType = 'namespace';
      const namespaceMatch = importClause.match(/\*\s+as\s+(\w+)/);
      importedNames = namespaceMatch ? [namespaceMatch[1]] : [];
    } else if (importClause.startsWith('{')) {
      importType = isTypeOnly ? 'type-only' : 'named';
      const namesMatch = importClause.match(/\{([^}]+)\}/);
      if (namesMatch) {
        const nameList = namesMatch[1].split(',').map(name => name.trim()).filter(name => name);
        nameList.forEach(name => {
          if (name.includes(' as ')) {
            const [originalName, aliasName] = name.split(' as ').map(n => n.trim());
            importedNames.push(originalName);
            aliases.push(`${originalName} as ${aliasName}`);
          } else {
            importedNames.push(name);
            aliases.push(name);
          }
        });
      }
    } else {
      importType = 'default';
      importedNames = [importClause.trim()];
      aliases = [importClause.trim()];
    }

    const pathComplexity = (modulePath.match(/\.\.\//g) || []).length;

    return {
      importPath: modulePath,
      importedNames,
      aliases,
      importType,
      pathComplexity,
      isTypeOnly
    };
  }

  categorizeImport(parsedImport, filePath = 'src/test/file.ts') {
    if (!parsedImport) return 'invalid';

    const { importPath, importedNames } = parsedImport;

    // Framework imports (Next.js, React) - always preserve
    if (this.isFrameworkImport(importPath)) {
      return 'framework';
    }

    // External packages - always preserve  
    if (!importPath.startsWith('.')) {
      return 'external';
    }

    // Circular dependency risks - preserve to avoid cycles
    if (this.hasCircularRisk(importPath, filePath)) {
      return 'circular_risk';
    }

    // Utility imports - case-by-case evaluation
    if (this.isUtilityImport(importPath)) {
      return 'utilities';
    }

    // Check for naming conflicts
    if (this.hasNamingConflicts(importedNames, importPath)) {
      return 'conflict_resolution';
    }

    // Library imports - check barrel availability
    if (this.isLibraryImport(importPath)) {
      const missingNames = importedNames.filter(name => !this.barrelExports.has(name));
      if (missingNames.length > 0) {
        return 'missing_barrel';
      } else {
        return 'library';
      }
    }

    // Check if available in barrel exports
    const availableNames = importedNames.filter(name => this.barrelExports.has(name));
    if (availableNames.length > 0) {
      return 'library';
    } else {
      return 'missing_barrel';
    }
  }

  isFrameworkImport(importPath) {
    return importPath.includes('next/') || 
           importPath.includes('node_modules');
  }

  isUtilityImport(importPath) {
    return importPath.includes('../utils/') || 
           importPath.includes('./utils/') ||
           importPath.includes('utils/');
  }

  isLibraryImport(importPath) {
    return importPath.includes('../lib/') || 
           importPath.includes('./lib/') ||
           importPath.includes('lib/') ||
           importPath.includes('../types/') ||
           importPath.includes('./types/') ||
           importPath.includes('types/') ||
           importPath.includes('../interfaces/') ||
           importPath.includes('./interfaces/') ||
           importPath.includes('interfaces/');
  }

  hasCircularRisk(importPath, filePath) {
    // Files in lib/ importing from types/ create circular dependency risk
    if (filePath.includes('src/lib/') && importPath.includes('../../types/')) {
      return true;
    }
    
    return false;
  }

  hasNamingConflicts(importedNames, importPath) {
    for (const name of importedNames) {
      if (name === 'ValidationError' && importPath.includes('types/suggestions')) {
        return true;
      }
      if (name === 'CacheEntry' && !this.barrelExports.has('GenericCacheEntry')) {
        return true;
      }
    }
    return false;
  }

  generateTransformation(parsedImport, filePath = 'src/test/file.ts') {
    if (!parsedImport) return 'INVALID';

    const category = this.categorizeImport(parsedImport, filePath);
    
    if (['framework', 'utilities', 'external', 'circular_risk'].includes(category)) {
      return 'PRESERVED';
    }

    if (category === 'missing_barrel') {
      return 'NEEDS_BARREL_ADDITION';
    }

    if (category === 'conflict_resolution') {
      // Handle ValidationError conflict with aliases preserved
      const transformedAliases = parsedImport.aliases.map(alias => {
        if (alias.includes('ValidationError')) {
          return alias.replace('ValidationError', 'SuggestionValidationError');
        }
        if (alias.includes('CacheEntry')) {
          return alias.replace('CacheEntry', 'GenericCacheEntry');
        }
        return alias;
      });

      const typePrefix = parsedImport.isTypeOnly ? 'type ' : '';
      return `import ${typePrefix}{ ${transformedAliases.join(', ')} } from "@/lib";`;
    }

    if (category === 'library') {
      const availableAliases = parsedImport.aliases.filter((alias, index) => 
        this.barrelExports.has(parsedImport.importedNames[index])
      );
      const typePrefix = parsedImport.isTypeOnly ? 'type ' : '';
      return `import ${typePrefix}{ ${availableAliases.join(', ')} } from "@/lib";`;
    }

    return 'UNKNOWN';
  }

  runTests() {
    console.log('🧪 Testing Import Pattern Classification\n');

    let passed = 0;
    let failed = 0;

    TEST_CASES.forEach((testCase, index) => {
      console.log(`Test ${index + 1}: ${testCase.name}`);
      console.log(`  Input: ${testCase.import}`);

      const parsed = this.parseImport(testCase.import);
      const category = this.categorizeImport(parsed, testCase.file);
      const transformation = this.generateTransformation(parsed, testCase.file);

      console.log(`  Expected category: ${testCase.expectedCategory}`);
      console.log(`  Actual category: ${category}`);
      console.log(`  Expected transform: ${testCase.expectedTransform}`);
      console.log(`  Actual transform: ${transformation}`);

      const categoryMatch = category === testCase.expectedCategory;
      const transformMatch = transformation === testCase.expectedTransform;

      if (categoryMatch && transformMatch) {
        console.log(`  ✅ PASS\n`);
        passed++;
      } else {
        console.log(`  ❌ FAIL`);
        if (!categoryMatch) console.log(`    Category mismatch`);
        if (!transformMatch) console.log(`    Transform mismatch`);
        console.log('');
        failed++;
      }
    });

    console.log('📊 Test Results:');
    console.log(`  Passed: ${passed}/${TEST_CASES.length}`);
    console.log(`  Failed: ${failed}/${TEST_CASES.length}`);
    console.log(`  Success Rate: ${Math.round((passed / TEST_CASES.length) * 100)}%`);

    if (failed === 0) {
      console.log('\n✅ All tests passed! Pattern classification is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Review the classification logic.');
    }

    return { passed, failed, total: TEST_CASES.length };
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new ImportPatternTester();
  const results = tester.runTests();
  process.exit(results.failed === 0 ? 0 : 1);
}

module.exports = { ImportPatternTester };