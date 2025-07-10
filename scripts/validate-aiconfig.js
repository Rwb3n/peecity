#!/usr/bin/env node

/**
 * aiconfig.json Validation Script
 * 
 * @artifact docs/frontend-ui-spec.md#configuration
 * @task config_refactor
 * @tdd-phase REFACTOR
 * 
 * Validates aiconfig.json structure, schema compliance, and consistency
 * with project standards. Designed for CI/CD integration and development workflow.
 */

const fs = require('fs');
const path = require('path');

class AiConfigValidator {
  constructor(configPath = './aiconfig.json') {
    this.configPath = configPath;
    this.errors = [];
    this.warnings = [];
    this.config = null;
  }

  /**
   * Run complete validation suite
   */
  async validate() {
    console.log('🔍 Validating aiconfig.json...\n');
    
    try {
      this.loadConfig();
      this.validateBasicStructure();
      this.validateEventCounter();
      this.validateTechStack();
      this.validateTestingConfiguration();
      this.validateValidatedPatterns();
      this.validateStorybookIntegration();
      this.validateOSMDataIntegration();
      this.validateConsistency();
      
      this.reportResults();
      return this.errors.length === 0;
    } catch (error) {
      this.errors.push(`Fatal validation error: ${error.message}`);
      this.reportResults();
      return false;
    }
  }

