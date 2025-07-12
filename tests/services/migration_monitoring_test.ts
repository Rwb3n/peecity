/**
 * @fileoverview Tests for v1/v2 migration monitoring
 * @artifact plan_contributionform_v2_migration_0066_task_create_migration_monitoring
 * @tdd-phase Green
 * 
 * Tests that API version tracking works correctly in logging and monitoring systems
 */

import { SuggestionLogService } from '@/services/suggestionLogService';
import { createFileLogWriter } from '@/utils/fileLogWriter';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock the fileLogWriter module
jest.mock('@/utils/fileLogWriter', () => ({
  createFileLogWriter: jest.fn()
}));

// Mock the logger module
jest.mock('@/utils/logger', () => ({
  createAgentLogger: jest.fn().mockReturnValue({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  })
}));

describe('Migration Monitoring', () => {
  let suggestionLogService: SuggestionLogService;
  let mockLogWriter: any;
  let appendedJsonEntries: any[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    appendedJsonEntries = [];

    // Mock the log writer
    mockLogWriter = {
      appendJson: jest.fn().mockImplementation((entry) => {
        appendedJsonEntries.push(entry);
        return Promise.resolve();
      }),
      exists: jest.fn().mockResolvedValue(true),
      getStats: jest.fn().mockResolvedValue({
        mtime: new Date(),
        size: 1024
      }),
      getFilePath: jest.fn().mockReturnValue('/tmp/suggestions.log')
    };

    // Mock createFileLogWriter to return our mock
    (createFileLogWriter as jest.Mock).mockReturnValue(mockLogWriter);

    // Create service instance
    suggestionLogService = new SuggestionLogService();
  });

  describe('API Version Tracking', () => {
    it('should log v1 API version for successful submissions', async () => {
      const mockSuggestion = {
        id: 'test-123',
        name: 'Test Toilet',
        lat: 51.5,
        lng: -0.1,
        submitted_at: new Date().toISOString(),
        status: 'pending' as const
      };

      const mockValidation = {
        isValid: true,
        errors: [],
        warnings: [],
        isDuplicate: false
      };

      await suggestionLogService.logSuccessfulSubmission(
        mockSuggestion,
        mockValidation,
        '192.168.1.1',
        'v1'
      );

      expect(mockLogWriter.appendJson).toHaveBeenCalledTimes(1);
      const logEntry = appendedJsonEntries[0];
      expect(logEntry.apiVersion).toBe('v1');
      expect(logEntry.action).toBe('submitted');
      expect(logEntry.suggestionId).toBe('test-123');
    });

    it('should log v2 API version for successful submissions', async () => {
      const mockSuggestion = {
        id: 'test-456',
        name: 'Test Toilet v2',
        lat: 51.5,
        lng: -0.1,
        submitted_at: new Date().toISOString(),
        status: 'pending' as const
      };

      const mockValidation = {
        isValid: true,
        errors: [],
        warnings: [],
        isDuplicate: false
      };

      await suggestionLogService.logSuccessfulSubmission(
        mockSuggestion,
        mockValidation,
        '192.168.1.2',
        'v2'
      );

      expect(mockLogWriter.appendJson).toHaveBeenCalledTimes(1);
      const logEntry = appendedJsonEntries[0];
      expect(logEntry.apiVersion).toBe('v2');
      expect(logEntry.action).toBe('submitted');
      expect(logEntry.suggestionId).toBe('test-456');
    });

    it('should default to v1 when apiVersion not specified', async () => {
      const mockSuggestion = {
        id: 'test-789',
        name: 'Test Toilet Default',
        lat: 51.5,
        lng: -0.1,
        submitted_at: new Date().toISOString(),
        status: 'pending' as const
      };

      const mockValidation = {
        isValid: true,
        errors: [],
        warnings: [],
        isDuplicate: false
      };

      await suggestionLogService.logSuccessfulSubmission(
        mockSuggestion,
        mockValidation,
        '192.168.1.3'
        // apiVersion parameter omitted
      );

      expect(mockLogWriter.appendJson).toHaveBeenCalledTimes(1);
      const logEntry = appendedJsonEntries[0];
      expect(logEntry.apiVersion).toBe('v1'); // Should default to v1
    });

    it('should track API version for validation failures', async () => {
      const mockValidation = {
        isValid: false,
        errors: [{ field: 'name', message: 'Name required', code: 'required' as const }],
        warnings: [],
        isDuplicate: false
      };

      await suggestionLogService.logValidationFailure(
        'fail-123',
        { lat: 51.5, lng: -0.1 },
        mockValidation,
        '192.168.1.4',
        'v2'
      );

      expect(mockLogWriter.appendJson).toHaveBeenCalledTimes(1);
      const logEntry = appendedJsonEntries[0];
      expect(logEntry.apiVersion).toBe('v2');
      expect(logEntry.action).toBe('validation_failed');
    });

    it('should track API version for duplicate detections', async () => {
      const mockValidation = {
        isValid: true,
        errors: [],
        warnings: [],
        isDuplicate: true,
        duplicateDistance: 50,
        nearestToiletId: 'existing-123'
      };

      await suggestionLogService.logDuplicateDetection(
        'dup-123',
        { name: 'Duplicate', lat: 51.5, lng: -0.1 },
        mockValidation,
        '192.168.1.5',
        'v2'
      );

      expect(mockLogWriter.appendJson).toHaveBeenCalledTimes(1);
      const logEntry = appendedJsonEntries[0];
      expect(logEntry.apiVersion).toBe('v2');
      expect(logEntry.action).toBe('duplicate_detected');
    });

    it('should track API version for rate limit events', async () => {
      const mockValidation = {
        isValid: false,
        errors: [{ field: 'rate_limit', message: 'Too many submissions', code: 'rate_limited' as const }],
        warnings: [],
        isDuplicate: false
      };

      await suggestionLogService.logRateLimitExceeded(
        '192.168.1.6',
        mockValidation,
        'v1'
      );

      expect(mockLogWriter.appendJson).toHaveBeenCalledTimes(1);
      const logEntry = appendedJsonEntries[0];
      expect(logEntry.apiVersion).toBe('v1');
      expect(logEntry.action).toBe('rate_limited');
    });

    it('should track API version for server errors', async () => {
      const mockError = new Error('Database connection failed');

      await suggestionLogService.logServerError(
        mockError,
        '192.168.1.7',
        'v2'
      );

      expect(mockLogWriter.appendJson).toHaveBeenCalledTimes(1);
      const logEntry = appendedJsonEntries[0];
      expect(logEntry.apiVersion).toBe('v2');
      expect(logEntry.action).toBe('server_error');
    });
  });

  describe('Monitoring Data Structure', () => {
    it('should include all required fields in log entries', async () => {
      const mockSuggestion = {
        id: 'complete-123',
        name: 'Complete Test',
        lat: 51.5074,
        lng: -0.1278,
        hours: '24/7',
        accessible: true,
        fee: 0.50,
        submitted_at: new Date().toISOString(),
        status: 'pending' as const,
        ip_address: '192.168.1.8'
      };

      const mockValidation = {
        isValid: true,
        errors: [],
        warnings: [{ field: 'name', message: 'Name seems generic', code: 'unusual_value' as const }],
        isDuplicate: false
      };

      await suggestionLogService.logSuccessfulSubmission(
        mockSuggestion,
        mockValidation,
        '192.168.1.8',
        'v2'
      );

      const logEntry = appendedJsonEntries[0];
      
      // Verify all monitoring fields
      expect(logEntry).toMatchObject({
        timestamp: expect.any(String),
        suggestionId: 'complete-123',
        action: 'submitted',
        apiVersion: 'v2',
        data: expect.objectContaining({
          name: 'Complete Test',
          lat: 51.5074,
          lng: -0.1278,
          ip_address: '192.168.1.8'
        }),
        result: expect.objectContaining({
          isValid: true,
          warnings: expect.arrayContaining([
            expect.objectContaining({ field: 'name' })
          ])
        })
      });
    });
  });

  describe('Log Query Support', () => {
    it('should create logs that can be queried by API version', async () => {
      // Simulate multiple submissions with different versions
      const submissions = [
        { id: 'v1-1', version: 'v1' as const },
        { id: 'v2-1', version: 'v2' as const },
        { id: 'v1-2', version: 'v1' as const },
        { id: 'v2-2', version: 'v2' as const },
      ];

      for (const sub of submissions) {
        await suggestionLogService.logSuccessfulSubmission(
          {
            id: sub.id,
            name: `Test ${sub.id}`,
            lat: 51.5,
            lng: -0.1,
            submitted_at: new Date().toISOString(),
            status: 'pending'
          },
          { isValid: true, errors: [], warnings: [], isDuplicate: false },
          '192.168.1.9',
          sub.version
        );
      }

      // Verify all logs were created
      expect(appendedJsonEntries).toHaveLength(4);

      // Simulate querying logs by version
      const v1Logs = appendedJsonEntries.filter(log => log.apiVersion === 'v1');
      const v2Logs = appendedJsonEntries.filter(log => log.apiVersion === 'v2');

      expect(v1Logs).toHaveLength(2);
      expect(v2Logs).toHaveLength(2);
      expect(v1Logs.map(l => l.suggestionId)).toEqual(['v1-1', 'v1-2']);
      expect(v2Logs.map(l => l.suggestionId)).toEqual(['v2-1', 'v2-2']);
    });
  });
});