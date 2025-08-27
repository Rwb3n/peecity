# Type Conflict Resolution Plan

**Phase 0 Task:** Type Conflict Resolution Planning  
**Epic:** Architecture Optimization (Epic 3)  
**Generated:** 2025-01-26

## Conflict Summary

**Total Conflicts Identified:** 2  
**Resolution Strategy:** Rename conflicting types to avoid barrel export ambiguity

## Detailed Conflict Analysis

### 1. ValidationError Conflict ⚠️

**Conflict Type:** Dual Definition  
**Impact:** HIGH - affects 8+ files  

**Definition 1 (Simple):**
- **Location:** `src/types/suggestions.ts:51`
- **Structure:** 
  ```typescript
  export interface ValidationError {
    field: string;
    message: string;
    code: 'required' | 'invalid_format' | 'out_of_range' | 'invalid_type';
  }
  ```
- **Usage:** Suggestion validation contexts
- **Files affected:** 4 files

**Definition 2 (Extended):**
- **Location:** `src/lib/validation/errors.ts`
- **Structure:** Extended error class with additional methods
- **Usage:** Library validation system
- **Files affected:** 8+ files
- **Current barrel export:** This version is exported

**Resolution Strategy:**
1. **Rename suggestions version:** `ValidationError` → `SuggestionValidationError`
2. **Keep lib version:** Maintain as primary `ValidationError` in barrel export
3. **Update imports:** Systematic replacement in affected files

**Files requiring updates:**
- `src/types/suggestions.ts` - Rename interface definition
- `src/utils/validation.ts` - Update import statement  
- `src/services/validation/TieredValidationService.ts` - Update import
- `src/lib/validation/core.ts` - Update import
- `src/lib/validation/tiered.ts` - Update import

### 2. CacheEntry Conflict ⚠️

**Conflict Type:** Naming Convention  
**Impact:** MEDIUM - affects 3 files

**Original Name:** `CacheEntry`
- **Location:** `src/utils/overpass.ts` and other utility contexts
- **Usage:** Generic caching interface

**Barrel Export Name:** `GenericCacheEntry`
- **Location:** `src/lib/types/common/cache.ts`
- **Reason:** Renamed to avoid conflicts with specific cache implementations

**Resolution Strategy:**
1. **Migration target:** Use `GenericCacheEntry` from barrel exports
2. **Update imports:** Replace `CacheEntry` → `GenericCacheEntry` 
3. **Verify compatibility:** Ensure interface structures match

**Files requiring updates:**
- Files importing `CacheEntry` should migrate to `GenericCacheEntry` from @/lib

## Resolution Implementation Steps

### Step 1: Resolve ValidationError Conflict

```typescript
// Before (src/types/suggestions.ts)
export interface ValidationError {
  field: string;
  message: string;
  code: 'required' | 'invalid_format' | 'out_of_range' | 'invalid_type';
}

// After (src/types/suggestions.ts)  
export interface SuggestionValidationError {
  field: string;
  message: string;
  code: 'required' | 'invalid_format' | 'out_of_range' | 'invalid_type';
}
```

```typescript
// Update SuggestionValidation interface
export interface SuggestionValidation {
  isValid: boolean;
  errors: SuggestionValidationError[];  // Updated reference
  warnings: ValidationWarning[];
  isDuplicate: boolean;
  duplicateDistance?: number;
  nearestToiletId?: string;
}
```

### Step 2: Update Import Statements

**Pattern to find:**
```bash
grep -r "ValidationError" src/ --include="*.ts" --include="*.tsx"
```

**Systematic replacement:**
- `import { ValidationError } from '../types/suggestions'` → `import { SuggestionValidationError } from '../types/suggestions'`
- Update all usage within files: `ValidationError` → `SuggestionValidationError`

### Step 3: Add Missing Types to Barrel Export

```typescript
// Add to src/lib/index.ts type exports section
export type {
  // ... existing exports ...
  
  // Newly added from suggestions
  SuggestionValidation,
  SuggestionValidationError,  // Renamed to avoid conflict
  ValidationWarning,
  ProcessedSuggestion,
  SuggestionLogEntry
} from './types';
```

```typescript
// Add to src/lib/types/index.ts
// Re-export from suggestions (with renamed ValidationError)
export type { 
  SuggestionValidation,
  SuggestionValidationError as ValidationError,  // Alias for barrel export
  ValidationWarning, 
  ProcessedSuggestion,
  SuggestionLogEntry,
  SuggestionResponse,
  RateLimitInfo
} from '../../../types/suggestions';
```

### Step 4: Verification Steps

1. **TypeScript compilation:** `npm run build` - ensure no compilation errors
2. **Test validation:** `npm test` - ensure type changes don't break functionality
3. **Barrel export verification:** Test import of all types from @/lib
4. **Circular dependency check:** Ensure no new cycles introduced

## Risk Assessment

**LOW RISK:**
- Changes are purely nominal (renaming)
- No functional logic changes required
- TypeScript will catch any missed updates

**MITIGATION:**
- Systematic grep-based replacement
- Compilation verification at each step
- Git commit after each conflict resolution for rollback capability

## Success Criteria

✅ All ValidationError conflicts resolved  
✅ CacheEntry conflicts resolved  
✅ TypeScript compilation succeeds  
✅ All tests pass  
✅ Barrel exports include all missing critical types  
✅ No circular dependencies introduced  

**Expected Outcome:** Clean foundation for automated import migration in subsequent phases.