/**
 * @fileoverview Payload transformation service for Suggest API v1 and v2
 * Handles the complex mapping logic between form data and API payload formats
 * @see {@link file://./docs/reference/api/suggest-api.md} for API specifications
 * @see {@link file://./docs/addendum_v2_migration_safety_gates.md} for migration safety requirements
 */

// Form data structure matching the ContributionForm schema
export interface ContributionFormData {
  name?: string;
  lat: number;
  lng: number;
  hours?: string;
  customHours?: string;
  accessible?: boolean;
  fee?: number;
  features?: {
    babyChange: boolean;
    radar: boolean;
    automatic: boolean;
    contactless: boolean;
  };
}

// v1 API payload structure
export interface SuggestV1Payload {
  name: string;
  lat: number;
  lng: number;
  hours: string;
  accessible: boolean;
  fee: number;
  // Optional feature fields
  changing_table?: boolean;
  payment_contactless?: boolean;
}

// v2 API payload structure with required core fields
export interface SuggestV2Payload {
  // Core required fields
  '@id': string;
  amenity: string;
  lat: number;
  lng: number;
  wheelchair: 'yes' | 'no' | 'limited' | 'unknown';
  access: 'yes' | 'customers' | 'private';
  opening_hours: string;
  fee: boolean;
  
  // Optional fields
  name?: string;
  changing_table?: 'yes' | 'no';
  'payment:contactless'?: 'yes' | 'no';
  male?: 'yes' | 'no';
  female?: 'yes' | 'no';
  unisex?: 'yes' | 'no';
}

/**
 * Service responsible for transforming form data to API payloads
 * Implements SOLID principles with single responsibility for payload transformation
 */
export class SuggestPayloadTransformer {
  /**
   * Transforms form data to v1 API payload format
   * Maintains backward compatibility with existing API
   */
  transformToV1Payload(formData: ContributionFormData): SuggestV1Payload {
    const payload: SuggestV1Payload = {
      name: formData.name || '',
      lat: formData.lat,
      lng: formData.lng,
      hours: formData.hours === 'custom' 
        ? (formData.customHours || '') 
        : (formData.hours || ''),
      accessible: formData.accessible || false,
      fee: formData.fee || 0,
    };

    // Add feature fields using the same logic as mapFeaturesToApi
    if (formData.features?.babyChange) {
      payload.changing_table = true;
    }
    
    if (formData.features?.contactless) {
      payload.payment_contactless = true;
    }
    
    // Note: radar and automatic are not supported in v1 API
    
    return payload;
  }

  /**
   * Transforms form data to v2 API payload format
   * Handles all required core fields and type conversions
   * Implements smart defaults strategy per plan_contributionform_v2_migration_0066
   */
  transformToV2Payload(formData: ContributionFormData): SuggestV2Payload {
    // Generate temporary ID for new submissions
    const tempId = `node/temp_${Date.now()}`;
    
    // Smart wheelchair default: 'unknown' when not explicitly set
    // This is safer than assuming 'no' for accessibility
    const wheelchairValue = this.mapAccessibleToWheelchair(formData.accessible);
    
    // Convert numeric fee to boolean (true if fee > 0)
    // Handle undefined/null fee values safely
    const hasFee = (formData.fee || 0) > 0;
    
    // Map hours to OSM opening_hours format with smart defaults
    const openingHours = this.mapToOpeningHours(formData.hours, formData.customHours);
    
    const payload: SuggestV2Payload = {
      // Required core fields with smart defaults
      '@id': tempId,
      amenity: 'toilets', // Always 'toilets' for this form
      lat: formData.lat,
      lng: formData.lng,
      wheelchair: wheelchairValue,
      access: 'yes', // Default to public access (reasonable for public toilet submission)
      opening_hours: openingHours,
      fee: hasFee,
    };
    
    // Add optional fields only when they have meaningful values
    if (formData.name && formData.name.trim()) {
      payload.name = formData.name.trim();
    }
    
    // Map features to v2 format (boolean → 'yes'/'no' strings)
    if (formData.features?.babyChange) {
      payload.changing_table = 'yes';
    }
    
    if (formData.features?.contactless) {
      payload['payment:contactless'] = 'yes';
    }
    
    // Add default gender fields for public toilets
    // Most public toilets have both male and female facilities
    payload.male = 'yes';
    payload.female = 'yes';
    payload.unisex = 'no';
    
    return payload;
  }
  
  /**
   * Maps accessible field to wheelchair values with smart defaults
   * @private
   */
  private mapAccessibleToWheelchair(accessible?: boolean): 'yes' | 'no' | 'limited' | 'unknown' {
    // If explicitly set, map directly
    if (accessible === true) return 'yes';
    if (accessible === false) return 'no';
    
    // Default to 'unknown' when not specified
    // This is safer than assuming 'no' for accessibility
    return 'unknown';
  }
  
  /**
   * Maps form hours selection to OSM opening_hours format
   * Implements smart defaults for missing or invalid values
   * @private
   */
  private mapToOpeningHours(hours?: string, customHours?: string): string {
    // Handle custom hours with validation
    if (hours === 'custom') {
      // Return custom hours if provided and non-empty
      if (customHours && customHours.trim()) {
        return customHours.trim();
      }
      // Fall back to 24/7 if custom was selected but no hours provided
      return '24/7';
    }
    
    // Handle predefined hour options
    switch (hours) {
      case '24/7':
        return '24/7';
      case 'business':
        return 'Mo-Fr 09:00-17:00';
      case 'dawn to dusk':
      case 'dawn_to_dusk':
        return 'sunrise-sunset';
      case '':
      case undefined:
      case null:
        // Default to 24/7 for missing hours
        // This is a reasonable default for public toilets
        return '24/7';
      default:
        // For any other value, default to 24/7
        // This ensures we always have valid opening_hours
        return '24/7';
    }
  }
}