import React from 'react';
import { render, screen } from '@testing-library/react';
import { Icon } from '@/components/atoms/Icon';
import { Search, Menu, X, ChevronRight, Check } from 'lucide-react';

describe('Icon Component', () => {
  describe('Rendering', () => {
    it('should render an icon component', () => {
      render(<Icon icon={Search} />);
      const icon = screen.getByTestId('icon-wrapper');
      expect(icon).toBeInTheDocument();
    });

    it('should render the passed Lucide icon', () => {
      render(<Icon icon={Menu} aria-label="Menu" />);
      const icon = screen.getByLabelText('Menu');
      expect(icon).toBeInTheDocument();
    });

    it('should pass through icon props', () => {
      render(<Icon icon={X} strokeWidth={3} />);
      const svg = screen.getByTestId('icon-wrapper').querySelector('svg');
      expect(svg).toHaveAttribute('stroke-width', '3');
    });
  });

  describe('Sizes', () => {
    it('should render with default (md) size', () => {
      render(<Icon icon={Search} />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('h-5', 'w-5');
    });

    it('should render with sm size', () => {
      render(<Icon icon={Search} size="sm" />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('h-4', 'w-4');
    });

    it('should render with lg size', () => {
      render(<Icon icon={Search} size="lg" />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('h-6', 'w-6');
    });

    it('should render with xl size', () => {
      render(<Icon icon={Search} size="xl" />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('h-8', 'w-8');
    });
  });

  describe('Colors', () => {
    it('should render with default color', () => {
      render(<Icon icon={Check} />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('text-current');
    });

    it('should render with primary color', () => {
      render(<Icon icon={Check} color="primary" />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('text-primary');
    });

    it('should render with secondary color', () => {
      render(<Icon icon={Check} color="secondary" />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('text-secondary');
    });

    it('should render with muted color', () => {
      render(<Icon icon={Check} color="muted" />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('text-muted-foreground');
    });

    it('should render with destructive color', () => {
      render(<Icon icon={X} color="destructive" />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('text-destructive');
    });
  });

  describe('Mobile Ergonomics', () => {
    it('should have touch-friendly wrapper for interactive icons', () => {
      render(<Icon icon={Menu} interactive />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    });

    it('should center icon within touch target', () => {
      render(<Icon icon={Menu} interactive />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should have appropriate padding for touch targets', () => {
      render(<Icon icon={Menu} interactive />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('p-2');
    });
  });

  describe('Accessibility', () => {
    it('should be decorative by default (aria-hidden)', () => {
      render(<Icon icon={Search} />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });

    it('should support aria-label for meaningful icons', () => {
      render(<Icon icon={Search} aria-label="Search" />);
      const icon = screen.getByLabelText('Search');
      expect(icon).not.toHaveAttribute('aria-hidden');
      expect(icon).toHaveAttribute('role', 'img');
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Icon icon={ChevronRight} aria-describedby="next-desc" aria-label="Next" />
          <span id="next-desc">Go to next page</span>
        </>
      );
      const icon = screen.getByLabelText('Next');
      expect(icon).toHaveAttribute('aria-describedby', 'next-desc');
    });

    it('should have role="img" when aria-label is provided', () => {
      render(<Icon icon={Menu} aria-label="Open menu" />);
      const icon = screen.getByRole('img', { name: 'Open menu' });
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should support custom className', () => {
      render(<Icon icon={Search} className="custom-icon" />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('custom-icon');
    });

    it('should combine size and color classes', () => {
      render(<Icon icon={Check} size="lg" color="primary" />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('h-6', 'w-6', 'text-primary');
    });

    it('should support inline style prop', () => {
      render(<Icon icon={Search} style={{ opacity: 0.5 }} />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveStyle({ opacity: '0.5' });
    });
  });

  describe('Animation', () => {
    it('should support spin animation', () => {
      render(<Icon icon={Search} animate="spin" />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('animate-spin');
    });

    it('should support pulse animation', () => {
      render(<Icon icon={Search} animate="pulse" />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('animate-pulse');
    });

    it('should support bounce animation', () => {
      render(<Icon icon={Search} animate="bounce" />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('animate-bounce');
    });
  });

  describe('Interactive States', () => {
    it('should have hover styles when interactive', () => {
      render(<Icon icon={Menu} interactive />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    });

    it('should have focus styles when interactive', () => {
      render(<Icon icon={Menu} interactive />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-offset-2');
    });

    it('should have cursor pointer when interactive', () => {
      render(<Icon icon={Menu} interactive />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('cursor-pointer');
    });

    it('should have rounded corners for interactive icons', () => {
      render(<Icon icon={Menu} interactive />);
      const wrapper = screen.getByTestId('icon-wrapper');
      expect(wrapper).toHaveClass('rounded-md');
    });
  });
});