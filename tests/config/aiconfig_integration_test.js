/**
 * aiconfig.json Integration Test
 * 
 * @artifact docs/frontend-ui-spec.md#configuration
 * 
 * Validates that aiconfig.json contains proper configuration for:
 * - Storybook commands and scripts
 * - Atomic design patterns and conventions
 * - Mobile-first configurations and ergonomics
 * - JSON schema compliance and event counter tracking
 * 
 * This test should initially FAIL (RED phase) until aiconfig.json is updated
 * with comprehensive Storybook and atomic design documentation.
 */

const fs = require('fs');
const path = require('path');

// JSON Schema validation utilities
const validateJsonSchema = (obj, requiredProperties) => {
  const errors = [];
  
  requiredProperties.forEach(prop => {
    if (typeof prop === 'string') {
      if (!obj.hasOwnProperty(prop)) {
        errors.push(`Missing required property: ${prop}`);
      }
    } else if (typeof prop === 'object') {
      const { path: propPath, type, required = true } = prop;
      const value = getNestedProperty(obj, propPath);
      
      if (required && value === undefined) {
        errors.push(`Missing required nested property: ${propPath}`);
      } else if (value !== undefined && type && typeof value !== type) {
        errors.push(`Property ${propPath} should be ${type}, got ${typeof value}`);
      }
    }
  });
  
  return { isValid: errors.length === 0, errors };
};

const getNestedProperty = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Assertion helpers to reduce repetition
const assertCommandExists = (commands, commandName, shouldContain) => {
  expect(commands).toHaveProperty(commandName);
  if (shouldContain) {
    expect(commands[commandName]).toContain(shouldContain);
  }
};

const assertNestedProperty = (obj, path, expectedValue = undefined) => {
  const value = getNestedProperty(obj, path);
  expect(value).toBeDefined();
  if (expectedValue !== undefined) {
    expect(value).toBe(expectedValue);
  }
  return value;
};

const assertArrayProperty = (obj, path, expectedLength = null) => {
  const value = assertNestedProperty(obj, path);
  expect(Array.isArray(value)).toBe(true);
  if (expectedLength !== null) {
    expect(value.length).toBeGreaterThanOrEqual(expectedLength);
  }
  return value;
};

// Event counter validation
const validateEventCounter = (aiconfig, expectedMinimum = 43) => {
  expect(aiconfig).toHaveProperty('g');
  expect(typeof aiconfig.g).toBe('number');
  expect(aiconfig.g).toBeGreaterThanOrEqual(expectedMinimum);
  return aiconfig.g;
};

