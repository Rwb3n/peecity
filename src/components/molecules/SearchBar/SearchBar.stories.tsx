/**
 * @fileoverview SearchBar component Storybook stories - Red phase TDD
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import { SearchBar } from './SearchBar';

const meta: Meta<typeof SearchBar> = {
  title: 'Molecules/SearchBar',
  component: SearchBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A search bar component for finding toilet locations. Supports text search, location-based search, and loading states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSearch: { action: 'searched' },
    onLocationRequest: { action: 'location requested' },
    onClear: { action: 'cleared' },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the search input',
    },
    value: {
      control: 'text',
      description: 'Current search value',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading state',
    },
    showLocationButton: {
      control: 'boolean',
      description: 'Shows the "Use my location" button',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the search bar',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default search bar with location button
 */
export const Default: Story = {
  args: {
    placeholder: 'Search for toilets near...',
    showLocationButton: true,
  },
};

/**
 * Search bar in loading state
 */
export const Loading: Story = {
  args: {
    placeholder: 'Search for toilets near...',
    loading: true,
    value: 'Victoria Station',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the search bar while a search is in progress',
      },
    },
  },
};

/**
 * Search bar with an active search value
 */
export const WithInput: Story = {
  args: {
    placeholder: 'Search for toilets near...',
    value: 'Kings Cross Station',
    showLocationButton: true,
  },
};

/**
 * Search bar with error state
 */
export const WithError: Story = {
  args: {
    placeholder: 'Search for toilets near...',
    error: 'Location not found. Please try a different search.',
    value: 'Invalid Location XYZ',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how errors are displayed to users',
      },
    },
  },
};

/**
 * Compact search bar for mobile
 */
export const Mobile: Story = {
  args: {
    placeholder: 'Search...',
    size: 'sm',
    showLocationButton: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Compact version optimized for mobile screens',
      },
    },
  },
};

/**
 * Interactive story demonstrating search flow
 */
export const InteractiveSearch: Story = {
  args: {
    placeholder: 'Search for toilets near...',
    showLocationButton: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Type in search input
    const input = canvas.getByPlaceholderText('Search for toilets near...');
    await userEvent.type(input, 'Paddington Station');
    
    // Click search button
    const searchButton = canvas.getByRole('button', { name: /search/i });
    await userEvent.click(searchButton);
    
    // Verify input value
    await expect(input).toHaveValue('Paddington Station');
  },
};

/**
 * Interactive story demonstrating location request
 */
export const LocationRequest: Story = {
  args: {
    placeholder: 'Search for toilets near...',
    showLocationButton: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click location button
    const locationButton = canvas.getByRole('button', { name: /use my location/i });
    await userEvent.click(locationButton);
  },
};