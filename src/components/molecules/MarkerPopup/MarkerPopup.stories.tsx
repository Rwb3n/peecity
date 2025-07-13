/**
 * @fileoverview MarkerPopup component Storybook stories - Red phase TDD
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { MarkerPopup } from './MarkerPopup';

const meta: Meta<typeof MarkerPopup> = {
  title: 'Molecules/MarkerPopup',
  component: MarkerPopup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A popup component that displays toilet information when a marker is clicked on the map.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onDirections: { action: 'directions clicked' },
    onReport: { action: 'report clicked' },
    onShare: { action: 'share clicked' },
    onClose: { action: 'close clicked' },
    toilet: {
      control: 'object',
      description: 'Toilet data to display',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading state for action buttons',
    },
    compact: {
      control: 'boolean',
      description: 'Compact mode for smaller screens',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm mx-auto p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockToilet = {
  id: 'toilet-001',
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

/**
 * Basic popup with essential information
 */
export const Basic: Story = {
  args: {
    toilet: mockToilet,
  },
};

/**
 * Expanded popup showing all details
 */
export const Expanded: Story = {
  args: {
    toilet: mockToilet,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click expand button to show more details
    const expandButton = canvas.getByRole('button', { name: /show more/i });
    await userEvent.click(expandButton);
  },
};

/**
 * Popup for a reported toilet
 */
export const Reported: Story = {
  args: {
    toilet: {
      ...mockToilet,
      reported: true,
      reportedIssue: 'Out of order',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how reported toilets are displayed with warnings',
      },
    },
  },
};

/**
 * Free toilet popup
 */
export const FreeToilet: Story = {
  args: {
    toilet: {
      ...mockToilet,
      fee: 0,
    },
  },
};

/**
 * Inaccessible toilet popup
 */
export const InaccessibleToilet: Story = {
  args: {
    toilet: {
      ...mockToilet,
      accessible: false,
      features: {
        babyChange: false,
        radar: false,
        automatic: false,
      },
    },
  },
};

/**
 * Loading state for action buttons
 */
export const LoadingState: Story = {
  args: {
    toilet: mockToilet,
    loading: true,
  },
};

/**
 * Compact mode for mobile devices
 */
export const CompactMode: Story = {
  args: {
    toilet: mockToilet,
    compact: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Compact view optimized for mobile screens',
      },
    },
  },
};

/**
 * Interactive story demonstrating user actions
 */
export const InteractiveActions: Story = {
  args: {
    toilet: mockToilet,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test directions button
    const directionsButton = canvas.getByRole('button', { name: /directions/i });
    await userEvent.click(directionsButton);
    
    // Test report button
    const reportButton = canvas.getByRole('button', { name: /report issue/i });
    await userEvent.click(reportButton);
    
    // Test expand/collapse
    const expandButton = canvas.getByRole('button', { name: /show more/i });
    await userEvent.click(expandButton);
    
    // Verify expanded state
    await expect(canvas.getByText('Source:')).toBeInTheDocument();
    
    // Collapse again
    const collapseButton = canvas.getByRole('button', { name: /show less/i });
    await userEvent.click(collapseButton);
  },
};

/**
 * Popup with all features
 */
export const FullFeatured: Story = {
  args: {
    toilet: {
      ...mockToilet,
      features: {
        babyChange: true,
        radar: true,
        automatic: true,
        contactless: true,
      },
    },
  },
};