#!/usr/bin/env node
/**
 * Ingest Agent CLI
 * 
 * @doc refs docs/architecture-spec.md#ingest-agent
 * 
 * Command-line interface for the ingest agent.
 * Separates CLI concerns from pure data processing logic.
 */

import 'dotenv/config';
import { program } from 'commander';
import { IngestService } from '../src/services/ingestService';

/**
 * CLI configuration and options
 */
interface CLIOptions {
  apiUrl?: string;
  output?: string;
  retries?: number;
  timeout?: number;
  verbose?: boolean;
  quiet?: boolean;
  userAgent?: string;
  noCache?: boolean;
}

/**
 * Console output utilities
 */
class ConsoleOutput {
  constructor(private verbose: boolean = false, private quiet: boolean = false) {}

  info(message: string, data?: any): void {
    if (!this.quiet) {
      console.log(`ℹ️  ${message}`);
      if (this.verbose && data) {
        console.log('   ', JSON.stringify(data, null, 2));
      }
    }
  }

  success(message: string, data?: any): void {
    if (!this.quiet) {
      console.log(`✅ ${message}`);
      if (this.verbose && data) {
        console.log('   ', JSON.stringify(data, null, 2));
      }
    }
  }

  error(message: string, error?: any): void {
    console.error(`❌ ${message}`);
    if (this.verbose && error) {
      console.error('   ', error);
    }
  }

  warn(message: string): void {
    if (!this.quiet) {
      console.warn(`⚠️  ${message}`);
    }
  }

  step(message: string): void {
    if (!this.quiet) {
      console.log(`🚀 ${message}`);
    }
  }

  result(message: string, data: any): void {
    if (!this.quiet) {
      console.log(`📊 ${message}`);
      console.log('   ', data);
    }
  }
}

/**
 * Format duration for human-readable output
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Main CLI command handler
 */
async function runIngestCommand(options: CLIOptions): Promise<void> {
  const output = new ConsoleOutput(options.verbose, options.quiet);
  const startTime = Date.now();

  try {
    output.step('Starting OSM toilet data ingestion...');

    // Create ingest service with CLI options
    const ingestService = new IngestService({
      overpassApiUrl: options.apiUrl,
      outputFile: options.output,
      retryAttempts: options.retries,
      timeoutMs: options.timeout ? options.timeout * 1000 : undefined,
      userAgent: options.userAgent,
      enableCache: !options.noCache
    });

    if (options.verbose) {
      output.info('Ingest configuration', ingestService.getConfig());
    }

    // Run the ingest process
    const result = await ingestService.ingest();
    const duration = Date.now() - startTime;

    if (result.success) {
      output.success(`Ingestion completed successfully in ${formatDuration(duration)}`);
      output.result('Results', {
        featuresCount: result.featuresCount,
        outputFile: result.outputFile,
        generatedAt: result.generatedAt
      });
      
      if (result.featuresCount === 0) {
        output.warn('No toilet features were found or processed');
      }
      
      process.exit(0);
    } else {
      output.error(`Ingestion failed after ${formatDuration(duration)}`, result.error);
      process.exit(1);
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    output.error(`Ingestion failed after ${formatDuration(duration)}`, errorMessage);
    
    if (options.verbose && error instanceof Error) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

/**
 * Setup CLI program with commands and options
 */
function setupCLI(): void {
  program
    .name('ingest-cli')
    .description('CityPee OSM toilet data ingestion tool')
    .version('1.0.0');

  program
    .command('run')
    .description('Run the ingest process to fetch and normalize OSM toilet data')
    .option('-a, --api-url <url>', 'Overpass API URL', process.env.OVERPASS_API_URL)
    .option('-o, --output <file>', 'Output GeoJSON file path')
    .option('-r, --retries <number>', 'Number of retry attempts', (val) => parseInt(val, 10), 3)
    .option('-t, --timeout <seconds>', 'Request timeout in seconds', (val) => parseInt(val, 10), 30)
    .option('-u, --user-agent <string>', 'User agent for API requests')
    .option('--no-cache', 'Disable caching of API responses')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-q, --quiet', 'Suppress non-error output')
    .action(runIngestCommand);

  // Default command (for backward compatibility)
  program
    .option('-a, --api-url <url>', 'Overpass API URL', process.env.OVERPASS_API_URL)
    .option('-o, --output <file>', 'Output GeoJSON file path')
    .option('-r, --retries <number>', 'Number of retry attempts', (val) => parseInt(val, 10), 3)
    .option('-t, --timeout <seconds>', 'Request timeout in seconds', (val) => parseInt(val, 10), 30)
    .option('-u, --user-agent <string>', 'User agent for API requests')
    .option('--no-cache', 'Disable caching of API responses')
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-q, --quiet', 'Suppress non-error output')
    .action(runIngestCommand);

  program.parse();
}

/**
 * Entry point
 */
if (require.main === module) {
  setupCLI();
}

export { runIngestCommand, setupCLI };