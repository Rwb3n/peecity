/**
 * Shared Logging Utilities
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Centralized logging system for structured data collection across all agents.
 * Provides consistent logging patterns, file management, and data formatting.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  action: string;
  data?: any;
  metadata?: {
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    duration?: number;
  };
}

export interface LoggerConfig {
  logDir: string;
  maxFileSize: number; // bytes
  maxFiles: number;
  enableConsole: boolean;
  level: 'info' | 'warn' | 'error' | 'debug';
}

const DEFAULT_CONFIG: LoggerConfig = {
  logDir: path.join(process.cwd(), 'data'),
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  enableConsole: process.env.NODE_ENV === 'development',
  level: 'info'
};

/**
 * Logger class for structured logging
 */
export class Logger {
  private config: LoggerConfig;
  private logFiles = new Map<string, string>();

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ensureLogDirectory();
  }

  /**
   * Log an entry with specified level
   */
  log(level: LogEntry['level'], source: string, action: string, data?: any, metadata?: LogEntry['metadata']): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source,
      action,
      data,
      metadata
    };

    this.writeToFile(source, entry);
    
    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }
  }

  /**
   * Log info level
   */
  info(source: string, action: string, data?: any, metadata?: LogEntry['metadata']): void {
    this.log('info', source, action, data, metadata);
  }

  /**
   * Log warning level
   */
  warn(source: string, action: string, data?: any, metadata?: LogEntry['metadata']): void {
    this.log('warn', source, action, data, metadata);
  }

  /**
   * Log error level
   */
  error(source: string, action: string, data?: any, metadata?: LogEntry['metadata']): void {
    this.log('error', source, action, data, metadata);
  }

  /**
   * Log debug level
   */
  debug(source: string, action: string, data?: any, metadata?: LogEntry['metadata']): void {
    this.log('debug', source, action, data, metadata);
  }

  /**
   * Write entry to appropriate log file
   */
  private writeToFile(source: string, entry: LogEntry): void {
    try {
      const logFile = this.getLogFile(source);
      const logLine = JSON.stringify(entry) + '\n';
      
      fs.appendFileSync(logFile, logLine);
      this.rotateLogIfNeeded(logFile);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Write entry to console with formatting
   */
  private writeToConsole(entry: LogEntry): void {
    const color = this.getConsoleColor(entry.level);
    const prefix = `${color}[${entry.level.toUpperCase()}]${'\x1b[0m'}`;
    const message = `${prefix} ${entry.source}:${entry.action}`;
    
    if (entry.data) {
      console.log(message, entry.data);
    } else {
      console.log(message);
    }
  }

  /**
   * Get console color for log level
   */
  private getConsoleColor(level: LogEntry['level']): string {
    switch (level) {
      case 'error': return '\x1b[31m'; // red
      case 'warn': return '\x1b[33m';  // yellow
      case 'info': return '\x1b[36m';  // cyan
      case 'debug': return '\x1b[90m'; // gray
      default: return '\x1b[0m';       // reset
    }
  }

  /**
   * Get log file path for source
   */
  private getLogFile(source: string): string {
    if (!this.logFiles.has(source)) {
      const fileName = `${source}.log`;
      const filePath = path.join(this.config.logDir, fileName);
      this.logFiles.set(source, filePath);
    }
    return this.logFiles.get(source)!;
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  /**
   * Check if we should log at this level
   */
  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Rotate log file if it exceeds max size
   */
  private rotateLogIfNeeded(logFile: string): void {
    try {
      const stats = fs.statSync(logFile);
      if (stats.size > this.config.maxFileSize) {
        this.rotateLogFile(logFile);
      }
    } catch (error) {
      // File doesn't exist or can't be accessed, ignore
    }
  }

  /**
   * Rotate log file by renaming with timestamp
   */
  private rotateLogFile(logFile: string): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedFile = logFile.replace('.log', `-${timestamp}.log`);
      
      fs.renameSync(logFile, rotatedFile);
      this.cleanupOldLogs(path.dirname(logFile));
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  /**
   * Clean up old log files beyond max count
   */
  private cleanupOldLogs(logDir: string): void {
    try {
      const files = fs.readdirSync(logDir)
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(logDir, file),
          mtime: fs.statSync(path.join(logDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Keep only the most recent files
      if (files.length > this.config.maxFiles) {
        const filesToDelete = files.slice(this.config.maxFiles);
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }
}

// Global logger instance
let globalLogger: Logger | null = null;

/**
 * Get or create global logger instance
 */
export function getLogger(config?: Partial<LoggerConfig>): Logger {
  if (!globalLogger || config) {
    globalLogger = new Logger(config);
  }
  return globalLogger;
}

/**
 * Convenience functions for quick logging
 */
export const log = {
  info: (source: string, action: string, data?: any, metadata?: LogEntry['metadata']) => 
    getLogger().info(source, action, data, metadata),
  
  warn: (source: string, action: string, data?: any, metadata?: LogEntry['metadata']) => 
    getLogger().warn(source, action, data, metadata),
    
  error: (source: string, action: string, data?: any, metadata?: LogEntry['metadata']) => 
    getLogger().error(source, action, data, metadata),
    
  debug: (source: string, action: string, data?: any, metadata?: LogEntry['metadata']) => 
    getLogger().debug(source, action, data, metadata),
};

/**
 * Agent-specific logger factories
 */
export const createAgentLogger = (agentName: string) => ({
  info: (action: string, data?: any, metadata?: LogEntry['metadata']) => 
    log.info(agentName, action, data, metadata),
    
  warn: (action: string, data?: any, metadata?: LogEntry['metadata']) => 
    log.warn(agentName, action, data, metadata),
    
  error: (action: string, data?: any, metadata?: LogEntry['metadata']) => 
    log.error(agentName, action, data, metadata),
    
  debug: (action: string, data?: any, metadata?: LogEntry['metadata']) => 
    log.debug(agentName, action, data, metadata),
});

/**
 * Performance timing utility
 */
export function withTiming<T>(
  source: string, 
  action: string, 
  fn: () => T | Promise<T>,
  metadata?: Omit<LogEntry['metadata'], 'duration'>
): Promise<T> {
  const startTime = Date.now();
  
  const logCompletion = (duration: number, error?: Error) => {
    const finalMetadata = { ...metadata, duration };
    
    if (error) {
      log.error(source, `${action}_failed`, { error: error.message }, finalMetadata);
    } else {
      log.info(source, `${action}_completed`, undefined, finalMetadata);
    }
  };

  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result
        .then(value => {
          logCompletion(Date.now() - startTime);
          return value;
        })
        .catch(error => {
          logCompletion(Date.now() - startTime, error);
          throw error;
        });
    } else {
      logCompletion(Date.now() - startTime);
      return Promise.resolve(result);
    }
  } catch (error) {
    logCompletion(Date.now() - startTime, error as Error);
    throw error;
  }
}