import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and states. Designed with mobile-first ergonomics and WCAG 2.1 AA compliance.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'link', 'destructive'],
      description: 'Visual style variant of the button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
      description: 'Size of the button',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner and disables interaction',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
    asChild: {
      control: 'boolean',
      description: 'Renders as child component (e.g., for link buttons)',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Primary Stories
export const Default: Story = {
  args: {
    children: 'Click me',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Link: Story = {
  args: {
    children: 'Link Button',
    variant: 'link',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
  },
};

// Size Variations
export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    children: 'Medium Button',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};

export const IconButton: Story = {
  args: {
    children: '⚙️',
    size: 'icon',
    'aria-label': 'Settings',
  },
};

// State Variations
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    children: 'Submit',
    loading: true,
  },
};

export const LoadingWithText: Story = {
  args: {
    children: 'Submit',
    loading: true,
    loadingText: 'Processing...',
  },
};

// Mobile Ergonomics Showcase
export const MobileTouch: Story = {
  args: {
    children: 'Mobile Optimized',
  },
  parameters: {
    docs: {
      description: {
        story: 'All buttons meet the 44px minimum touch target requirement for mobile devices.',
      },
    },
  },
};

// Accessibility Examples
export const WithAriaLabel: Story = {
  args: {
    children: '❤️',
    'aria-label': 'Add to favorites',
  },
};

export const ToggleButton: Story = {
  args: {
    children: 'Toggle',
    'aria-pressed': 'false',
  },
};

// As Child Example
export const AsLink: Story = {
  args: {
    asChild: true,
    children: <a href="#link">I'm actually a link</a>,
  },
};

// Interactive Examples
export const InteractiveStates: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button>Default</Button>
      <Button className="hover">Hover</Button>
      <Button className="focus">Focus</Button>
      <Button className="active">Active</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};

// All Variants Grid
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};

// All Sizes Comparison
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Icon">📱</Button>
    </div>
  ),
};

// Loading States
export const LoadingStates: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button loading>Loading</Button>
      <Button loading loadingText="Saving...">Save</Button>
      <Button loading variant="secondary">Secondary</Button>
      <Button loading variant="outline">Outline</Button>
    </div>
  ),
};