describe('aiconfig.json Integration', () => {
  let aiconfig;
  let currentEventCounter;
  
  beforeAll(() => {
    const configPath = path.join(process.cwd(), 'aiconfig.json');
    expect(fs.existsSync(configPath)).toBe(true);
    
    const configData = fs.readFileSync(configPath, 'utf8');
    
    // Validate JSON parsing
    expect(() => {
      aiconfig = JSON.parse(configData);
    }).not.toThrow();
    
    // Capture current event counter for tracking
    currentEventCounter = aiconfig.g;
  });

  describe('JSON Schema Validation', () => {
    test('should conform to required aiconfig schema structure', () => {
      const requiredTopLevel = [
        'architecture',
        'tech_stack', 
        'languages',
        'development_standards',
        'project_structure',
        'testing',
        'validated_patterns',
        { path: 'g', type: 'number' }
      ];
      
      const validation = validateJsonSchema(aiconfig, requiredTopLevel);
      expect(validation.isValid).toBe(true);
      if (!validation.isValid) {
        throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
      }
    });

    test('should maintain proper event counter format and progression', () => {
      const eventCounter = validateEventCounter(aiconfig, 43);
      expect(eventCounter).toBe(currentEventCounter);
      
      // Event counter should be incremented during implementation tasks
      // This test documents the expected progression pattern
      expect(typeof eventCounter).toBe('number');
      expect(eventCounter).toBeGreaterThan(0);
    });
  });

  describe('Storybook Configuration', () => {
    test('should document Storybook commands in testing section', () => {
      // RED phase: This should fail until aiconfig.json includes Storybook commands
      assertNestedProperty(aiconfig, 'testing.commands');
      
      const commands = aiconfig.testing.commands;
      
      // Use abstracted assertions for cleaner, reusable validation
      assertCommandExists(commands, 'storybook', 'storybook');
      assertCommandExists(commands, 'build_storybook', 'build-storybook');
      assertCommandExists(commands, 'chromatic', 'chromatic');
    });

    test('should specify Storybook version and configuration details', () => {
      // Verify tech stack documentation using helper
      assertNestedProperty(aiconfig, 'tech_stack.testing.visual_testing');
      expect(aiconfig.tech_stack.testing.visual_testing).toContain('Storybook 7.x');
      
      // Verify configuration file references using helper
      assertNestedProperty(aiconfig, 'validated_patterns.visual_testing.storybook_config', '.storybook/main.ts');
    });
  });

  describe('Atomic Design Patterns', () => {
    test('should document complete atomic design hierarchy', () => {
      // This should pass as atomic design is already documented
      const atomicDesign = assertNestedProperty(aiconfig, 'validated_patterns.atomic_design');
      
      // Use helper for array validation
      const hierarchy = assertArrayProperty(aiconfig, 'validated_patterns.atomic_design.hierarchy', 5);
      expect(hierarchy).toEqual([
        'atoms', 'molecules', 'organisms', 'templates', 'pages'
      ]);
      
      // Use helper for string property validation
      assertNestedProperty(aiconfig, 'validated_patterns.atomic_design.component_structure', 'src/components/{level}/{ComponentName}/');
      assertNestedProperty(aiconfig, 'validated_patterns.atomic_design.story_pattern', '*.stories.tsx');
      assertNestedProperty(aiconfig, 'validated_patterns.atomic_design.test_pattern', '*_test.tsx');
    });

    test('should document component development standards', () => {
      // RED phase: This should fail until component standards are documented
      const atomicDesign = assertNestedProperty(aiconfig, 'validated_patterns.atomic_design');
      
      // Use schema validation for missing properties
      const requiredStandards = [
        { path: 'validated_patterns.atomic_design.design_system', type: 'string' },
        { path: 'validated_patterns.atomic_design.typescript_required', type: 'boolean' },
        { path: 'validated_patterns.atomic_design.accessibility_standard', type: 'string' }
      ];
      
      const validation = validateJsonSchema(aiconfig, requiredStandards);
      expect(validation.isValid).toBe(true);
      
      // Verify specific values
      expect(getNestedProperty(aiconfig, 'validated_patterns.atomic_design.design_system')).toContain('shadcn/ui');
      expect(getNestedProperty(aiconfig, 'validated_patterns.atomic_design.typescript_required')).toBe(true);
      expect(getNestedProperty(aiconfig, 'validated_patterns.atomic_design.accessibility_standard')).toBe('WCAG 2.1 AA');
    });
  });

  describe('Mobile-First Configuration', () => {
    test('should document comprehensive mobile-first patterns', () => {
      // This should pass as mobile patterns are already documented
      const mobileFirst = assertNestedProperty(aiconfig, 'validated_patterns.mobile_first');
      
      // Use helper for array validation
      const breakpoints = assertArrayProperty(aiconfig, 'validated_patterns.mobile_first.breakpoints', 5);
      
      // Use helper for string properties
      assertNestedProperty(aiconfig, 'validated_patterns.mobile_first.touch_targets', 'minimum 44px x 44px');
      assertNestedProperty(aiconfig, 'validated_patterns.mobile_first.performance', '< 3s load on 3G mobile');
    });

    test('should document ergonomics and interaction patterns', () => {
      // Verify existing ergonomics documentation
      const ergonomics = assertNestedProperty(aiconfig, 'validated_patterns.mobile_first.ergonomics');
      
      // Use helpers for existing properties
      assertArrayProperty(aiconfig, 'validated_patterns.mobile_first.ergonomics.thumb_zones');
      assertNestedProperty(aiconfig, 'validated_patterns.mobile_first.ergonomics.primary_actions');
      assertNestedProperty(aiconfig, 'validated_patterns.mobile_first.ergonomics.secondary_actions');
      assertNestedProperty(aiconfig, 'validated_patterns.mobile_first.ergonomics.one_handed_priority', 'high');
      
      // RED phase: Use schema validation for missing gesture patterns
      const requiredGesturePatterns = [
        { path: 'validated_patterns.mobile_first.ergonomics.gesture_patterns.swipe_navigation', type: 'string' },
        { path: 'validated_patterns.mobile_first.ergonomics.gesture_patterns.touch_feedback', type: 'string' }
      ];
      
      const validation = validateJsonSchema(aiconfig, requiredGesturePatterns);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Development Tool Integration', () => {
    test('should document Chromatic visual testing configuration', () => {
      // This should pass as basic Chromatic config exists
      const visualTesting = assertNestedProperty(aiconfig, 'validated_patterns.visual_testing');
      
      // Use helpers for property validation
      assertNestedProperty(aiconfig, 'validated_patterns.visual_testing.chromatic_threshold', 0.2);
      
      const viewportTesting = assertArrayProperty(aiconfig, 'validated_patterns.visual_testing.viewport_testing', 3);
      expect(viewportTesting).toEqual(['mobile1', 'tablet', 'desktop']);
    });

    test('should document comprehensive testing command integration', () => {
      // RED phase: Use schema validation for missing testing workflows
      const requiredTestingCommands = [
        { path: 'testing.commands.test_visual', type: 'string' },
        { path: 'testing.commands.test_accessibility', type: 'string' },
        { path: 'testing.commands.test_chromatic', type: 'string' }
      ];
      
      const validation = validateJsonSchema(aiconfig, requiredTestingCommands);
      expect(validation.isValid).toBe(true);
      
      // Verify command content when they exist
      if (validation.isValid) {
        expect(getNestedProperty(aiconfig, 'testing.commands.test_visual')).toContain('storybook');
        expect(getNestedProperty(aiconfig, 'testing.commands.test_accessibility')).toContain('a11y');
        expect(getNestedProperty(aiconfig, 'testing.commands.test_chromatic')).toContain('chromatic');
      }
    });
  });

  describe('Enhanced Configuration Validation', () => {
    test('should maintain valid JSON schema structure with event counter tracking', () => {
      // Use formalized event counter validation
      const currentCounter = validateEventCounter(aiconfig, 44);
      
      // Document event counter progression expectations
      expect(currentCounter).toBeGreaterThanOrEqual(44);
      
      // Validate overall schema using helper
      const coreSchema = [
        'architecture',
        'tech_stack',
        'validated_patterns', 
        'testing',
        { path: 'g', type: 'number' }
      ];
      
      const validation = validateJsonSchema(aiconfig, coreSchema);
      expect(validation.isValid).toBe(true);
    });

    test('should include required cookbook pattern documentation', () => {
      // Verify existing cookbook patterns using helpers
      assertNestedProperty(aiconfig, 'validated_patterns.cookbook_location', 'docs/cookbook/');
      assertNestedProperty(aiconfig, 'validated_patterns.recipe_pattern', 'recipe_*.md');
      
      // RED phase: Use schema validation for missing cookbook integration
      const requiredCookbookIntegration = [
        { path: 'validated_patterns.cookbook_integration.atomic_components', type: 'string' },
        { path: 'validated_patterns.cookbook_integration.storybook_setup', type: 'string' },
        { path: 'validated_patterns.cookbook_integration.shadcn_integration', type: 'string' }
      ];
      
      const validation = validateJsonSchema(aiconfig, requiredCookbookIntegration);
      expect(validation.isValid).toBe(true);
    });

    test('should document OSM data complexity and schema requirements', () => {
      // RED phase: Document comprehensive OSM data structure understanding
      const requiredDataStructure = [
        { path: 'validated_patterns.osm_data_integration.property_count', type: 'number' },
        { path: 'validated_patterns.osm_data_integration.schema_coverage', type: 'string' },
        { path: 'validated_patterns.osm_data_integration.data_format', type: 'string' },
        { path: 'validated_patterns.osm_data_integration.validation_approach', type: 'string' }
      ];
      
      const validation = validateJsonSchema(aiconfig, requiredDataStructure);
      expect(validation.isValid).toBe(true);
      
      // Verify realistic expectations are documented
      if (validation.isValid) {
        expect(getNestedProperty(aiconfig, 'validated_patterns.osm_data_integration.property_count')).toBeGreaterThanOrEqual(104);
        expect(getNestedProperty(aiconfig, 'validated_patterns.osm_data_integration.schema_coverage')).toContain('systematic analysis');
      }
    });
  });
});