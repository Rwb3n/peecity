/**
 * @fileoverview Unit tests for SuggestPayloadTransformer service
 * Ensures 100% test coverage and validates all transformation scenarios
 */

const { SuggestPayloadTransformer } = require('../../src/services/SuggestPayloadTransformer');

describe('SuggestPayloadTransformer', () => {
  let transformer;
  
  beforeEach(() => {
    transformer = new SuggestPayloadTransformer();
  });
  
  describe('transformToV1Payload', () => {
    const baseFormData = {
      name: 'Test Toilet',
      lat: 51.5074,
      lng: -0.1278,
      hours: '24/7',
      accessible: true,
      fee: 0.50,
      features: {
        babyChange: false,
        radar: false,
        automatic: false,
        contactless: false,
      },
    };
    
    it('should transform basic form data to v1 payload', () => {
      const result = transformer.transformToV1Payload(baseFormData);
      
      expect(result).toEqual({
        name: 'Test Toilet',
        lat: 51.5074,
        lng: -0.1278,
        hours: '24/7',
        accessible: true,
        fee: 0.50,
      });
    });
    
    it('should handle custom hours correctly', () => {
      const formData = {
        ...baseFormData,
        hours: 'custom',
        customHours: 'Mo-Fr 08:00-18:00',
      };
      
      const result = transformer.transformToV1Payload(formData);
      
      expect(result.hours).toBe('Mo-Fr 08:00-18:00');
    });
    
    it('should handle missing hours with empty string', () => {
      const formData = {
        ...baseFormData,
        hours: undefined,
      };
      
      const result = transformer.transformToV1Payload(formData);
      
      expect(result.hours).toBe('');
    });
    
    it('should include changing_table when babyChange is true', () => {
      const formData = {
        ...baseFormData,
        features: {
          ...baseFormData.features,
          babyChange: true,
        },
      };
      
      const result = transformer.transformToV1Payload(formData);
      
      expect(result.changing_table).toBe(true);
    });
    
    it('should include payment_contactless when contactless is true', () => {
      const formData = {
        ...baseFormData,
        features: {
          ...baseFormData.features,
          contactless: true,
        },
      };
      
      const result = transformer.transformToV1Payload(formData);
      
      expect(result.payment_contactless).toBe(true);
    });
    
    it('should include both feature fields when both are true', () => {
      const formData = {
        ...baseFormData,
        features: {
          ...baseFormData.features,
          babyChange: true,
          contactless: true,
        },
      };
      
      const result = transformer.transformToV1Payload(formData);
      
      expect(result.changing_table).toBe(true);
      expect(result.payment_contactless).toBe(true);
    });
    
    it('should not include feature fields when false', () => {
      const result = transformer.transformToV1Payload(baseFormData);
      
      expect(result.changing_table).toBeUndefined();
      expect(result.payment_contactless).toBeUndefined();
    });
    
    it('should ignore radar and automatic features for v1', () => {
      const formData = {
        ...baseFormData,
        features: {
          babyChange: false,
          radar: true,
          automatic: true,
          contactless: false,
        },
      };
      
      const result = transformer.transformToV1Payload(formData);
      
      expect(result).not.toHaveProperty('radar');
      expect(result).not.toHaveProperty('automatic');
    });
    
    it('should handle missing features object gracefully', () => {
      const formData = {
        ...baseFormData,
        features: undefined,
      };
      
      const result = transformer.transformToV1Payload(formData);
      
      expect(result.changing_table).toBeUndefined();
      expect(result.payment_contactless).toBeUndefined();
    });
  });
  
  describe('transformToV2Payload', () => {
    const baseFormData = {
      name: 'Test Toilet',
      lat: 51.5074,
      lng: -0.1278,
      hours: '24/7',
      accessible: true,
      fee: 0.50,
      features: {
        babyChange: false,
        radar: false,
        automatic: false,
        contactless: false,
      },
    };
    
    beforeEach(() => {
      // Mock Date.now() for consistent @id generation
      jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });
    
    it('should include all required core fields', () => {
      const result = transformer.transformToV2Payload(baseFormData);
      
      expect(result).toHaveProperty('@id', 'node/temp_1234567890');
      expect(result).toHaveProperty('amenity', 'toilets');
      expect(result).toHaveProperty('lat', 51.5074);
      expect(result).toHaveProperty('lng', -0.1278);
      expect(result).toHaveProperty('wheelchair', 'yes');
      expect(result).toHaveProperty('access', 'yes');
      expect(result).toHaveProperty('opening_hours', '24/7');
      expect(result).toHaveProperty('fee', true);
    });
    
    it('should map accessible=false to wheelchair=no', () => {
      const formData = {
        ...baseFormData,
        accessible: false,
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.wheelchair).toBe('no');
    });
    
    it('should default wheelchair to unknown when accessible is undefined', () => {
      const formData = {
        ...baseFormData,
        accessible: undefined,
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.wheelchair).toBe('unknown');
    });
    
    it('should convert numeric fee to boolean (true when > 0)', () => {
      const formData = {
        ...baseFormData,
        fee: 2.50,
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.fee).toBe(true);
    });
    
    it('should convert zero fee to false', () => {
      const formData = {
        ...baseFormData,
        fee: 0,
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.fee).toBe(false);
    });
    
    it('should include name when provided', () => {
      const result = transformer.transformToV2Payload(baseFormData);
      
      expect(result.name).toBe('Test Toilet');
    });
    
    it('should not include name when empty', () => {
      const formData = {
        ...baseFormData,
        name: '',
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.name).toBeUndefined();
    });
    
    it('should trim whitespace from name', () => {
      const formData = {
        ...baseFormData,
        name: '  Test Toilet with Spaces  ',
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.name).toBe('Test Toilet with Spaces');
    });
    
    it('should not include name when only whitespace', () => {
      const formData = {
        ...baseFormData,
        name: '   ',
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.name).toBeUndefined();
    });
    
    it('should map babyChange to changing_table with yes/no strings', () => {
      const formData = {
        ...baseFormData,
        features: {
          ...baseFormData.features,
          babyChange: true,
        },
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.changing_table).toBe('yes');
    });
    
    it('should map contactless to payment:contactless with yes/no strings', () => {
      const formData = {
        ...baseFormData,
        features: {
          ...baseFormData.features,
          contactless: true,
        },
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result['payment:contactless']).toBe('yes');
    });
    
    it('should include default gender fields', () => {
      const result = transformer.transformToV2Payload(baseFormData);
      
      expect(result.male).toBe('yes');
      expect(result.female).toBe('yes');
      expect(result.unisex).toBe('no');
    });
    
    it('should map business hours correctly', () => {
      const formData = {
        ...baseFormData,
        hours: 'business',
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.opening_hours).toBe('Mo-Fr 09:00-17:00');
    });
    
    it('should map dawn_to_dusk hours correctly', () => {
      const formData = {
        ...baseFormData,
        hours: 'dawn_to_dusk',
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.opening_hours).toBe('sunrise-sunset');
    });
    
    it('should handle custom hours', () => {
      const formData = {
        ...baseFormData,
        hours: 'custom',
        customHours: 'Mo-Su 06:00-22:00',
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.opening_hours).toBe('Mo-Su 06:00-22:00');
    });
    
    it('should default to 24/7 for unknown hours', () => {
      const formData = {
        ...baseFormData,
        hours: 'unknown_value',
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.opening_hours).toBe('24/7');
    });
    
    it('should default to 24/7 when hours is undefined', () => {
      const formData = {
        ...baseFormData,
        hours: undefined,
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.opening_hours).toBe('24/7');
    });
    
    it('should default to 24/7 when hours is empty string', () => {
      const formData = {
        ...baseFormData,
        hours: '',
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.opening_hours).toBe('24/7');
    });
    
    it('should default to 24/7 when custom is selected but no customHours provided', () => {
      const formData = {
        ...baseFormData,
        hours: 'custom',
        customHours: '',
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.opening_hours).toBe('24/7');
    });
    
    it('should trim whitespace from custom hours', () => {
      const formData = {
        ...baseFormData,
        hours: 'custom',
        customHours: '  Mo-Fr 09:00-18:00  ',
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.opening_hours).toBe('Mo-Fr 09:00-18:00');
    });
    
    it('should handle dawn to dusk with space', () => {
      const formData = {
        ...baseFormData,
        hours: 'dawn to dusk',
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.opening_hours).toBe('sunrise-sunset');
    });
    
    it('should handle missing features gracefully', () => {
      const formData = {
        ...baseFormData,
        features: undefined,
      };
      
      const result = transformer.transformToV2Payload(formData);
      
      expect(result.changing_table).toBeUndefined();
      expect(result['payment:contactless']).toBeUndefined();
    });
  });
  
  describe('Edge cases and error handling', () => {
    it('should handle minimal form data for v1', () => {
      const minimalData = {
        name: 'Minimal',
        lat: 0,
        lng: 0,
        accessible: false,
        fee: 0,
        features: {
          babyChange: false,
          radar: false,
          automatic: false,
          contactless: false,
        },
      };
      
      const result = transformer.transformToV1Payload(minimalData);
      
      expect(result).toBeDefined();
      expect(result.name).toBe('Minimal');
      expect(result.hours).toBe('');
    });
    
    it('should handle minimal form data for v2', () => {
      const minimalData = {
        name: '',
        lat: 0,
        lng: 0,
        accessible: false,
        fee: 0,
        features: {
          babyChange: false,
          radar: false,
          automatic: false,
          contactless: false,
        },
      };
      
      const result = transformer.transformToV2Payload(minimalData);
      
      expect(result).toBeDefined();
      expect(result['@id']).toMatch(/^node\/temp_/);
      expect(result.amenity).toBe('toilets');
      expect(result.wheelchair).toBe('no');
      expect(result.access).toBe('yes');
      expect(result.opening_hours).toBe('24/7');
      expect(result.fee).toBe(false);
    });
    
    it('should ensure all core fields are present even with undefined values', () => {
      const incompleteData = {
        name: undefined,
        lat: 51.5,
        lng: -0.1,
        accessible: undefined,
        fee: undefined,
        hours: undefined,
        features: undefined,
      };
      
      const result = transformer.transformToV2Payload(incompleteData);
      
      // All 8 core fields must be present
      expect(result).toHaveProperty('@id');
      expect(result).toHaveProperty('amenity', 'toilets');
      expect(result).toHaveProperty('lat', 51.5);
      expect(result).toHaveProperty('lng', -0.1);
      expect(result).toHaveProperty('wheelchair', 'unknown'); // Smart default
      expect(result).toHaveProperty('access', 'yes');
      expect(result).toHaveProperty('opening_hours', '24/7'); // Smart default
      expect(result).toHaveProperty('fee', false); // undefined fee = 0 = false
    });
  });
  
  describe('Validation of v1 backward compatibility', () => {
    it('should produce identical v1 output to current implementation', () => {
      // This test ensures v1 transformations match the current mapFeaturesToApi logic
      const testCases = [
        {
          input: {
            name: 'Victoria Station',
            lat: 51.4952,
            lng: -0.1439,
            hours: '24/7',
            accessible: true,
            fee: 0.50,
            features: {
              babyChange: true,
              radar: false,
              automatic: false,
              contactless: true,
            },
          },
          expected: {
            name: 'Victoria Station',
            lat: 51.4952,
            lng: -0.1439,
            hours: '24/7',
            accessible: true,
            fee: 0.50,
            changing_table: true,
            payment_contactless: true,
          },
        },
        {
          input: {
            name: 'Hyde Park',
            lat: 51.5073,
            lng: -0.1657,
            hours: 'dawn_to_dusk',
            accessible: false,
            fee: 0,
            features: {
              babyChange: false,
              radar: true,
              automatic: true,
              contactless: false,
            },
          },
          expected: {
            name: 'Hyde Park',
            lat: 51.5073,
            lng: -0.1657,
            hours: 'dawn_to_dusk',
            accessible: false,
            fee: 0,
          },
        },
      ];
      
      testCases.forEach(({ input, expected }) => {
        const result = transformer.transformToV1Payload(input);
        expect(result).toEqual(expected);
      });
    });
  });
});