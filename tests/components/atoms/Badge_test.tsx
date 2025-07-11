import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/atoms/Badge';

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('should render badge with text content', () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should render as span element by default', () => {
      render(<Badge>Label</Badge>);
      const badge = screen.getByText('Label');
      expect(badge.tagName).toBe('SPAN');
    });

    it('should handle numeric content', () => {
      render(<Badge>99</Badge>);
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('should handle long text with proper wrapping', () => {
      render(<Badge>Very Long Badge Text</Badge>);
      const badge = screen.getByText('Very Long Badge Text');
      expect(badge).toHaveClass('whitespace-nowrap');
    });
  });

  describe('Variants', () => {
    it('should render with default variant', () => {
      render(<Badge>Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should render with secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('should render with outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('border', 'text-foreground');
    });

    it('should render with destructive variant', () => {
      render(<Badge variant="destructive">Error</Badge>);
      const badge = screen.getByText('Error');
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('should render with success variant', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-green-500', 'text-white');
    });

    it('should render with warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('bg-yellow-500', 'text-yellow-900');
    });
  });

  describe('Sizes', () => {
    it('should render with default (md) size', () => {
      render(<Badge>Medium</Badge>);
      const badge = screen.getByText('Medium');
      expect(badge).toHaveClass('h-6', 'px-2.5', 'text-xs');
    });

    it('should render with sm size', () => {
      render(<Badge size="sm">Small</Badge>);
      const badge = screen.getByText('Small');
      expect(badge).toHaveClass('h-5', 'px-2', 'text-xs');
    });

    it('should render with lg size', () => {
      render(<Badge size="lg">Large</Badge>);
      const badge = screen.getByText('Large');
      expect(badge).toHaveClass('h-7', 'px-3', 'text-sm');
    });
  });

  describe('Badge Positioning', () => {
    it('should support absolute positioning for notifications', () => {
      render(
        <div className="relative">
          <button>Icon</button>
          <Badge position="topRight">3</Badge>
        </div>
      );
      const badge = screen.getByText('3');
      expect(badge).toHaveClass('absolute', '-top-2', '-right-2');
    });

    it('should support top-left positioning', () => {
      render(<Badge position="topLeft">New</Badge>);
      const badge = screen.getByText('New');
      expect(badge).toHaveClass('absolute', '-top-2', '-left-2');
    });

    it('should support bottom-right positioning', () => {
      render(<Badge position="bottomRight">5</Badge>);
      const badge = screen.getByText('5');
      expect(badge).toHaveClass('absolute', '-bottom-2', '-right-2');
    });

    it('should support bottom-left positioning', () => {
      render(<Badge position="bottomLeft">!</Badge>);
      const badge = screen.getByText('!');
      expect(badge).toHaveClass('absolute', '-bottom-2', '-left-2');
    });
  });

  describe('Notification Patterns', () => {
    it('should render as dot indicator when empty', () => {
      render(<Badge dot />);
      const badge = screen.getByTestId('badge-dot');
      expect(badge).toHaveClass('h-2', 'w-2', 'p-0');
    });

    it('should handle count overflow (99+)', () => {
      render(<Badge count={100} />);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('should hide badge when count is 0 and showZero is false', () => {
      const { container } = render(<Badge count={0} showZero={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should show badge when count is 0 and showZero is true', () => {
      render(<Badge count={0} showZero />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support aria-label for screen readers', () => {
      render(<Badge aria-label="3 new notifications">3</Badge>);
      const badge = screen.getByLabelText('3 new notifications');
      expect(badge).toBeInTheDocument();
    });

    it('should have role="status" for notification badges', () => {
      render(<Badge role="status">New</Badge>);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
    });

    it('should support aria-live for dynamic updates', () => {
      render(<Badge aria-live="polite">5</Badge>);
      const badge = screen.getByText('5');
      expect(badge).toHaveAttribute('aria-live', 'polite');
    });

    it('should be keyboard focusable when interactive', () => {
      render(<Badge tabIndex={0}>Clickable</Badge>);
      const badge = screen.getByText('Clickable');
      expect(badge).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Styling', () => {
    it('should have rounded corners', () => {
      render(<Badge>Rounded</Badge>);
      const badge = screen.getByText('Rounded');
      expect(badge).toHaveClass('rounded-full');
    });

    it('should support custom className', () => {
      render(<Badge className="custom-badge">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('custom-badge');
    });

    it('should have proper font weight', () => {
      render(<Badge>Bold</Badge>);
      const badge = screen.getByText('Bold');
      expect(badge).toHaveClass('font-semibold');
    });

    it('should center content', () => {
      render(<Badge>Centered</Badge>);
      const badge = screen.getByText('Centered');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });
  });

  describe('Icon Support', () => {
    it('should render with leading icon', () => {
      render(
        <Badge>
          <span className="mr-1">✓</span>
          Complete
        </Badge>
      );
      expect(screen.getByText('Complete')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should render with trailing icon', () => {
      render(
        <Badge>
          Loading
          <span className="ml-1">...</span>
        </Badge>
      );
      expect(screen.getByText('Loading')).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should support pulse animation for attention', () => {
      render(<Badge animate="pulse">Alert</Badge>);
      const badge = screen.getByText('Alert');
      expect(badge).toHaveClass('animate-pulse');
    });

    it('should support bounce animation', () => {
      render(<Badge animate="bounce">New</Badge>);
      const badge = screen.getByText('New');
      expect(badge).toHaveClass('animate-bounce');
    });
  });
});