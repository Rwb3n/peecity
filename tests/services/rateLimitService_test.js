/**
 * RateLimitService Unit Tests
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Fast, isolated tests for RateLimitService business logic.
 * Tests rate limiting logic, IP tracking, and statistics.
 */

const { RateLimitService } = require('../../src/services/rateLimitService');

// Mock the underlying rate limit utility
jest.mock('../../src/utils/rateLimit', () => ({
  checkRateLimit: jest.fn(),
  recordSubmission: jest.fn(),
  extractIPAddress: jest.fn(),
  getRateLimitStats: jest.fn()
}));

const mockRateLimit = require('../../src/utils/rateLimit');

describe('RateLimitService (Unit)', () => {
  let rateLimitService;
  let mockRequest;

  beforeEach(() => {
    rateLimitService = new RateLimitService();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock request
    mockRequest = {
      headers: new Map([['x-forwarded-for', '192.168.1.1']]),
      get: jest.fn((header) => {
        const headers = {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.1'
        };
        return headers[header.toLowerCase()];
      })
    };
  });

  describe('checkRateLimit', () => {
    it('should allow request when under rate limit', async () => {
      // Mock rate limit check to return allowed
      mockRateLimit.extractIPAddress.mockReturnValue('192.168.1.1');
      mockRateLimit.checkRateLimit.mockReturnValue({
        allowed: true,
        info: {
          submissions: 2,
          maxSubmissions: 5,
          windowDuration: 3600000
        }
      });

      const result = await rateLimitService.checkRateLimit({
        request: mockRequest
      });

      expect(result.allowed).toBe(true);
      expect(result.ipAddress).toBe('192.168.1.1');
      expect(result.submissions).toBeDefined();
      expect(result.maxSubmissions).toBeDefined();
      expect(result.windowDuration).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(mockRateLimit.extractIPAddress).toHaveBeenCalledWith(mockRequest);
      expect(mockRateLimit.checkRateLimit).toHaveBeenCalledWith('192.168.1.1');
    });

    it('should block request when rate limit exceeded', async () => {
      // Mock rate limit check to return blocked
      mockRateLimit.extractIPAddress.mockReturnValue('192.168.1.1');
      mockRateLimit.checkRateLimit.mockReturnValue({
        allowed: false,
        info: {
          currentSubmissions: 5,
          maxSubmissions: 5,
          resetTime: Date.now() + 3600000,
          remainingSubmissions: 0
        }
      });

      const result = await rateLimitService.checkRateLimit({
        request: mockRequest
      });

      expect(result.allowed).toBe(false);
      expect(result.ipAddress).toBe('192.168.1.1');
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('rate_limited');
      expect(result.error.statusCode).toBe(429);
    });

    it('should handle IP extraction errors gracefully', async () => {
      // Mock IP extraction to throw error
      mockRateLimit.extractIPAddress.mockImplementation(() => {
        throw new Error('Unable to extract IP');
      });

      const result = await rateLimitService.checkRateLimit({
        request: mockRequest
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('server_error');
    });

    it('should handle rate limit check errors gracefully', async () => {
      // Mock successful IP extraction but rate limit check error
      mockRateLimit.extractIPAddress.mockReturnValue('192.168.1.1');
      mockRateLimit.checkRateLimit.mockImplementation(() => {
        throw new Error('Rate limit check failed');
      });

      const result = await rateLimitService.checkRateLimit({
        request: mockRequest
      });

      expect(result.allowed).toBe(false);
      expect(result.ipAddress).toBe('unknown'); // Error case returns unknown
      expect(result.error).toBeDefined();
    });
  });

  describe('recordSubmission', () => {
    it('should record submission successfully', async () => {
      mockRateLimit.recordSubmission.mockImplementation(() => {
        // Mock successful recording
      });

      await expect(rateLimitService.recordSubmission('192.168.1.1'))
        .resolves
        .not.toThrow();

      expect(mockRateLimit.recordSubmission).toHaveBeenCalledWith('192.168.1.1');
    });

    it('should handle recording errors gracefully', async () => {
      mockRateLimit.recordSubmission.mockImplementation(() => {
        throw new Error('Recording failed');
      });

      // Should not throw error - logging failure shouldn't block submission
      await expect(rateLimitService.recordSubmission('192.168.1.1'))
        .resolves
        .not.toThrow();
    });
  });

  describe('getStatistics', () => {
    it('should return rate limiting statistics', () => {
      // Mock rate limit stats
      mockRateLimit.getRateLimitStats.mockReturnValue({
        totalIPs: 10,
        totalSubmissions: 25
      });

      const stats = rateLimitService.getStatistics();

      expect(stats).toMatchObject({
        activeIPs: 10,
        totalSubmissions: 25,
        config: {
          maxSubmissions: expect.any(Number),
          windowDurationMs: expect.any(Number)
        }
      });
      expect(mockRateLimit.getRateLimitStats).toHaveBeenCalled();
    });

    it('should handle statistics errors gracefully', () => {
      // Mock stats function to throw error
      mockRateLimit.getRateLimitStats.mockImplementation(() => {
        throw new Error('Stats unavailable');
      });

      // Should not throw - return safe defaults
      expect(() => rateLimitService.getStatistics()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle various IP formats', async () => {
      const testIPs = ['127.0.0.1', '::1', '192.168.1.100', '10.0.0.1'];
      
      for (const ip of testIPs) {
        mockRateLimit.extractIPAddress.mockReturnValue(ip);
        mockRateLimit.checkRateLimit.mockReturnValue({
          allowed: true,
          info: { currentSubmissions: 1, maxSubmissions: 5, resetTime: Date.now() + 3600000, remainingSubmissions: 4 }
        });

        const result = await rateLimitService.checkRateLimit({
          request: mockRequest
        });

        expect(result.ipAddress).toBe(ip);
        expect(result.allowed).toBe(true);
      }
    });

    it('should handle missing request object', async () => {
      const result = await rateLimitService.checkRateLimit({
        request: null
      });

      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});