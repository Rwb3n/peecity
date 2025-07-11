/**
 * @fileoverview MarkerPopup component tests - Red phase TDD
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MarkerPopup } from '@/components/molecules/MarkerPopup/MarkerPopup';

// Mock toilet data
const mockToilet = {
  id: 'toilet-123',
  name: 'Victoria Station Public Toilet',
  address: 'Victoria Station, London SW1V 1JU',
  lat: 51.4952,
  lng: -0.1441,
  hours: '24/7',
  accessible: true,
  fee: 0.5,
  features: {
    babyChange: true,
    radar: true,
    automatic: false,
  },
  distance: 0.3,
  source: 'OpenStreetMap',
  last_verified_at: '2025-01-10T10:00:00Z',
};

describe('MarkerPopup Component', () => {
  const mockOnDirections = jest.fn();
  const mockOnReport = jest.fn();
  const mockOnShare = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render toilet name and address', () => {
      render(<MarkerPopup toilet={mockToilet} />);
      
      expect(screen.getByText('Victoria Station Public Toilet')).toBeInTheDocument();
      expect(screen.getByText('Victoria Station, London SW1V 1JU')).toBeInTheDocument();
    });

    it('should render opening hours', () => {
      render(<MarkerPopup toilet={mockToilet} />);
      
      expect(screen.getByText('Open:')).toBeInTheDocument();
      expect(screen.getByText('24/7')).toBeInTheDocument();
    });

    it('should render accessibility badge when accessible', () => {
      render(<MarkerPopup toilet={mockToilet} />);
      
      const accessibilityBadge = screen.getByTestId('accessibility-badge');
      expect(accessibilityBadge).toBeInTheDocument();
      expect(accessibilityBadge).toHaveTextContent('Accessible');
    });

    it('should not render accessibility badge when not accessible', () => {
      const inaccessibleToilet = { ...mockToilet, accessible: false };
      render(<MarkerPopup toilet={inaccessibleToilet} />);
      
      expect(screen.queryByTestId('accessibility-badge')).not.toBeInTheDocument();
    });

    it('should render fee information', () => {
      render(<MarkerPopup toilet={mockToilet} />);
      
      expect(screen.getByText('Fee:')).toBeInTheDocument();
      expect(screen.getByText('£0.50')).toBeInTheDocument();
    });

    it('should render "Free" when fee is 0', () => {
      const freeToilet = { ...mockToilet, fee: 0 };
      render(<MarkerPopup toilet={freeToilet} />);
      
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.queryByText('£0.00')).not.toBeInTheDocument();
    });

    it('should render features when available', () => {
      render(<MarkerPopup toilet={mockToilet} />);
      
      expect(screen.getByText('Baby changing')).toBeInTheDocument();
      expect(screen.getByText('RADAR key')).toBeInTheDocument();
      expect(screen.queryByText('Automatic')).not.toBeInTheDocument();
    });

    it('should render distance when provided', () => {
      render(<MarkerPopup toilet={mockToilet} />);
      
      expect(screen.getByText('0.3 km away')).toBeInTheDocument();
    });

    it('should render last verified date', () => {
      render(<MarkerPopup toilet={mockToilet} />);
      
      expect(screen.getByText(/Last verified:/)).toBeInTheDocument();
      expect(screen.getByText(/10 Jan 2025/)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<MarkerPopup toilet={mockToilet} onDirections={mockOnDirections} onReport={mockOnReport} />);
      
      expect(screen.getByRole('button', { name: /directions/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Report an issue with this toilet' })).toBeInTheDocument();
    });

    it('should render close button when onClose is provided', () => {
      render(<MarkerPopup toilet={mockToilet} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Close popup');
    });
  });

  describe('Interactions', () => {
    it('should call onDirections when directions button is clicked', async () => {
      const user = userEvent.setup();
      render(<MarkerPopup toilet={mockToilet} onDirections={mockOnDirections} />);
      
      const directionsButton = screen.getByRole('button', { name: /directions/i });
      await user.click(directionsButton);
      
      expect(mockOnDirections).toHaveBeenCalledTimes(1);
      expect(mockOnDirections).toHaveBeenCalledWith(mockToilet);
    });

    it('should call onReport when report button is clicked', async () => {
      const user = userEvent.setup();
      render(<MarkerPopup toilet={mockToilet} onReport={mockOnReport} />);
      
      const reportButton = screen.getByRole('button', { name: 'Report an issue with this toilet' });
      await user.click(reportButton);
      
      expect(mockOnReport).toHaveBeenCalledTimes(1);
      expect(mockOnReport).toHaveBeenCalledWith(mockToilet.id);
    });

    it('should call onShare when share button is clicked', async () => {
      const user = userEvent.setup();
      render(<MarkerPopup toilet={mockToilet} onShare={mockOnShare} />);
      
      const shareButton = screen.getByRole('button', { name: /share/i });
      await user.click(shareButton);
      
      expect(mockOnShare).toHaveBeenCalledTimes(1);
      expect(mockOnShare).toHaveBeenCalledWith(mockToilet);
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<MarkerPopup toilet={mockToilet} onClose={mockOnClose} />);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should expand/collapse additional details', async () => {
      const user = userEvent.setup();
      render(<MarkerPopup toilet={mockToilet} />);
      
      // Initially collapsed
      expect(screen.queryByText('Source:')).not.toBeInTheDocument();
      
      // Click to expand
      const expandButton = screen.getByRole('button', { name: /show more/i });
      await act(async () => {
        await user.click(expandButton);
      });
      
      // Now visible
      expect(screen.getByText('Source:')).toBeInTheDocument();
      expect(screen.getByText('OpenStreetMap')).toBeInTheDocument();
      
      // Button text changes
      expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<MarkerPopup toilet={mockToilet} />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Victoria Station Public Toilet');
    });

    it('should have proper ARIA labels for interactive elements', () => {
      render(<MarkerPopup toilet={mockToilet} onDirections={mockOnDirections} onReport={mockOnReport} onShare={mockOnShare} />);
      
      const directionsButton = screen.getByRole('button', { name: /get directions/i });
      expect(directionsButton).toHaveAttribute('aria-label', 'Get directions to Victoria Station Public Toilet');
      
      const reportButton = screen.getByRole('button', { name: /report/i });
      expect(reportButton).toHaveAttribute('aria-label', 'Report an issue with this toilet');
      
      const shareButton = screen.getByRole('button', { name: /share/i });
      expect(shareButton).toHaveAttribute('aria-label', 'Share this toilet location');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<MarkerPopup toilet={mockToilet} onDirections={mockOnDirections} onReport={mockOnReport} onClose={mockOnClose} />);
      
      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('button', { name: /close/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /directions/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: 'Report an issue with this toilet' })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /show more/i })).toHaveFocus();
    });

    it('should have proper semantics for feature list', () => {
      render(<MarkerPopup toilet={mockToilet} />);
      
      const featureList = screen.getByRole('list', { name: /features/i });
      expect(featureList).toBeInTheDocument();
      
      const features = screen.getAllByRole('listitem');
      expect(features).toHaveLength(2); // Baby changing and RADAR key
    });
  });

  describe('Mobile Ergonomics', () => {
    it('should have touch-friendly button sizes', () => {
      render(<MarkerPopup toilet={mockToilet} onDirections={mockOnDirections} onReport={mockOnReport} />);
      
      const directionsButton = screen.getByRole('button', { name: /directions/i });
      const reportButton = screen.getByRole('button', { name: /report/i });
      
      expect(directionsButton).toHaveClass('min-h-[44px]');
      expect(reportButton).toHaveClass('min-h-[44px]');
    });

    it('should have appropriate spacing for touch targets', () => {
      render(<MarkerPopup toilet={mockToilet} />);
      
      const container = screen.getByTestId('marker-popup');
      expect(container).toHaveClass('space-y-4'); // Vertical spacing between elements
    });

    it('should support compact mode for smaller screens', () => {
      render(<MarkerPopup toilet={mockToilet} compact />);
      
      // In compact mode, some details should be hidden initially
      expect(screen.queryByText('Source:')).not.toBeInTheDocument();
      expect(screen.queryByText(/Last verified:/)).not.toBeInTheDocument();
      
      // But essential info should still be visible
      expect(screen.getByText('Victoria Station Public Toilet')).toBeInTheDocument();
      expect(screen.getByText('24/7')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state for action buttons', () => {
      render(<MarkerPopup toilet={mockToilet} onDirections={mockOnDirections} loading />);
      
      const directionsButton = screen.getByRole('button', { name: /directions/i });
      expect(directionsButton).toBeDisabled();
      expect(directionsButton).toHaveAttribute('aria-busy', 'true');
    });
  });
});