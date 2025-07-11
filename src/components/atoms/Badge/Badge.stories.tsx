import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile badge component for status indicators, notifications, and labels. Supports multiple variants, sizes, and positioning options.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'destructive', 'success', 'warning'],
      description: 'Visual style variant of the badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the badge',
    },
    position: {
      control: 'select',
      options: [undefined, 'topRight', 'topLeft', 'bottomRight', 'bottomLeft'],
      description: 'Absolute positioning for notification badges',
    },
    dot: {
      control: 'boolean',
      description: 'Show as a dot indicator without text',
    },
    animate: {
      control: 'select',
      options: [undefined, 'pulse', 'bounce'],
      description: 'Animation effect',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Examples
export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const WithNumber: Story = {
  args: {
    children: '5',
  },
};

export const LongText: Story = {
  args: {
    children: 'New Feature',
  },
};

// Variant Examples
export const DefaultVariant: Story = {
  args: {
    children: 'Default',
    variant: 'default',
  },
};

export const SecondaryVariant: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const OutlineVariant: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

export const DestructiveVariant: Story = {
  args: {
    children: 'Error',
    variant: 'destructive',
  },
};

export const SuccessVariant: Story = {
  args: {
    children: 'Success',
    variant: 'success',
  },
};

export const WarningVariant: Story = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
};

// Size Variations
export const SmallBadge: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
};

export const MediumBadge: Story = {
  args: {
    children: 'Medium',
    size: 'md',
  },
};

export const LargeBadge: Story = {
  args: {
    children: 'Large',
    size: 'lg',
  },
};

// Notification Badge Examples
export const NotificationCount: Story = {
  args: {
    children: '3',
    variant: 'destructive',
  },
};

export const HighCount: Story = {
  args: {
    count: 99,
  },
};

export const OverflowCount: Story = {
  args: {
    count: 100,
  },
  parameters: {
    docs: {
      description: {
        story: 'Counts over 99 display as "99+"',
      },
    },
  },
};

export const ZeroCount: Story = {
  args: {
    count: 0,
    showZero: true,
  },
};

export const HiddenZero: Story = {
  args: {
    count: 0,
    showZero: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge is hidden when count is 0 and showZero is false',
      },
    },
  },
};

// Dot Indicator
export const DotIndicator: Story = {
  args: {
    dot: true,
    variant: 'destructive',
  },
};

// Positioning Examples
export const TopRightPosition: Story = {
  render: () => (
    <div className="relative inline-flex p-4 bg-muted rounded">
      <button className="p-2">Icon</button>
      <Badge position="topRight" variant="destructive">3</Badge>
    </div>
  ),
};

export const TopLeftPosition: Story = {
  render: () => (
    <div className="relative inline-flex p-4 bg-muted rounded">
      <button className="p-2">Icon</button>
      <Badge position="topLeft" variant="destructive">New</Badge>
    </div>
  ),
};

export const BottomRightPosition: Story = {
  render: () => (
    <div className="relative inline-flex p-4 bg-muted rounded">
      <button className="p-2">Icon</button>
      <Badge position="bottomRight" variant="success">✓</Badge>
    </div>
  ),
};

export const BottomLeftPosition: Story = {
  render: () => (
    <div className="relative inline-flex p-4 bg-muted rounded">
      <button className="p-2">Icon</button>
      <Badge position="bottomLeft" variant="warning">!</Badge>
    </div>
  ),
};

// Animation Examples
export const PulseAnimation: Story = {
  args: {
    children: 'Live',
    variant: 'destructive',
    animate: 'pulse',
  },
};

export const BounceAnimation: Story = {
  args: {
    children: 'New',
    variant: 'success',
    animate: 'bounce',
  },
};

// Accessibility Examples
export const WithAriaLabel: Story = {
  args: {
    children: '5',
    'aria-label': '5 new notifications',
    role: 'status',
  },
};

export const LiveRegion: Story = {
  args: {
    children: 'Updated',
    'aria-live': 'polite',
    role: 'status',
  },
};

// Use Cases
export const StatusBadges: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge variant="success">Active</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="destructive">Inactive</Badge>
      <Badge variant="secondary">Draft</Badge>
    </div>
  ),
};

export const LabelBadges: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge variant="outline">React</Badge>
      <Badge variant="outline">TypeScript</Badge>
      <Badge variant="outline">Next.js</Badge>
      <Badge variant="outline">TailwindCSS</Badge>
    </div>
  ),
};

export const NotificationBadges: Story = {
  render: () => (
    <div className="flex gap-8">
      <div className="relative">
        <button className="p-3 bg-muted rounded">📧</button>
        <Badge position="topRight" variant="destructive">12</Badge>
      </div>
      <div className="relative">
        <button className="p-3 bg-muted rounded">🔔</button>
        <Badge position="topRight" variant="destructive" dot />
      </div>
      <div className="relative">
        <button className="p-3 bg-muted rounded">💬</button>
        <Badge position="topRight" variant="success">3</Badge>
      </div>
    </div>
  ),
};

// All Variants Grid
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
    </div>
  ),
};

// All Sizes Comparison
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

// With Icons
export const WithLeadingIcon: Story = {
  args: {
    children: (
      <>
        <span className="mr-1">✓</span>
        Verified
      </>
    ),
    variant: 'success',
  },
};

export const WithTrailingIcon: Story = {
  args: {
    children: (
      <>
        Loading
        <span className="ml-1">...</span>
      </>
    ),
    variant: 'secondary',
  },
};