  /**
   * Load and parse aiconfig.json
   */
  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`Config file not found: ${this.configPath}`);
    }

    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  }

  /**
   * Validate basic required structure
   */
  validateBasicStructure() {
    const requiredTopLevel = [
      'architecture', 'tech_stack', 'languages', 'development_standards',
      'project_structure', 'testing', 'validated_patterns', 'g'
    ];

    requiredTopLevel.forEach(field => {
      if (!this.config.hasOwnProperty(field)) {
        this.errors.push(`Missing required top-level field: ${field}`);
      }
    });

    // Validate nested requirements
    this.validateNested('architecture', ['type', 'agents', 'data_format']);
    this.validateNested('tech_stack', ['runtime', 'frontend', 'backend', 'testing']);
    this.validateNested('testing', ['runner', 'commands']);
  }

  /**
   * Validate event counter format and progression
   */
  validateEventCounter() {
    const g = this.config.g;
    
    if (typeof g !== 'number') {
      this.errors.push(`Event counter 'g' must be a number, got ${typeof g}`);
      return;
    }

    if (g < 1) {
      this.errors.push(`Event counter 'g' must be positive, got ${g}`);
    }

    // Validate reasonable progression (should be > 40 based on project history)
    if (g < 45) {
      this.warnings.push(`Event counter 'g' seems low for project maturity: ${g}`);
    }
  }

  /**
   * Validate tech stack completeness
   */
  validateTechStack() {
    const techStack = this.config.tech_stack;
    
    // Validate frontend stack
    const frontend = techStack.frontend;
    if (frontend) {
      const requiredFrontend = ['framework', 'ui', 'styling'];
      requiredFrontend.forEach(field => {
        if (!frontend[field]) {
          this.errors.push(`Missing frontend tech stack field: ${field}`);
        }
      });

      // Validate specific technology versions
      if (frontend.framework && !frontend.framework.includes('Next.js')) {
        this.warnings.push('Expected Next.js in frontend framework');
      }
    }
  }

  /**
   * Validate testing configuration completeness
   */
  validateTestingConfiguration() {
    const testing = this.config.testing;
    
    if (!testing.commands) {
      this.errors.push('Missing testing.commands configuration');
      return;
    }

    // Validate required test commands
    const requiredCommands = ['test', 'storybook', 'chromatic'];
    requiredCommands.forEach(cmd => {
      if (!testing.commands[cmd]) {
        this.errors.push(`Missing required testing command: ${cmd}`);
      }
    });

    // Validate Storybook integration
    const storybookCommands = ['storybook', 'build_storybook', 'test_visual'];
    storybookCommands.forEach(cmd => {
      if (testing.commands[cmd] && !testing.commands[cmd].includes('storybook')) {
        this.warnings.push(`Command '${cmd}' should reference storybook`);
      }
    });
  }

  /**
   * Validate validated_patterns completeness
   */
  validateValidatedPatterns() {
    const patterns = this.config.validated_patterns;
    
    if (!patterns) {
      this.errors.push('Missing validated_patterns configuration');
      return;
    }

    // Validate required pattern sections
    const requiredPatterns = [
      'cookbook_location', 'atomic_design', 'mobile_first', 
      'visual_testing', 'cookbook_integration', 'osm_data_integration'
    ];
    
    requiredPatterns.forEach(pattern => {
      if (!patterns[pattern]) {
        this.errors.push(`Missing validated pattern: ${pattern}`);
      }
    });

    // Validate atomic design completeness
    if (patterns.atomic_design) {
      const requiredAtomic = ['hierarchy', 'design_system', 'typescript_required'];
      requiredAtomic.forEach(field => {
        if (!patterns.atomic_design[field]) {
          this.errors.push(`Missing atomic_design field: ${field}`);
        }
      });
    }
  }

  /**
   * Validate Storybook integration completeness
   */
  validateStorybookIntegration() {
    const visualTesting = this.config.validated_patterns?.visual_testing;
    const testingCommands = this.config.testing?.commands;
    
    if (!visualTesting) {
      this.errors.push('Missing visual_testing configuration');
      return;
    }

    // Validate Storybook configuration
    const requiredVisual = ['storybook_config', 'chromatic_threshold'];
    requiredVisual.forEach(field => {
      if (!visualTesting[field]) {
        this.errors.push(`Missing visual_testing field: ${field}`);
      }
    });

    // Validate command integration
    if (testingCommands && (!testingCommands.storybook || !testingCommands.chromatic)) {
      this.warnings.push('Storybook commands should be integrated in testing.commands');
    }
  }

  /**
   * Validate OSM data integration awareness
   */
  validateOSMDataIntegration() {
    const osmData = this.config.validated_patterns?.osm_data_integration;
    
    if (!osmData) {
      this.errors.push('Missing OSM data integration configuration');
      return;
    }

    // Validate OSM complexity documentation
    const requiredOSM = ['property_count', 'schema_coverage', 'data_format'];
    requiredOSM.forEach(field => {
      if (!osmData[field]) {
        this.errors.push(`Missing OSM data integration field: ${field}`);
      }
    });

    // Validate property count accuracy
    if (osmData.property_count && osmData.property_count < 100) {
      this.warnings.push(`OSM property count seems low: ${osmData.property_count} (expected ~104)`);
    }
  }

  /**
   * Validate consistency across configuration
   */
  validateConsistency() {
    // Validate cookbook references consistency
    const cookbookLocation = this.config.validated_patterns?.cookbook_location;
    const cookbookIntegration = this.config.validated_patterns?.cookbook_integration;
    
    if (cookbookLocation && cookbookIntegration) {
      Object.values(cookbookIntegration).forEach(reference => {
        if (typeof reference === 'string' && !reference.startsWith(cookbookLocation)) {
          this.warnings.push(`Cookbook reference should start with ${cookbookLocation}: ${reference}`);
        }
      });
    }

    // Validate version consistency
    const techStack = this.config.tech_stack;
    if (techStack?.testing?.visual_testing && techStack.testing.visual_testing.includes('Storybook')) {
      const storybookConfig = this.config.validated_patterns?.visual_testing?.storybook_config;
      if (!storybookConfig) {
        this.warnings.push('Storybook version mentioned but configuration path missing');
      }
    }
  }

  /**
   * Validate nested object requirements
   */
  validateNested(parentKey, requiredFields) {
    const parent = this.config[parentKey];
    if (!parent) return;

    requiredFields.forEach(field => {
      if (!parent[field]) {
        this.errors.push(`Missing ${parentKey}.${field}`);
      }
    });
  }

  /**
   * Report validation results
   */
  reportResults() {
    console.log('\n📊 Validation Results:\n');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ Configuration validation passed! No issues found.\n');
      return;
    }

    if (this.errors.length > 0) {
      console.log('❌ Validation Errors:');
      this.errors.forEach(error => console.log(`   • ${error}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  Validation Warnings:');
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
      console.log('');
    }

    console.log(`📈 Summary: ${this.errors.length} errors, ${this.warnings.length} warnings\n`);
    
    if (this.errors.length > 0) {
      console.log('💡 Fix errors before proceeding with deployment.\n');
    }
  }
}

// CLI execution
if (require.main === module) {
  const configPath = process.argv[2] || './aiconfig.json';
  const validator = new AiConfigValidator(configPath);
  
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = AiConfigValidator;