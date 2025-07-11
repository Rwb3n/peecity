import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A mobile-optimized input component with various types, sizes, and states. Features 44px minimum touch targets and comprehensive accessibility support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url', 'date', 'time'],
      description: 'HTML input type',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the input',
    },
    error: {
      control: 'boolean',
      description: 'Shows error state styling',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the input',
    },
    readOnly: {
      control: 'boolean',
      description: 'Makes the input read-only',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Examples
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithValue: Story = {
  args: {
    value: 'Hello world',
    onChange: () => {},
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <label htmlFor="example-input">Username</label>
      <Input id="example-input" placeholder="Enter username" />
    </div>
  ),
};

// Input Types
export const TextInput: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text',
  },
};

export const EmailInput: Story = {
  args: {
    type: 'email',
    placeholder: 'name@example.com',
  },
};

export const PasswordInput: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const NumberInput: Story = {
  args: {
    type: 'number',
    placeholder: '0',
    min: 0,
    max: 100,
    step: 5,
  },
};

export const SearchInput: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
};

export const TelInput: Story = {
  args: {
    type: 'tel',
    placeholder: '+1 (555) 000-0000',
  },
};

export const UrlInput: Story = {
  args: {
    type: 'url',
    placeholder: 'https://example.com',
  },
};

// Size Variations
export const SmallInput: Story = {
  args: {
    size: 'sm',
    placeholder: 'Small input',
  },
};

export const MediumInput: Story = {
  args: {
    size: 'md',
    placeholder: 'Medium input (default)',
  },
};

export const LargeInput: Story = {
  args: {
    size: 'lg',
    placeholder: 'Large input',
  },
};

// States
export const DisabledInput: Story = {
  args: {
    disabled: true,
    value: 'Disabled input',
  },
};

export const ReadOnlyInput: Story = {
  args: {
    readOnly: true,
    value: 'Read-only input',
  },
};

export const ErrorState: Story = {
  args: {
    error: true,
    value: 'Invalid input',
  },
};

export const ErrorWithMessage: Story = {
  args: {
    error: true,
    errorMessage: 'This field is required',
    placeholder: 'Required field',
  },
};

// Form Integration
export const WithValidation: Story = {
  args: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: '[A-Za-z]+',
    placeholder: 'Letters only, 3-20 chars',
  },
};

export const WithAutoComplete: Story = {
  args: {
    autoComplete: 'email',
    type: 'email',
    placeholder: 'Email with autocomplete',
  },
};

// Accessibility Examples
export const WithAriaLabel: Story = {
  args: {
    'aria-label': 'Search products',
    type: 'search',
    placeholder: 'Search...',
  },
};

export const WithHelpText: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Input 
        aria-describedby="email-help" 
        type="email"
        placeholder="Enter email"
      />
      <span id="email-help" className="text-sm text-muted-foreground">
        We'll never share your email with anyone else.
      </span>
    </div>
  ),
};

// Mobile Ergonomics
export const MobileOptimized: Story = {
  args: {
    placeholder: 'Touch-friendly input (44px min height)',
  },
  parameters: {
    docs: {
      description: {
        story: 'All inputs are optimized for mobile with minimum 44px touch targets.',
      },
    },
  },
};

// Interactive Examples
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Input placeholder="Default state" />
      <Input placeholder="Hover state" className="hover" />
      <Input placeholder="Focus state" className="focus" />
      <Input placeholder="Disabled state" disabled />
      <Input placeholder="Error state" error />
      <Input value="Read-only state" readOnly />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Input size="sm" placeholder="Small input" />
      <Input size="md" placeholder="Medium input (default)" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="flex flex-col gap-4 w-80">
      <div>
        <label htmlFor="name" className="block mb-2">Name</label>
        <Input id="name" required placeholder="John Doe" />
      </div>
      <div>
        <label htmlFor="email" className="block mb-2">Email</label>
        <Input id="email" type="email" required placeholder="john@example.com" />
      </div>
      <div>
        <label htmlFor="password" className="block mb-2">Password</label>
        <Input id="password" type="password" required placeholder="••••••••" />
      </div>
      <div>
        <label htmlFor="phone" className="block mb-2">Phone</label>
        <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
      </div>
    </form>
  ),
};