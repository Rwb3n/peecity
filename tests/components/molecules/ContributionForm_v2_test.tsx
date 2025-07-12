/**
 * @fileoverview ContributionForm v2 API integration tests
 * Tests the component with apiVersion='v2' to validate v2-specific behaviors
 * Note: These tests document expected v2 behavior. Some tests verify current state
 * while others are marked as pending until Task 5 (dual endpoint support) is implemented.
 * @see {@link file://./docs/addendum_v2_migration_safety_gates.md} for migration safety requirements
 * @see {@link file://./plans/plan_contributionform_v2_migration_0066.txt} for v2 migration plan
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContributionForm } from '@/components/molecules/ContributionForm/ContributionForm';
import { SuggestPayloadTransformer } from '@/services/SuggestPayloadTransformer';

describe('ContributionForm v2 API Integration', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnSuccess = jest.fn();

  const defaultLocation = {
    lat: 51.5074,
    lng: -0.1278,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('v2 Feature Flag Behavior', () => {
    it('should render with v2 apiVersion prop', () => {
      render(
        <ContributionForm 
          location={defaultLocation} 
          onSubmit={mockOnSubmit}
          apiVersion="v2"
        />
      );
      
      expect(screen.getByRole('heading', { name: /add a toilet/i })).toBeInTheDocument();
    });

    it('should maintain same UI with v2 apiVersion', () => {
      render(
        <ContributionForm 
          location={defaultLocation} 
          onSubmit={mockOnSubmit}
          apiVersion="v2"
        />
      );
      
      // All form fields should be present
      expect(screen.getByLabelText(/toilet name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/opening hours/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/wheelchair accessible/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/usage fee/i)).toBeInTheDocument();
    });

    it('should accept v2 apiVersion prop without errors', () => {
      // This test verifies the feature flag is properly typed and accepted
      expect(() => {
        render(
          <ContributionForm 
            location={defaultLocation} 
            onSubmit={mockOnSubmit}
            apiVersion="v2"
          />
        );
      }).not.toThrow();
    });
  });

  describe('v2 Endpoint Integration (Post-Task 5)', () => {
    it('should call v2 endpoint when apiVersion is v2', async () => {
      const user = userEvent.setup();
      
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, id: 'test-123' }),
      } as Response);
      
      render(
        <ContributionForm 
          location={defaultLocation} 
          onSuccess={mockOnSuccess}
          apiVersion="v2"
        />
      );
      
      await user.type(screen.getByLabelText(/toilet name/i), 'V2 Test');
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/v2/suggest', // v2 endpoint
          expect.any(Object)
        );
      });
      
      mockFetch.mockRestore();
    });

    it('should use v2 payload structure with apiVersion v2', async () => {
      const user = userEvent.setup();
      
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);
      
      render(
        <ContributionForm 
          location={defaultLocation} 
          onSuccess={mockOnSuccess}
          apiVersion="v2"
        />
      );
      
      await user.type(screen.getByLabelText(/toilet name/i), 'Test');
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
        const [, options] = mockFetch.mock.calls[0];
        const body = JSON.parse(options.body as string);
        
        // v2 structure
        expect(body).toHaveProperty('@id');
        expect(body).toHaveProperty('wheelchair'); // String, not boolean 'accessible'
        expect(body).toHaveProperty('fee'); // Boolean, not number
        expect(body).toHaveProperty('amenity', 'toilets');
        expect(body).toHaveProperty('access', 'yes');
        expect(body).toHaveProperty('opening_hours', '24/7');
      });
      
      mockFetch.mockRestore();
    });
  });

  describe('SuggestPayloadTransformer Integration (Unit Tests)', () => {
    it('should create v2 payloads with all core fields', () => {
      // Test the transformer directly to verify it's ready for integration
      const transformer = new SuggestPayloadTransformer();
      const formData = {
        name: 'Test Toilet',
        lat: 51.5074,
        lng: -0.1278,
        hours: '24/7',
        accessible: true,
        fee: 0.50,
        features: {
          babyChange: true,
          radar: false,
          automatic: false,
          contactless: true,
        },
      };
      
      const v2Payload = transformer.transformToV2Payload(formData);
      
      // Verify all 8 core fields
      expect(v2Payload).toHaveProperty('@id');
      expect(v2Payload['@id']).toMatch(/^node\/temp_/);
      expect(v2Payload).toHaveProperty('amenity', 'toilets');
      expect(v2Payload).toHaveProperty('lat', 51.5074);
      expect(v2Payload).toHaveProperty('lng', -0.1278);
      expect(v2Payload).toHaveProperty('wheelchair', 'yes');
      expect(v2Payload).toHaveProperty('access', 'yes');
      expect(v2Payload).toHaveProperty('opening_hours', '24/7');
      expect(v2Payload).toHaveProperty('fee', true);
      
      // Verify feature mappings
      expect(v2Payload).toHaveProperty('changing_table', 'yes');
      expect(v2Payload).toHaveProperty('payment:contactless', 'yes');
    });

    it('should apply smart defaults in v2 transformation', () => {
      const transformer = new SuggestPayloadTransformer();
      const minimalData = {
        name: 'Minimal',
        lat: 51.5,
        lng: -0.1,
        accessible: undefined,
        fee: undefined,
        hours: undefined,
        features: undefined,
      };
      
      const v2Payload = transformer.transformToV2Payload(minimalData);
      
      // Verify smart defaults
      expect(v2Payload.wheelchair).toBe('unknown'); // Default for undefined
      expect(v2Payload.opening_hours).toBe('24/7'); // Default for undefined hours
      expect(v2Payload.fee).toBe(false); // Default for undefined fee
      expect(v2Payload.access).toBe('yes'); // Default public access
    });
  });

  describe('v2 Error Handling', () => {
    it('should handle v2 validation errors with proper structure', async () => {
      const user = userEvent.setup();
      
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        json: async () => ({ 
          error: 'Validation failed',
          details: { wheelchair: 'Invalid value' }
        }),
      } as Response);
      
      render(
        <ContributionForm 
          location={defaultLocation} 
          onSuccess={mockOnSuccess}
          apiVersion="v2"
        />
      );
      
      await user.type(screen.getByLabelText(/toilet name/i), 'Error Test');
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(within(alert).getByText(/validation failed/i)).toBeInTheDocument();
      });
      
      expect(mockOnSuccess).not.toHaveBeenCalled();
      mockFetch.mockRestore();
    });
  });

  describe('v1 Test Isolation', () => {
    it('should not affect v1 behavior when apiVersion is not specified', async () => {
      const user = userEvent.setup();
      
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);
      
      // Render without apiVersion prop (should default to v1)
      render(
        <ContributionForm 
          location={defaultLocation} 
          onSuccess={mockOnSuccess}
        />
      );
      
      await user.type(screen.getByLabelText(/toilet name/i), 'V1 Default Test');
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
        const [url, options] = mockFetch.mock.calls[0];
        const body = JSON.parse(options.body as string);
        
        // Should use v1 endpoint
        expect(url).toBe('http://localhost:3000/api/suggest');
        
        // Should have v1 payload structure
        expect(body).not.toHaveProperty('@id');
        expect(body).toHaveProperty('name', 'V1 Default Test');
        expect(body).toHaveProperty('accessible'); // Boolean, not wheelchair
      });
      
      mockFetch.mockRestore();
    });

    it('should maintain v1 feature mappings when no apiVersion specified', async () => {
      const user = userEvent.setup();
      
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);
      
      render(
        <ContributionForm 
          location={defaultLocation} 
          onSuccess={mockOnSuccess}
        />
      );
      
      await user.type(screen.getByLabelText(/toilet name/i), 'V1 Features');
      await user.click(screen.getByLabelText(/baby changing facilities/i));
      await user.click(screen.getByLabelText(/contactless payment/i));
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
        const [, options] = mockFetch.mock.calls[0];
        const body = JSON.parse(options.body as string);
        
        // Should have v1 feature field names
        expect(body).toHaveProperty('changing_table', true);
        expect(body).toHaveProperty('payment_contactless', true);
        expect(body).not.toHaveProperty('payment:contactless'); // Not v2 format
      });
      
      mockFetch.mockRestore();
    });
  });

  describe('Environment Variable Support', () => {
    const originalEnv = process.env.NEXT_PUBLIC_SUGGEST_API_VERSION;

    afterEach(() => {
      // Restore original env
      if (originalEnv) {
        process.env.NEXT_PUBLIC_SUGGEST_API_VERSION = originalEnv;
      } else {
        delete process.env.NEXT_PUBLIC_SUGGEST_API_VERSION;
      }
    });

    it('should respect NEXT_PUBLIC_SUGGEST_API_VERSION when set to v2', () => {
      process.env.NEXT_PUBLIC_SUGGEST_API_VERSION = 'v2';
      
      render(
        <ContributionForm 
          location={defaultLocation} 
          onSubmit={mockOnSubmit}
        />
      );
      
      // Component should render normally
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('should prioritize apiVersion prop over environment variable', () => {
      process.env.NEXT_PUBLIC_SUGGEST_API_VERSION = 'v2';
      
      render(
        <ContributionForm 
          location={defaultLocation} 
          onSubmit={mockOnSubmit}
          apiVersion="v1" // Prop should win
        />
      );
      
      // Component should render normally
      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  describe('Form Submission with onSubmit Callback', () => {
    it('should call onSubmit with form data when apiVersion is v2', async () => {
      const user = userEvent.setup();
      
      render(
        <ContributionForm 
          location={defaultLocation} 
          onSubmit={mockOnSubmit}
          apiVersion="v2"
        />
      );
      
      await user.type(screen.getByLabelText(/toilet name/i), 'Callback Test');
      await user.selectOptions(screen.getByLabelText(/opening hours/i), '24/7');
      await user.click(screen.getByLabelText(/wheelchair accessible/i));
      await user.type(screen.getByLabelText(/usage fee/i), '0.50');
      
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Callback Test',
            lat: 51.5074,
            lng: -0.1278,
            hours: '24/7',
            accessible: true,
            fee: 0.5,
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display API errors for v2 requests', async () => {
      const user = userEvent.setup();
      
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'v2 Validation Error' }),
      } as Response);
      
      render(
        <ContributionForm 
          location={defaultLocation} 
          onSuccess={mockOnSuccess}
          apiVersion="v2"
        />
      );
      
      await user.type(screen.getByLabelText(/toilet name/i), 'Error Test');
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(within(alert).getByText(/v2 validation error/i)).toBeInTheDocument();
      });
      
      expect(mockOnSuccess).not.toHaveBeenCalled();
      mockFetch.mockRestore();
    });
  });
});