/**
 * @fileoverview ContributionForm component tests - Red phase TDD
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import nock from 'nock';
import { ContributionForm } from '@/components/molecules/ContributionForm/ContributionForm';

// Mock API endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('ContributionForm Component', () => {
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

  describe('Rendering', () => {
    it('should render form title and description', () => {
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      expect(screen.getByRole('heading', { name: /add a toilet/i })).toBeInTheDocument();
      expect(screen.getByText(/help others by adding a public toilet/i)).toBeInTheDocument();
    });

    it('should render all required form fields', () => {
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      // Name field
      expect(screen.getByLabelText(/toilet name/i)).toBeInTheDocument();
      
      // Location fields (read-only)
      expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument();
      
      // Opening hours
      expect(screen.getByLabelText(/opening hours/i)).toBeInTheDocument();
      
      // Accessibility
      expect(screen.getByLabelText(/wheelchair accessible/i)).toBeInTheDocument();
      
      // Fee
      expect(screen.getByLabelText(/usage fee/i)).toBeInTheDocument();
    });

    it('should render optional feature checkboxes', () => {
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      expect(screen.getByLabelText(/baby changing facilities/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/radar key required/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/automatic/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contactless payment/i)).toBeInTheDocument();
    });

    it('should render submit and cancel buttons', () => {
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should prefill location coordinates', () => {
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const latInput = screen.getByLabelText(/latitude/i);
      const lngInput = screen.getByLabelText(/longitude/i);
      
      expect(latInput).toHaveValue(51.5074);
      expect(lngInput).toHaveValue(-0.1278);
      expect(latInput).toHaveAttribute('readonly');
      expect(lngInput).toHaveAttribute('readonly');
    });
  });

  describe('Form Validation', () => {
    it('should require toilet name', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      // Use findByText for async error message
      const errorMessage = await screen.findByText(/toilet name is required/i);
      expect(errorMessage).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate name length', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const nameInput = screen.getByLabelText(/toilet name/i);
      await user.type(nameInput, 'AB'); // Too short
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      // Use findByText for async error message  
      const errorMessage = await screen.findByText(/name must be at least 3 characters/i);
      expect(errorMessage).toBeInTheDocument();
    });

    it('should validate fee format', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const feeInput = screen.getByLabelText(/usage fee/i);
      await user.type(feeInput, 'abc'); // Invalid - should trigger real-time validation

      // Check for real-time validation error (no submit needed)
      const errorMessage = await screen.findByText(/please enter a valid amount/i);
      expect(errorMessage).toBeInTheDocument();
    });

    it('should validate fee range', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const feeInput = screen.getByLabelText(/usage fee/i);
      await user.type(feeInput, '100'); // Too high

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/fee must be between £0 and £10/i)).toBeInTheDocument();
      });
    });

    it('should allow valid form submission', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      // Fill required fields
      const nameInput = screen.getByLabelText(/toilet name/i);
      await user.type(nameInput, 'Victoria Park Toilet');
      
      const hoursSelect = screen.getByLabelText(/opening hours/i);
      await user.selectOptions(hoursSelect, '24/7');
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Victoria Park Toilet',
          hours: '24/7',
        }));
      });
    });
  });

  describe('Interactions', () => {
    it('should handle text input in name field', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const nameInput = screen.getByLabelText(/toilet name/i);
      await user.type(nameInput, 'Test Toilet');
      
      expect(nameInput).toHaveValue('Test Toilet');
    });

    it('should handle checkbox toggles', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const accessibleCheckbox = screen.getByLabelText(/wheelchair accessible/i);
      const babyChangeCheckbox = screen.getByLabelText(/baby changing/i);
      
      // Initially unchecked
      expect(accessibleCheckbox).not.toBeChecked();
      expect(babyChangeCheckbox).not.toBeChecked();
      
      // Toggle on
      await user.click(accessibleCheckbox);
      await user.click(babyChangeCheckbox);
      
      expect(accessibleCheckbox).toBeChecked();
      expect(babyChangeCheckbox).toBeChecked();
      
      // Toggle off
      await user.click(accessibleCheckbox);
      expect(accessibleCheckbox).not.toBeChecked();
    });

    it('should handle fee input', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const feeInput = screen.getByLabelText(/usage fee/i);
      await user.type(feeInput, '0.50');
      
      // Fee input is text type, so expect string value
      expect(feeInput).toHaveValue('0.50');
    });

    it('should handle opening hours selection', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const hoursSelect = screen.getByLabelText(/opening hours/i);
      
      // Should have preset options
      await user.click(hoursSelect);
      expect(screen.getByRole('option', { name: /24\/7/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /dawn to dusk/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /custom/i })).toBeInTheDocument();
      
      // Select 24/7
      await user.selectOptions(hoursSelect, '24/7');
      expect(hoursSelect).toHaveValue('24/7');
    });

    it('should show custom hours input when custom is selected', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const hoursSelect = screen.getByLabelText(/opening hours/i);
      await user.selectOptions(hoursSelect, 'custom');
      
      // Custom input should appear
      const customInput = screen.getByLabelText(/specify hours/i);
      expect(customInput).toBeInTheDocument();
      
      await user.type(customInput, 'Mon-Fri: 8am-6pm');
      expect(customInput).toHaveValue('Mon-Fri: 8am-6pm');
    });

    it('should handle cancel button click', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear form errors when corrected', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      const nameInput = screen.getByLabelText(/toilet name/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });

      // Trigger error
      await user.click(submitButton);
      const error = await screen.findByText(/toilet name is required/i);
      expect(error).toBeInTheDocument();

      // Correct the input
      await user.type(nameInput, 'A valid toilet name');

      // The error should disappear (in a real app with onChange validation)
      // For onSubmit, the error persists until the next submit. We will test that a new submit succeeds.
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/toilet name is required/i)).not.toBeInTheDocument();
      });
      
      // Also ensure submit is now successful
      const hoursSelect = screen.getByLabelText(/opening hours/i);
      await user.selectOptions(hoursSelect, '24/7');
      await user.click(submitButton);
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('API Integration', () => {
    it('should submit form data to API', async () => {
      const user = userEvent.setup();
      
      // Mock fetch globally
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, id: 'new-toilet-123' }),
      } as Response);
      
      render(<ContributionForm location={defaultLocation} onSuccess={mockOnSuccess} />);
      
      // Fill form
      await user.type(screen.getByLabelText(/toilet name/i), 'API Test Toilet');
      await user.selectOptions(screen.getByLabelText(/opening hours/i), '24/7');
      await user.click(screen.getByLabelText(/wheelchair accessible/i));
      
      // Submit
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      // Wait for API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/suggest',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: 'API Test Toilet',
              lat: 51.5074,
              lng: -0.1278,
              hours: '24/7',
              accessible: true,
              fee: 0,
            }),
          })
        );
        expect(mockOnSuccess).toHaveBeenCalledWith({ success: true, id: 'new-toilet-123' });
      });
      
      mockFetch.mockRestore();
    });

    it('should handle API errors', async () => {
      const user = userEvent.setup();
      
      // Mock fetch to return error response
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Internal Server Error' }),
      } as Response);

      render(
        <ContributionForm
          location={defaultLocation}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill form and submit
      const nameInput = screen.getByLabelText(/toilet name/i);
      await user.type(nameInput, 'Test Toilet');
      const hoursSelect = screen.getByLabelText(/opening hours/i);
      await user.selectOptions(hoursSelect, '24/7');
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Wait for error
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(within(alert).getByText(/internal server error/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      mockFetch.mockRestore();
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      
      // Mock fetch to reject with network error
      const mockFetch = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network request failed'));

      render(
        <ContributionForm
          location={defaultLocation}
          onSuccess={mockOnSuccess}
        />
      );

      // Fill form and submit
      const nameInput = screen.getByLabelText(/toilet name/i);
      await user.type(nameInput, 'Test Toilet');
      const hoursSelect = screen.getByLabelText(/opening hours/i);
      await user.selectOptions(hoursSelect, '24/7');
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Wait for error
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(within(alert).getByText(/network request failed/i)).toBeInTheDocument();
      });
      
      mockFetch.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have a form role and accessible name', () => {
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const form = screen.getByRole('form', { name: /toilet contribution form/i });
      expect(form).toBeInTheDocument();
    });

    it('should announce form errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Use findByRole for async error display
      const errorAlert = await screen.findByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      // We check for just one of the possible errors announced
      expect(errorAlert).toHaveTextContent(/toilet name is required/i);
    });

    it('should have proper fieldset grouping', () => {
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      // Location fieldset
      const locationFieldset = screen.getByRole('group', { name: /location/i });
      expect(locationFieldset).toBeInTheDocument();
      
      // Features fieldset
      const featuresFieldset = screen.getByRole('group', { name: /features/i });
      expect(featuresFieldset).toBeInTheDocument();
    });

    it('should manage focus correctly on tab', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const nameInput = screen.getByLabelText(/toilet name/i);
      const hoursSelect = screen.getByLabelText(/opening hours/i);
      const accessibleCheckbox = screen.getByLabelText(/wheelchair accessible/i);
      const feeInput = screen.getByLabelText(/usage fee/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      await user.tab();
      expect(nameInput).toHaveFocus();

      await user.tab();
      expect(hoursSelect).toHaveFocus();

      await user.tab();
      expect(accessibleCheckbox).toHaveFocus();

      // ... and so on for all features checkboxes ...
      // This part can be simplified or made more robust if needed

      // Tab to the fee input (after all checkboxes)
      // There are 4 more checkboxes after the accessibility checkbox: baby-change, radar-key, automatic, contactless
      for (let i = 0; i < 5; i++) {
        await user.tab();
      }
      expect(feeInput).toHaveFocus();

      await user.tab();
      expect(cancelButton).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });

  describe('Mobile Ergonomics', () => {
    it('should have touch-friendly input sizes', () => {
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const nameInput = screen.getByLabelText(/toilet name/i);
      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      expect(nameInput).toHaveClass('min-h-[44px]');
      expect(submitButton).toHaveClass('min-h-[44px]');
    });

    it('should stack form elements vertically on mobile', () => {
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const form = screen.getByRole('form');
      expect(form).toHaveClass('space-y-4'); // Vertical spacing
    });
  });
});