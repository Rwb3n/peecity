#!/usr/bin/env node

/**
 * Monitor Agent CLI
 * 
 * @doc refs docs/architecture-spec.md#monitor-agent
 * 
 * Thin CLI wrapper for MonitorService that provides proper exit codes
 * and logging for GitHub Actions workflow execution.
 */

import { MonitorService } from '../src/services/MonitorService';
import { createAgentLogger } from '../src/utils/logger';

const logger = createAgentLogger('monitor-agent-cli');

/**
 * Main CLI execution function
 */
async function main(): Promise<void> {
  const startTime = Date.now();
  
  try {
    logger.info('cli_start', 'Monitor agent CLI started');
    
    // Create and execute monitor service
    const monitorService = new MonitorService();
    const result = await monitorService.execute();
    
    const duration = Date.now() - startTime;
    
    if (result.success) {
      logger.info('cli_success', 'Monitor agent completed successfully', {
        ...result,
        duration: duration
      });
      
      // Print summary to stdout for GitHub Actions logs
      console.log(`✅ Monitor agent completed successfully`);
      console.log(`Week: ${result.week}`);
      console.log(`New toilets: ${result.newToilets}`);
      console.log(`Removed toilets: ${result.removedToilets}`);
      console.log(`Suggestions: ${result.suggestSubmissions}`);
      console.log(`Error rate: ${Math.round(result.errorRate * 100)}%`);
      console.log(`P95 latency: ${result.p95Latency}ms`);
      console.log(`Duration: ${duration}ms`);
      
      process.exit(0);
    } else {
      logger.error('cli_failed', 'Monitor agent failed', {
        error: result.error,
        duration: duration
      });
      
      console.error(`❌ Monitor agent failed: ${result.error}`);
      process.exit(1);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('cli_error', 'Monitor agent CLI error', {
      error: errorMessage,
      durationMs: duration
    });
    
    console.error(`❌ Monitor agent CLI error: ${errorMessage}`);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('unhandled_rejection', 'Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    promise: String(promise)
  });
  console.error('❌ Unhandled promise rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('uncaught_exception', 'Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Execute main function
main().catch((error) => {
  logger.error('main_error', 'Main function error', {
    error: error instanceof Error ? error.message : 'Unknown error'
  });
  console.error('❌ Main function error:', error);
  process.exit(1);
});