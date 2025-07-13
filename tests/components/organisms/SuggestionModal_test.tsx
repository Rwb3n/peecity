/**
 * @fileoverview Tests for SuggestionModal organism component
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 * TDD Phase: Red - Creating failing tests for SuggestionModal implementation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import nock from 'nock';
import { SuggestionModal } from '@/components/organisms/SuggestionModal';

// Mock the Dialog components from shadcn/ui
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog" data-open={open} onClick={() => onOpenChange?.(false)}>
      {open && children}
    </div>
  ),
  DialogContent: ({ children, className }: any) => (
    <div data-testid="dialog-content" className={className} role="dialog" aria-modal="true">
      {children}
    </div>
  ),
  DialogHeader: ({ children }: any) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: any) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogDescription: ({ children }: any) => (
    <p data-testid="dialog-description">{children}</p>
  ),
}));

// Mock the ContributionForm component
jest.mock('@/components/molecules/ContributionForm', () => ({
  ContributionForm: ({ onSubmit, initialData, onCancel, isLoading }: any) => (
    <form data-testid="contribution-form" onSubmit={(e) => { e.preventDefault(); onSubmit?.({ name: 'Test Toilet', lat: 51.5074, lng: -0.1278 }); }}>
      <div data-testid="form-loading" style={{ display: isLoading ? 'block' : 'none' }}>Loading...</div>
      <div data-testid="initial-lat">{initialData?.lat}</div>
      <div data-testid="initial-lng">{initialData?.lng}</div>
      <input data-testid="form-input" defaultValue={initialData?.name || ''} />
      <button type="submit" data-testid="form-submit">Submit</button>
      <button type="button" onClick={onCancel} data-testid="form-cancel">Cancel</button>
    </form>
  ),
}));

// Mock successful API response
const mockApiResponse = {
  success: true,
  message: 'Toilet suggestion submitted successfully',
  id: 'test-toilet-123'
};

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSuccess: mockOnSuccess,
  onError: mockOnError,
  location: { lat: 51.5074, lng: -0.1278 }
};

describe('SuggestionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    nock.cleanAll();
  });

  describe('Modal Rendering', () => {
    it('should render modal when open', () => {
      render(<SuggestionModal {...defaultProps} />);
      
      const dialog = screen.getByTestId('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('data-open', 'true');
    });

    it('should not render modal content when closed', () => {
      render(<SuggestionModal {...defaultProps} isOpen={false} />);
      
      const dialog = screen.getByTestId('dialog');
      expect(dialog).toHaveAttribute('data-open', 'false');
      
      const dialogContent = screen.queryByTestId('dialog-content');
      expect(dialogContent).not.toBeInTheDocument();
    });

    it('should render Dialog components with proper structure', () => {
      render(<SuggestionModal {...defaultProps} />);
      
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
    });

    it('should have proper modal title', () => {
      render(<SuggestionModal {...defaultProps} />);
      
      const title = screen.getByTestId('dialog-title');
      expect(title).toHaveTextContent('Add New Toilet Location');
    });

    it('should have proper ARIA attributes', () => {
      render(<SuggestionModal {...defaultProps} />);
      
      const dialogContent = screen.getByTestId('dialog-content');
      expect(dialogContent).toHaveAttribute('role', 'dialog');
      expect(dialogContent).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('ContributionForm Integration', () => {
    it('should render ContributionForm inside modal', () => {
      render(<SuggestionModal {...defaultProps} />);
      
      const contributionForm = screen.getByTestId('contribution-form');
      expect(contributionForm).toBeInTheDocument();
    });

    it('should pass location data to ContributionForm', () => {
      const location = { lat: 51.5074, lng: -0.1278 };
      render(<SuggestionModal {...defaultProps} location={location} />);
      
      expect(screen.getByTestId('initial-lat')).toHaveTextContent('51.5074');
      expect(screen.getByTestId('initial-lng')).toHaveTextContent('-0.1278');
    });

    it('should handle map center location when no specific location provided', () => {
      const mapCenter = { lat: 51.509865, lng: -0.118092 };
      render(<SuggestionModal {...defaultProps} location={undefined} mapCenter={mapCenter} />);
      
      expect(screen.getByTestId('initial-lat')).toHaveTextContent('51.509865');
      expect(screen.getByTestId('initial-lng')).toHaveTextContent('-0.118092');
    });

    it('should prioritize specific location over map center', () => {
      const location = { lat: 51.5074, lng: -0.1278 };
      const mapCenter = { lat: 51.509865, lng: -0.118092 };
      render(<SuggestionModal {...defaultProps} location={location} mapCenter={mapCenter} />);
      
      expect(screen.getByTestId('initial-lat')).toHaveTextContent('51.5074');
      expect(screen.getByTestId('initial-lng')).toHaveTextContent('-0.1278');
    });

    it('should pass loading state to ContributionForm', () => {
      render(<SuggestionModal {...defaultProps} />);
      
      const loadingIndicator = screen.getByTestId('form-loading');
      expect(loadingIndicator).toHaveStyle('display: none');
    });
  });

  describe('Location Data Passing', () => {
    it('should accept location prop with lat/lng coordinates', () => {
      const location = { lat: 51.5145, lng: -0.0875 };
      render(<SuggestionModal {...defaultProps} location={location} />);
      
      expect(screen.getByTestId('initial-lat')).toHaveTextContent('51.5145');
      expect(screen.getByTestId('initial-lng')).toHaveTextContent('-0.0875');
    });

    it('should handle missing location gracefully', () => {
      render(<SuggestionModal {...defaultProps} location={undefined} />);
      
      const contributionForm = screen.getByTestId('contribution-form');
      expect(contributionForm).toBeInTheDocument();
    });

    it('should update form when location prop changes', () => {
      const { rerender } = render(<SuggestionModal {...defaultProps} location={{ lat: 51.5, lng: -0.1 }} />);
      
      expect(screen.getByTestId('initial-lat')).toHaveTextContent('51.5');
      
      rerender(<SuggestionModal {...defaultProps} location={{ lat: 51.6, lng: -0.2 }} />);
      
      expect(screen.getByTestId('initial-lat')).toHaveTextContent('51.6');
    });
  });

  describe('API Integration & Submission', () => {
    it('should handle successful form submission', async () => {
      const user = userEvent.setup();
      
      nock('http://localhost:3000')
        .post('/api/v2/suggest')
        .reply(200, mockApiResponse);

      render(<SuggestionModal {...defaultProps} />);
      
      const submitButton = screen.getByTestId('form-submit');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockApiResponse);
      });
    });

    it('should handle API error responses', async () => {
      const user = userEvent.setup();
      const errorResponse = { error: 'Invalid submission data' };
      
      nock('http://localhost:3000')
        .post('/api/v2/suggest')
        .reply(400, errorResponse);

      render(<SuggestionModal {...defaultProps} />);
      
      const submitButton = screen.getByTestId('form-submit');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.objectContaining({
          status: 400,
          data: errorResponse
        }));
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      
      nock('http://localhost:3000')
        .post('/api/v2/suggest')
        .replyWithError('Network error');

      render(<SuggestionModal {...defaultProps} />);
      
      const submitButton = screen.getByTestId('form-submit');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.objectContaining({
          message: expect.stringContaining('Network error')
        }));
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      nock('http://localhost:3000')
        .post('/api/v2/suggest')
        .delay(100)
        .reply(200, mockApiResponse);

      render(<SuggestionModal {...defaultProps} />);
      
      const submitButton = screen.getByTestId('form-submit');
      await user.click(submitButton);
      
      const loadingIndicator = screen.getByTestId('form-loading');
      expect(loadingIndicator).toHaveStyle('display: block');
      
      await waitFor(() => {
        expect(loadingIndicator).toHaveStyle('display: none');
      });
    });

    it('should call v2 API endpoint with correct data', async () => {
      const user = userEvent.setup();
      
      const apiScope = nock('http://localhost:3000')
        .post('/api/v2/suggest', {
          name: 'Test Toilet',
          lat: 51.5074,
          lng: -0.1278
        })
        .reply(200, mockApiResponse);

      render(<SuggestionModal {...defaultProps} />);
      
      const submitButton = screen.getByTestId('form-submit');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(apiScope.isDone()).toBe(true);
      });
    });
  });

  describe('Success & Error States', () => {
    it('should display success message after successful submission', async () => {
      const user = userEvent.setup();
      
      nock('http://localhost:3000')
        .post('/api/v2/suggest')
        .reply(200, mockApiResponse);

      render(<SuggestionModal {...defaultProps} />);
      
      const submitButton = screen.getByTestId('form-submit');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/successfully submitted/i)).toBeInTheDocument();
      });
    });

    it('should display error message after failed submission', async () => {
      const user = userEvent.setup();
      
      nock('http://localhost:3000')
        .post('/api/v2/suggest')
        .reply(400, { error: 'Invalid data' });

      render(<SuggestionModal {...defaultProps} />);
      
      const submitButton = screen.getByTestId('form-submit');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error submitting/i)).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      
      nock('http://localhost:3000')
        .post('/api/v2/suggest')
        .reply(400, { error: 'Invalid data' });

      render(<SuggestionModal {...defaultProps} />);
      
      const submitButton = screen.getByTestId('form-submit');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error submitting/i)).toBeInTheDocument();
      });
      
      // Should be able to submit again
      expect(submitButton).toBeEnabled();
    });

    it('should close modal after successful submission', async () => {
      const user = userEvent.setup();
      
      nock('http://localhost:3000')
        .post('/api/v2/suggest')
        .reply(200, mockApiResponse);

      render(<SuggestionModal {...defaultProps} />);
      
      const submitButton = screen.getByTestId('form-submit');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Behaviors', () => {
    it('should close modal on backdrop click', async () => {
      const user = userEvent.setup();
      render(<SuggestionModal {...defaultProps} />);
      
      const dialog = screen.getByTestId('dialog');
      await user.click(dialog);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal on ESC key press', async () => {
      const user = userEvent.setup();
      render(<SuggestionModal {...defaultProps} />);
      
      await user.keyboard('{Escape}');
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when form cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<SuggestionModal {...defaultProps} />);
      
      const cancelButton = screen.getByTestId('form-cancel');
      await user.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should prevent closing during submission', async () => {
      const user = userEvent.setup();
      
      nock('http://localhost:3000')
        .post('/api/v2/suggest')
        .delay(100)
        .reply(200, mockApiResponse);

      render(<SuggestionModal {...defaultProps} />);
      
      const submitButton = screen.getByTestId('form-submit');
      await user.click(submitButton);
      
      // Try to close during submission
      const dialog = screen.getByTestId('dialog');
      await user.click(dialog);
      
      // Should not close while loading
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management & Accessibility', () => {
    it('should trap focus within modal when open', () => {
      render(<SuggestionModal {...defaultProps} />);
      
      const dialogContent = screen.getByTestId('dialog-content');
      expect(dialogContent).toHaveAttribute('aria-modal', 'true');
    });

    it('should return focus when modal closes', () => {
      const { rerender } = render(<SuggestionModal {...defaultProps} />);
      
      rerender(<SuggestionModal {...defaultProps} isOpen={false} />);
      
      // Focus should return to triggering element (tested via integration)
    });

    it('should have proper aria-labelledby', () => {
      render(<SuggestionModal {...defaultProps} />);
      
      const dialogContent = screen.getByTestId('dialog-content');
      const title = screen.getByTestId('dialog-title');
      
      expect(dialogContent).toHaveAttribute('aria-labelledby');
      expect(title).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<SuggestionModal {...defaultProps} />);
      
      // Tab should navigate through form elements
      await user.tab();
      expect(screen.getByTestId('form-input')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByTestId('form-submit')).toHaveFocus();
    });
  });

  describe('Animation & Transitions', () => {
    it('should have enter animation classes', () => {
      render(<SuggestionModal {...defaultProps} />);
      
      const dialogContent = screen.getByTestId('dialog-content');
      expect(dialogContent).toHaveClass('animate-in');
    });

    it('should have exit animation classes when closing', () => {
      const { rerender } = render(<SuggestionModal {...defaultProps} />);
      
      rerender(<SuggestionModal {...defaultProps} isOpen={false} />);
      
      // Animation classes would be applied during transition
    });

    it('should have smooth fade transitions', () => {
      render(<SuggestionModal {...defaultProps} />);
      
      const dialogContent = screen.getByTestId('dialog-content');
      expect(dialogContent).toHaveClass('fade-in-0');
    });
  });

  describe('MapView Integration', () => {
    it('should accept mapCenter prop for fallback location', () => {
      const mapCenter = { lat: 51.505, lng: -0.09 };
      render(<SuggestionModal {...defaultProps} location={undefined} mapCenter={mapCenter} />);
      
      expect(screen.getByTestId('initial-lat')).toHaveTextContent('51.505');
      expect(screen.getByTestId('initial-lng')).toHaveTextContent('-0.09');
    });

    it('should work without any location data', () => {
      render(<SuggestionModal {...defaultProps} location={undefined} mapCenter={undefined} />);
      
      const contributionForm = screen.getByTestId('contribution-form');
      expect(contributionForm).toBeInTheDocument();
    });

    it('should handle location updates from parent', () => {
      const { rerender } = render(<SuggestionModal {...defaultProps} location={{ lat: 51.5, lng: -0.1 }} />);
      
      expect(screen.getByTestId('initial-lat')).toHaveTextContent('51.5');
      
      rerender(<SuggestionModal {...defaultProps} location={{ lat: 51.52, lng: -0.12 }} />);
      
      expect(screen.getByTestId('initial-lat')).toHaveTextContent('51.52');
    });
  });

  describe('Props Validation', () => {
    it('should accept custom className', () => {
      render(<SuggestionModal {...defaultProps} className="custom-modal" />);
      
      const dialogContent = screen.getByTestId('dialog-content');
      expect(dialogContent).toHaveClass('custom-modal');
    });

    it('should require isOpen prop', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // @ts-expect-error - Testing required prop
      render(<SuggestionModal onClose={mockOnClose} />);
      
      consoleSpy.mockRestore();
    });

    it('should accept testId for testing', () => {
      render(<SuggestionModal {...defaultProps} data-testid="suggestion-modal-test" />);
      
      const modal = screen.getByTestId('suggestion-modal-test');
      expect(modal).toBeInTheDocument();
    });
  });
});