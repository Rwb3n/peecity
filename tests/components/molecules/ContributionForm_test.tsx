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
      
      await waitFor(() => {
        expect(screen.getByText(/toilet name is required/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate name length', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const nameInput = screen.getByLabelText(/toilet name/i);
      await user.type(nameInput, 'AB'); // Too short
      
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/name must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate fee format', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const feeInput = screen.getByLabelText(/usage fee/i);
      await user.type(feeInput, 'abc'); // Invalid
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid amount/i)).toBeInTheDocument();
      });
    });

    it('should validate fee range', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const feeInput = screen.getByLabelText(/usage fee/i);
      await user.type(feeInput, '100'); // Too high
      
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
      
      const hoursInput = screen.getByLabelText(/opening hours/i);
      await user.type(hoursInput, '9am - 5pm');
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
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
      
      expect(feeInput).toHaveValue(0.5);
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
      
      // Submit empty form
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      // Error should show
      await waitFor(() => {
        expect(screen.getByText(/toilet name is required/i)).toBeInTheDocument();
      });
      
      // Fix the error
      const nameInput = screen.getByLabelText(/toilet name/i);
      await user.type(nameInput, 'Fixed name');
      
      // Error should clear
      expect(screen.queryByText(/toilet name is required/i)).not.toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('should submit form data to API', async () => {
      const user = userEvent.setup();
      
      // Mock API response
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

    it('should handle API errors', async () => {
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

    it('should show loading state during submission', async () => {
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

  describe('Accessibility', () => {
    it('should have proper form structure and labels', () => {
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      const form = screen.getByRole('form', { name: /toilet contribution/i });
      expect(form).toBeInTheDocument();
      
      // All inputs should have labels
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
      
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAccessibleName();
      });
    });

    it('should announce form errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      // Submit invalid form
      await user.click(screen.getByRole('button', { name: /submit/i }));
      
      // Error should be in alert role
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
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

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ContributionForm location={defaultLocation} onSubmit={mockOnSubmit} />);
      
      // Tab through form fields
      await user.tab();
      expect(screen.getByLabelText(/toilet name/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/opening hours/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/wheelchair accessible/i)).toHaveFocus();
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