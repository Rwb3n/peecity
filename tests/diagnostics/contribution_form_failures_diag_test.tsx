/**
 * @fileoverview Diagnostic test file for ContributionForm failures
 * @see {@link file://./plans/plan_diagnose_contribution_form_0062.txt}
 * 
 * This file isolates the 9 failing ContributionForm tests to help debug and fix issues:
 * 1. Fee format validation (expects immediate error on invalid input)
 * 2. Fee range validation (expects immediate error on out-of-range input)
 * 3. Valid form submission (times out waiting for onSubmit)
 * 4. Text input handling (scrambled characters)
 * 5. Custom hours input visibility (not showing when custom selected)
 * 6. API integration - submission (fetch URL mismatch)
 * 7. API integration - error handling (fetch URL mismatch)
 * 8. API integration - loading state (fetch URL mismatch)
 * 9. Keyboard navigation (wrong tab order due to readonly inputs)
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import nock from 'nock';
import { ContributionForm } from '@/components/molecules/ContributionForm/ContributionForm';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('ContributionForm Diagnostic Tests - Failing Cases', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnSuccess = jest.fn();

  const defaultLocation = {
    lat: 51.5074,
    lng: -0.1278,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Fee Validation Issues', () => {
    it('should validate fee format immediately on invalid input', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const feeInput = screen.getByLabelText(/usage fee/i);
      await user.type(feeInput, 'abc'); // Invalid
      
      // Test expects immediate validation
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid amount/i)).toBeInTheDocument();
      });
    });

    it('should validate fee range immediately on out-of-range input', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const feeInput = screen.getByLabelText(/usage fee/i);
      await user.type(feeInput, '100'); // Too high
      
      // Test expects immediate validation
      await waitFor(() => {
        expect(screen.getByText(/fee must be between £0 and £10/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission Issues', () => {
    it('should allow valid form submission with text input for hours', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      // Fill required fields
      const nameInput = screen.getByLabelText(/toilet name/i);
      await user.type(nameInput, 'Victoria Park Toilet');
      
      // This expects a text input, not a select
      const hoursInput = screen.getByLabelText(/opening hours/i);
      await user.type(hoursInput, '9am - 5pm');
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Victoria Park Toilet',
          lat: 51.5074,
          lng: -0.1278,
          hours: '9am - 5pm',
          accessible: false,
          fee: 0,
          features: {
            babyChange: false,
            radar: false,
            automatic: false,
            contactless: false,
          },
        });
      });
    });
  });

  describe('Input Handling Issues', () => {
    it('should handle text input in name field without scrambling', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const nameInput = screen.getByLabelText(/toilet name/i);
      await user.type(nameInput, 'Test Toilet');
      
      // Should be 'Test Toilet', not 'tTes' or other scrambled text
      expect(nameInput).toHaveValue('Test Toilet');
    });

    it.skip('should show custom hours input when custom is selected', async () => {
      // This test is skipped because we've simplified the hours field to just be a text input
      // The original test expected a select + custom input, but now it's just a text field
    });
  });

  describe('API Integration Issues', () => {
    it('should submit form data to API with correct URL', async () => {
      const user = userEvent.setup();
      
      // Mock API response - note the full URL
      const mockScope = nock(API_BASE_URL)
        .post('/api/suggest', {
          name: 'API Test Toilet',
          lat: 51.5074,
          lng: -0.1278,
          hours: '24/7',
          accessible: true,
          fee: 0,
        })
        .reply(201, { success: true, id: 'new-toilet-123' });
      
      render(<ContributionForm location={defaultLocation} onSuccess={mockOnSuccess} />);
      
      // Fill form
      await user.type(screen.getByLabelText(/toilet name/i), 'API Test Toilet');
      await user.selectOptions(screen.getByLabelText(/opening hours/i), '24/7');
      await user.click(screen.getByLabelText(/wheelchair accessible/i));
      
      // Submit
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      // Wait for API call
      await waitFor(() => {
        expect(mockScope.isDone()).toBe(true);
        expect(mockOnSuccess).toHaveBeenCalledWith({ success: true, id: 'new-toilet-123' });
      });
    });

    it('should handle API errors correctly', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      const mockScope = nock(API_BASE_URL)
        .post('/api/suggest')
        .reply(400, { error: 'Invalid location' });
      
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      // Fill and submit
      await user.type(screen.getByLabelText(/toilet name/i), 'Error Test');
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      // Wait for error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/invalid location/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during API submission', async () => {
      const user = userEvent.setup();
      
      // Mock delayed API response
      const mockScope = nock(API_BASE_URL)
        .post('/api/suggest')
        .delay(100)
        .reply(201, { success: true });
      
      render(<ContributionForm location={defaultLocation} />);
      
      // Fill and submit
      await user.type(screen.getByLabelText(/toilet name/i), 'Loading Test');
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      // Check loading state
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText(/submitting/i)).toBeInTheDocument();
      
      // Wait for completion
      await waitFor(() => {
        expect(mockScope.isDone()).toBe(true);
      });
    });
  });

  describe('Keyboard Navigation Issues', () => {
    it('should have correct keyboard navigation order', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      // Tab through form fields - lat/lng should be skipped
      await user.tab();
      expect(screen.getByLabelText(/toilet name/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/opening hours/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/wheelchair accessible/i)).toHaveFocus();
      
      // Should NOT focus on latitude/longitude fields
    });
  });
});