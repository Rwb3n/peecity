/**
 * @fileoverview Tests for FloatingActionButton organism component
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 * TDD Phase: Red - Creating failing tests for FloatingActionButton implementation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FloatingActionButton } from '@/components/organisms/FloatingActionButton';

// Mock the Plus icon from Lucide React
jest.mock('lucide-react', () => ({
  Plus: ({ className, ...props }: any) => (
    <svg data-testid="plus-icon" className={className} {...props}>
      <title>Plus</title>
    </svg>
  ),
}));

// Mock SuggestionModal integration
const mockOnClick = jest.fn();
const mockOnModalOpen = jest.fn();

describe('FloatingActionButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render FAB button', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toBeInTheDocument();
    });

    it('should render with Plus icon', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const plusIcon = screen.getByTestId('plus-icon');
      expect(plusIcon).toBeInTheDocument();
    });

    it('should have correct button text for screen readers', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button', { name: /add new toilet/i });
      expect(fabButton).toBeInTheDocument();
    });
  });

  describe('Positioning & Layout', () => {
    it('should have fixed positioning', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('fixed');
    });

    it('should be positioned in bottom-right corner', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('bottom-4', 'right-4');
    });

    it('should have proper mobile spacing', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      // Should have responsive spacing classes
      expect(fabButton).toHaveClass('sm:bottom-6', 'sm:right-6');
    });

    it('should have circular/rounded appearance', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('rounded-full');
    });

    it('should have proper z-index for overlay', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('z-50');
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA label', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveAttribute('aria-label', 'Add new toilet location');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      
      // Should be focusable
      await user.tab();
      expect(fabButton).toHaveFocus();
    });

    it('should handle Enter key activation', async () => {
      const user = userEvent.setup();
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      
      await user.tab();
      await user.keyboard('{Enter}');
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should handle Space key activation', async () => {
      const user = userEvent.setup();
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      
      await user.tab();
      await user.keyboard(' ');
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should have proper role and type attributes', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveAttribute('type', 'button');
    });
  });

  describe('User Interactions', () => {
    it('should call onClick handler when clicked', async () => {
      const user = userEvent.setup();
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      await user.click(fabButton);
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should call onClick only once per click', async () => {
      const user = userEvent.setup();
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      await user.click(fabButton);
      await user.click(fabButton);
      
      expect(mockOnClick).toHaveBeenCalledTimes(2);
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      render(<FloatingActionButton onClick={mockOnClick} disabled />);
      
      const fabButton = screen.getByRole('button');
      await user.click(fabButton);
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Modal Integration', () => {
    it('should accept onModalOpen prop', () => {
      render(<FloatingActionButton onClick={mockOnClick} onModalOpen={mockOnModalOpen} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toBeInTheDocument();
    });

    it('should call onModalOpen when clicked', async () => {
      const user = userEvent.setup();
      render(<FloatingActionButton onClick={mockOnClick} onModalOpen={mockOnModalOpen} />);
      
      const fabButton = screen.getByRole('button');
      await user.click(fabButton);
      
      expect(mockOnModalOpen).toHaveBeenCalledTimes(1);
    });

    it('should hide when modal is open', () => {
      render(<FloatingActionButton onClick={mockOnClick} isModalOpen={true} />);
      
      const fabButton = screen.queryByRole('button');
      expect(fabButton).not.toBeInTheDocument();
    });

    it('should show when modal is closed', () => {
      render(<FloatingActionButton onClick={mockOnClick} isModalOpen={false} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should meet minimum touch target size (44px)', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      // Should have height and width classes for 44px minimum
      expect(fabButton).toHaveClass('h-12', 'w-12'); // 48px (3rem) meets 44px minimum
    });

    it('should have larger touch target on mobile', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      // Should have responsive sizing
      expect(fabButton).toHaveClass('sm:h-14', 'sm:w-14'); // Larger on tablet/desktop
    });

    it('should have proper padding for touch interaction', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('p-3');
    });
  });

  describe('Animation States', () => {
    it('should have hover transition classes', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('transition-all', 'duration-200');
    });

    it('should have hover state styling', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('hover:scale-110');
    });

    it('should have focus state styling', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('focus:scale-105');
    });

    it('should have active state styling', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('active:scale-95');
    });

    it('should have shadow animation on hover', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('hover:shadow-lg');
    });
  });

  describe('Styling & Appearance', () => {
    it('should have primary background color', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('bg-blue-600');
    });

    it('should have white icon color', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('text-white');
    });

    it('should have proper shadow for elevation', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('shadow-lg');
    });

    it('should have hover color change', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('hover:bg-blue-700');
    });
  });

  describe('Icon Integration', () => {
    it('should render Plus icon with correct size', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const plusIcon = screen.getByTestId('plus-icon');
      expect(plusIcon).toHaveClass('h-6', 'w-6');
    });

    it('should have icon properly centered', () => {
      render(<FloatingActionButton onClick={mockOnClick} />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('Disabled State', () => {
    it('should show disabled styling when disabled', () => {
      render(<FloatingActionButton onClick={mockOnClick} disabled />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('opacity-50');
      expect(fabButton).toBeDisabled();
    });

    it('should not have hover effects when disabled', () => {
      render(<FloatingActionButton onClick={mockOnClick} disabled />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Props Validation', () => {
    it('should accept custom className', () => {
      render(<FloatingActionButton onClick={mockOnClick} className="custom-class" />);
      
      const fabButton = screen.getByRole('button');
      expect(fabButton).toHaveClass('custom-class');
    });

    it('should require onClick prop', () => {
      // This test ensures TypeScript enforces onClick as required
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // @ts-expect-error - Testing required prop
      render(<FloatingActionButton />);
      
      consoleSpy.mockRestore();
    });

    it('should accept testId for testing', () => {
      render(<FloatingActionButton onClick={mockOnClick} data-testid="fab-test" />);
      
      const fabButton = screen.getByTestId('fab-test');
      expect(fabButton).toBeInTheDocument();
    });
  });
});