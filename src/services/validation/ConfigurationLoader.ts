/**
 * Configuration Loader
 * 
 * @artifact docs/cookbook/recipe_tiered_validation.md
 * @epic foundation_consolidation_epic
 * @task foundation_consolidation_task2_corrected
 * @tdd-phase GREEN
 * 
 * Handles loading and caching of tier configuration files.
 * Single responsibility: configuration management with caching.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { TierConfig } from '@/lib';
import { ConfigurationLoader } from './interfaces';

// Import property tiers schema for validation
const propertyTiersSchema = require('../../../schemas/propertyTiers.schema.json');

/**
 * Configuration loader with caching capabilities
 */
export class TierConfigurationLoader implements ConfigurationLoader {
  private configCache: TierConfig | null = null;
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv();
    addFormats(this.ajv);
  }

  /**
   * Load tier configuration from file with caching
   */
  async loadConfiguration(configPath: string): Promise<TierConfig> {
    // Return cached configuration if available
    if (this.configCache) {
      return this.configCache;
    }

    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);

      // Validate configuration against schema
      this.validateConfiguration(config);

      // Cache the validated configuration
      this.configCache = config;
      
      return config;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load tier configuration from ${configPath}: ${errorMessage}`);
    }
  }

  /**
   * Get cached configuration if available
   */
  getCachedConfiguration(): TierConfig | null {
    return this.configCache;
  }

  /**
   * Validate configuration against schema
   */
  validateConfiguration(config: TierConfig): boolean {
    const valid = this.ajv.validate(propertyTiersSchema, config);
    
    if (!valid) {
      throw new Error(`Invalid tier configuration: ${JSON.stringify(this.ajv.errors)}`);
    }

    return true;
  }

  /**
   * Clear cached configuration (useful for testing)
   */
  clearCache(): void {
    this.configCache = null;
  }

  /**
   * Get default configuration path
   */
  static getDefaultConfigPath(): string {
    return path.join(process.cwd(), 'src', 'config', 'suggestPropertyTiers.json');
  }
}