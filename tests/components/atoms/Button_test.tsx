import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/atoms/Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with text content', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('should render as child element when asChild prop is true', () => {
      render(
        <Button asChild>
          <a href="/link">Link Button</a>
        </Button>
      );
      expect(screen.getByRole('link', { name: 'Link Button' })).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render with primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should render with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('should render with outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'border-input', 'bg-background');
    });

    it('should render with ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    });

    it('should render with link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary', 'underline-offset-4');
    });

    it('should render with destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });
  });

  describe('Sizes', () => {
    it('should render with default (md) size', () => {
      render(<Button>Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'px-4', 'py-2');
    });

    it('should render with sm size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-3');
    });

    it('should render with lg size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'px-8');
    });

    it('should render with icon size for icon-only buttons', () => {
      render(<Button size="icon" aria-label="Settings">⚙️</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'w-11');
    });
  });

  describe('Mobile Ergonomics', () => {
    it('should meet minimum 44px touch target requirement', () => {
      render(<Button>Touch Target</Button>);
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      const height = parseInt(styles.minHeight) || parseInt(styles.height);
      expect(height).toBeGreaterThanOrEqual(44);
    });

    it('should have appropriate padding for thumb interaction', () => {
      render(<Button>Thumb Friendly</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2');
    });

    it('should maintain touch target size even for small variant', () => {
      render(<Button size="sm">Small but Touchable</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[44px]');
    });
  });

  describe('States', () => {
    it('should handle disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('should show loading state with spinner', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
    });

    it('should hide text during loading state when loadingText is not provided', () => {
      render(<Button loading>Submit</Button>);
      expect(screen.queryByText('Submit')).not.toBeVisible();
    });

    it('should show loading text when provided', () => {
      render(<Button loading loadingText="Processing...">Submit</Button>);
      expect(screen.getByText('Processing...')).toBeVisible();
    });
  });

  describe('Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle keyboard navigation (Enter/Space)', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard('[Space]');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard('[Enter]');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Button aria-label="Save document">Save</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Save document');
    });

    it('should support aria-pressed for toggle buttons', () => {
      render(<Button aria-pressed="true">Toggle</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have focus ring for keyboard navigation', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-offset-2');
    });

    it('should announce loading state to screen readers', () => {
      render(<Button loading aria-busy="true">Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should support custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });
});