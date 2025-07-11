import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/atoms/Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with default type="text"', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Input Types', () => {
    it('should render email input', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<Input type="password" placeholder="Password" />);
      const input = screen.getByPlaceholderText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render search input', () => {
      render(<Input type="search" />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should render tel input', () => {
      render(<Input type="tel" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('should render url input', () => {
      render(<Input type="url" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });
  });

  describe('Sizes', () => {
    it('should render with default (md) size', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-11');
    });

    it('should render with sm size', () => {
      render(<Input size="sm" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-9');
    });

    it('should render with lg size', () => {
      render(<Input size="lg" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-12');
    });
  });

  describe('Mobile Ergonomics', () => {
    it('should meet minimum 44px touch target requirement', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('min-h-[44px]');
    });

    it('should have appropriate padding for thumb typing', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('px-3', 'py-2');
    });

    it('should have larger font size for mobile readability', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('text-base');
    });
  });

  describe('States', () => {
    it('should handle disabled state', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('should handle error state', () => {
      render(<Input error />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-destructive', 'focus-visible:ring-destructive');
    });

    it('should handle readonly state', () => {
      render(<Input readOnly value="Read only" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveValue('Read only');
    });

    it('should show error message when provided', () => {
      render(<Input error errorMessage="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByText('This field is required')).toHaveClass('text-destructive');
    });
  });

  describe('Interactions', () => {
    it('should handle value changes', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'Hello');
      expect(handleChange).toHaveBeenCalledTimes(5);
      expect(input).toHaveValue('Hello');
    });

    it('should handle focus events', () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should handle blur events', () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.blur(input);
      
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle paste events', async () => {
      const handlePaste = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onPaste={handlePaste} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      await user.paste('Pasted text');
      
      expect(handlePaste).toHaveBeenCalled();
      expect(input).toHaveValue('Pasted text');
    });
  });

  describe('Validation', () => {
    it('should support HTML5 validation attributes', () => {
      render(
        <Input
          required
          minLength={3}
          maxLength={10}
          pattern="[A-Za-z]+"
        />
      );
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('minlength', '3');
      expect(input).toHaveAttribute('maxlength', '10');
      expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
    });

    it('should support min/max for number inputs', () => {
      render(<Input type="number" min={0} max={100} step={5} />);
      const input = screen.getByRole('spinbutton');
      
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
      expect(input).toHaveAttribute('step', '5');
    });
  });

  describe('Accessibility', () => {
    it('should support aria-label', () => {
      render(<Input aria-label="Email address" />);
      const input = screen.getByLabelText('Email address');
      expect(input).toBeInTheDocument();
    });

    it('should support aria-describedby for help text', () => {
      render(
        <>
          <Input aria-describedby="email-help" />
          <span id="email-help">Enter your email address</span>
        </>
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'email-help');
    });

    it('should have aria-invalid when in error state', () => {
      render(<Input error />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have focus ring for keyboard navigation', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-offset-2');
    });

    it('should support autocomplete attribute', () => {
      render(<Input autoComplete="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autocomplete', 'email');
    });

    it('should support custom className', () => {
      render(<Input className="custom-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-input');
    });
  });

  describe('Form Integration', () => {
    it('should work with form labels', () => {
      render(
        <div>
          <label htmlFor="email">Email</label>
          <Input id="email" />
        </div>
      );
      const input = screen.getByLabelText('Email');
      expect(input).toBeInTheDocument();
    });

    it('should support name attribute for form submission', () => {
      render(<Input name="username" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'username');
    });

    it('should support placeholder text', () => {
      render(<Input placeholder="Enter your name" />);
      const input = screen.getByPlaceholderText('Enter your name');
      expect(input).toBeInTheDocument();
    });
  });
});