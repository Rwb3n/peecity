/**
 * File Log Writer Utility
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Low-level file operations for logging systems.
 * Provides atomic writes, directory creation, and error handling.
 */

import fs from 'fs';
import path from 'path';
import { createAgentLogger } from './logger';

/**
 * Configuration for file logging
 */
export interface FileLogConfig {
  filePath: string;
  createDirectories?: boolean;
  encoding?: BufferEncoding;
  appendNewline?: boolean;
}

/**
 * File log writer for atomic append operations
 */
export class FileLogWriter {
  private readonly config: Required<FileLogConfig>;
  private readonly logger = createAgentLogger('file-log-writer');

  constructor(config: FileLogConfig) {
    this.config = {
      createDirectories: true,
      encoding: 'utf8',
      appendNewline: true,
      ...config
    };
  }

  /**
   * Append data to the log file
   * @param data Data to append
   * @throws Error if write operation fails
   */
  async append(data: string): Promise<void> {
    try {
      // Ensure directory exists
      if (this.config.createDirectories) {
        await this.ensureDirectoryExists();
      }

      // Prepare data with optional newline
      const content = this.config.appendNewline ? `${data}\n` : data;

      // Perform atomic write
      await fs.promises.appendFile(this.config.filePath, content, {
        encoding: this.config.encoding
      });

      this.logger.debug('file_write_success', 'Data appended to file', {
        filePath: this.config.filePath,
        dataLength: content.length
      });

    } catch (error) {
      this.logger.error('file_write_error', 'Failed to append to file', {
        filePath: this.config.filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Append JSON data to the log file
   * @param data Object to serialize and append
   * @throws Error if serialization or write operation fails
   */
  async appendJson(data: any): Promise<void> {
    try {
      const jsonString = JSON.stringify(data);
      await this.append(jsonString);
      
      this.logger.debug('json_write_success', 'JSON data appended to file', {
        filePath: this.config.filePath,
        dataKeys: Object.keys(data)
      });

    } catch (error) {
      this.logger.error('json_write_error', 'Failed to append JSON to file', {
        filePath: this.config.filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Check if log file exists
   * @returns True if file exists
   */
  async exists(): Promise<boolean> {
    try {
      await fs.promises.access(this.config.filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats (size, modification time, etc.)
   * @returns File stats or null if file doesn't exist
   */
  async getStats(): Promise<fs.Stats | null> {
    try {
      return await fs.promises.stat(this.config.filePath);
    } catch {
      return null;
    }
  }

  /**
   * Get the configured file path
   * @returns File path
   */
  getFilePath(): string {
    return this.config.filePath;
  }

  /**
   * Ensure the directory for the log file exists
   * @private
   */
  private async ensureDirectoryExists(): Promise<void> {
    try {
      const directory = path.dirname(this.config.filePath);
      
      // Check if directory exists
      try {
        await fs.promises.access(directory, fs.constants.F_OK);
      } catch {
        // Directory doesn't exist, create it
        await fs.promises.mkdir(directory, { recursive: true });
        
        this.logger.debug('directory_created', 'Created directory for log file', {
          directory,
          filePath: this.config.filePath
        });
      }
    } catch (error) {
      this.logger.error('directory_creation_error', 'Failed to create directory', {
        directory: path.dirname(this.config.filePath),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

/**
 * Create a file log writer instance
 * @param config File logging configuration
 * @returns FileLogWriter instance
 */
export function createFileLogWriter(config: FileLogConfig): FileLogWriter {
  return new FileLogWriter(config);
}