/**
 * ValidationService Unit Tests
 * 
 * @doc refs docs/architecture-spec.md#suggest-agent
 * 
 * Fast, isolated tests for ValidationService business logic.
 * Tests validation rules, error handling, and data sanitization.
 */

const { ValidationService } = require('../../src/services/validationService');

describe('ValidationService (Unit)', () => {
  let validationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validateRequest', () => {
    it('should validate a correct suggestion request', async () => {
      const body = JSON.stringify({
        lat: 51.5074,
        lng: -0.1278,
        name: 'Test Toilet',
        hours: '24/7',
        accessible: true,
        fee: 0
      });

      const result = await validationService.validateRequest({
        body,
        ipAddress: '127.0.0.1'
      });

      expect(result.isValid).toBe(true);
      expect(result.suggestionId).toBeDefined();
      expect(result.sanitizedData).toMatchObject({
        lat: 51.5074,
        lng: -0.1278,
        name: 'Test Toilet',
        hours: '24/7',
        accessible: true,
        fee: 0
      });
      expect(result.validation.isValid).toBe(true);
      expect(result.validation.errors).toHaveLength(0);
    });

    it('should reject request with invalid JSON', async () => {
      const body = '{ invalid json ';

      const result = await validationService.validateRequest({
        body,
        ipAddress: '127.0.0.1'
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('invalid_json');
    });

    it('should reject request with missing required fields', async () => {
      const body = JSON.stringify({
        name: 'Test Toilet'
        // Missing lat/lng
      });

      const result = await validationService.validateRequest({
        body,
        ipAddress: '127.0.0.1'
      });

      expect(result.isValid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(0);
      expect(result.validation.errors.some(e => e.field === 'lat')).toBe(true);
      expect(result.validation.errors.some(e => e.field === 'lng')).toBe(true);
    });

    it('should reject request with invalid coordinates', async () => {
      const body = JSON.stringify({
        lat: 91, // Invalid latitude
        lng: -181, // Invalid longitude
        name: 'Test Toilet'
      });

      const result = await validationService.validateRequest({
        body,
        ipAddress: '127.0.0.1'
      });

      expect(result.isValid).toBe(false);
      expect(result.validation.errors.some(e => e.field === 'lat')).toBe(true);
      expect(result.validation.errors.some(e => e.field === 'lng')).toBe(true);
    });

    it('should sanitize and apply defaults to valid data', async () => {
      const body = JSON.stringify({
        lat: 51.5074,
        lng: -0.1278,
        name: '  Test Toilet  ', // Should be trimmed
        accessible: true,
        fee: 1.5
      });

      const result = await validationService.validateRequest({
        body,
        ipAddress: '127.0.0.1'
      });

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData.name).toBe('Test Toilet');
      expect(result.sanitizedData.accessible).toBe(true);
      expect(result.sanitizedData.fee).toBe(1.5);
      expect(result.sanitizedData.hours).toBeUndefined(); // No hours field provided
    });

    it('should handle edge case coordinates', async () => {
      const body = JSON.stringify({
        lat: 0,
        lng: 0,
        name: 'Null Island Toilet'
      });

      const result = await validationService.validateRequest({
        body,
        ipAddress: '127.0.0.1'
      });

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData.lat).toBe(0);
      expect(result.sanitizedData.lng).toBe(0);
    });

    it('should generate unique suggestion IDs', async () => {
      const body = JSON.stringify({
        lat: 51.5074,
        lng: -0.1278,
        name: 'Test Toilet'
      });

      const result1 = await validationService.validateRequest({
        body,
        ipAddress: '127.0.0.1'
      });

      const result2 = await validationService.validateRequest({
        body,
        ipAddress: '127.0.0.1'
      });

      expect(result1.suggestionId).not.toBe(result2.suggestionId);
    });

    it('should handle empty request body', async () => {
      const result = await validationService.validateRequest({
        body: '',
        ipAddress: '127.0.0.1'
      });

      expect(result.isValid).toBe(false);
      expect(result.error.code).toBe('missing_body');
    });

    it('should validate special characters in name field', async () => {
      const body = JSON.stringify({
        lat: 51.5074,
        lng: -0.1278,
        name: 'Café & Restaurant Toilets (Main St.)'
      });

      const result = await validationService.validateRequest({
        body,
        ipAddress: '127.0.0.1'
      });

      expect(result.isValid).toBe(true);
      expect(result.sanitizedData.name).toBe('Café & Restaurant Toilets (Main St.)');
    });
  });
});