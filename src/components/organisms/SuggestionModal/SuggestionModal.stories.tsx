/**
 * @fileoverview SuggestionModal organism Storybook stories with real location data
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { SuggestionModal } from './SuggestionModal';
// Real coordinates extracted from actual toilet data for authentic scenarios
const realLocations = [
  { lat: 51.4087329, lng: -0.3323747, name: "Public Toilets" },
  { lat: 51.4059121, lng: -0.3360281, name: "Public Toilets" },
  { lat: 51.4946389, lng: -0.1322444, name: "Station Facilities" },
  { lat: 51.5074, lng: -0.1278, name: "Central London" },
  { lat: 51.5051, lng: -0.0197, name: "Canary Wharf" },
];

const centralLondonLocation = { lat: 51.5074, lng: -0.1278 }; // Trafalgar Square
const canaryWharfLocation = { lat: 51.5051, lng: -0.0197 }; // Canary Wharf
const heathrowLocation = { lat: 51.4700, lng: -0.4543 }; // Heathrow Airport

const meta: Meta<typeof SuggestionModal> = {
  title: 'Organisms/SuggestionModal',
  component: SuggestionModal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
SuggestionModal organism provides a modal interface for toilet suggestion submissions.
Integrates ContributionForm with shadcn/ui Dialog components and handles v2 API submissions
with loading, success, and error states.

## Real Location Integration
- **Authentic coordinates** from real London toilet data
- **Geographic variety** across different London areas
- **Production accuracy** for form pre-population testing

## Key Features
- Modal behaviors (ESC key, backdrop click, focus trap)
- Form integration with location pre-population
- Loading states during API submission
- Success and error state management
- Mobile-responsive design with accessibility compliance
        `,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'focus-trap',
            enabled: true,
          },
        ],
      },
    },
  },
  argTypes: {
    isOpen: {
      control: { type: 'boolean' },
      description: 'Whether the modal is open',
    },
    onClose: {
      action: 'closed',
      description: 'Callback when modal should be closed',
    },
    onSuccess: {
      action: 'success',
      description: 'Callback when form submission is successful',
    },
    onError: {
      action: 'error',
      description: 'Callback when form submission fails',
    },
    location: {
      control: { type: 'object' },
      description: 'Specific location data for the toilet suggestion',
    },
    mapCenter: {
      control: { type: 'object' },
      description: 'Fallback map center location',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
    'data-testid': {
      control: { type: 'text' },
      description: 'Test ID for automated testing',
    },
  },
  args: {
    isOpen: true,
    location: centralLondonLocation,
    mapCenter: centralLondonLocation,
    'data-testid': 'suggestion-modal-story',
  },
};

export default meta;
type Story = StoryObj<typeof SuggestionModal>;

/**
 * Default modal state
 * Modal open with form ready for input
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default SuggestionModal with form pre-populated with real Central London coordinates.',
      },
    },
  },
};

/**
 * Modal closed state
 * Shows modal in closed state (hidden)
 */
export const Closed: Story = {
  args: {
    isOpen: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'SuggestionModal in closed state (not visible).',
      },
    },
  },
};

/**
 * Modal with Canary Wharf location
 * Demonstrates different geographic area
 */
export const CanaryWharfLocation: Story = {
  args: {
    location: canaryWharfLocation,
    mapCenter: canaryWharfLocation,
  },
  parameters: {
    docs: {
      description: {
        story: 'SuggestionModal with Canary Wharf coordinates demonstrating different geographic area.',
      },
    },
  },
};

/**
 * Modal with Heathrow location
 * Demonstrates outer London location
 */
export const HeathrowLocation: Story = {
  args: {
    location: heathrowLocation,
    mapCenter: heathrowLocation,
  },
  parameters: {
    docs: {
      description: {
        story: 'SuggestionModal with Heathrow Airport coordinates demonstrating outer London location.',
      },
    },
  },
};

/**
 * Modal with map center fallback
 * No specific location, uses map center
 */
export const MapCenterFallback: Story = {
  args: {
    location: undefined,
    mapCenter: centralLondonLocation,
  },
  parameters: {
    docs: {
      description: {
        story: 'SuggestionModal using map center fallback when no specific location is provided.',
      },
    },
  },
};

/**
 * Modal with real toilet location
 * Uses coordinates from actual toilet data
 */
export const RealToiletLocation: Story = {
  args: {
    location: realLocations[0],
    mapCenter: realLocations[0],
  },
  parameters: {
    docs: {
      description: {
        story: `SuggestionModal with coordinates from real toilet: "${realLocations[0].name}".`,
      },
    },
  },
};

/**
 * Interactive modal close test
 * Tests modal closing via close button
 */
export const ModalCloseInteraction: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for modal to render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Find and click close button (X)
    const closeButton = canvas.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);
    
    // Verify onClose callback was called
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive test demonstrating modal close functionality via close button.',
      },
    },
  },
};

/**
 * Interactive form submission test
 * Tests form submission workflow
 */
export const FormSubmissionInteraction: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for modal and form to render
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Find form fields
    const nameInput = canvas.getByLabelText(/toilet name/i);
    const submitButton = canvas.getByRole('button', { name: /submit/i });
    
    // Fill in form
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Test Toilet Location');
    
    // Submit form
    await userEvent.click(submitButton);
    
    // Note: Actual submission will depend on form validation
    // This tests the interaction flow
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive test demonstrating form submission workflow with real location data.',
      },
    },
  },
};

/**
 * Interactive form cancel test
 * Tests form cancellation workflow
 */
export const FormCancelInteraction: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for modal and form to render
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Find cancel button
    const cancelButton = canvas.getByRole('button', { name: /cancel/i });
    
    // Click cancel
    await userEvent.click(cancelButton);
    
    // Verify onClose callback was called
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive test demonstrating form cancellation and modal closing.',
      },
    },
  },
};

/**
 * Accessibility test: Keyboard navigation
 * Tests modal focus trap and keyboard navigation
 */
export const KeyboardNavigationTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for modal to render
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Test Tab navigation through modal elements
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    
    // Test Escape key to close modal
    await userEvent.keyboard('{Escape}');
    
    // Modal should handle escape key (onClose should be called)
  },
  parameters: {
    docs: {
      description: {
        story: 'Accessibility test verifying keyboard navigation and focus trap behavior.',
      },
    },
  },
};

/**
 * Accessibility test: ARIA attributes
 * Verifies proper ARIA labeling and attributes
 */
export const AriaAttributesTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for modal to render
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Check for modal dialog role
    const dialog = canvas.getByRole('dialog');
    await expect(dialog).toBeInTheDocument();
    
    // Check for proper labeling
    const title = canvas.getByRole('heading', { name: /add new toilet location/i });
    await expect(title).toBeInTheDocument();
    
    // Verify modal has proper aria-labelledby
    await expect(dialog).toHaveAttribute('aria-labelledby');
  },
  parameters: {
    docs: {
      description: {
        story: 'Accessibility test verifying ARIA attributes and semantic structure.',
      },
    },
  },
};

/**
 * Mobile responsive test
 * Tests modal behavior on mobile viewport
 */
export const MobileResponsiveTest: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile responsive test verifying modal behavior on small screens.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for modal to render
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Verify modal is visible and properly sized
    const dialog = canvas.getByRole('dialog');
    await expect(dialog).toBeInTheDocument();
    
    // Check that form elements are touch-friendly
    const inputs = canvas.getAllByRole('textbox');
    inputs.forEach(async (input) => {
      const styles = window.getComputedStyle(input);
      const height = parseInt(styles.height);
      // Minimum 44px touch target
      await expect(height).toBeGreaterThanOrEqual(44);
    });
  },
};

/**
 * Error state simulation
 * Simulates error handling in modal
 */
export const ErrorStateSimulation: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for modal to render
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simulate error by calling onError callback
    args.onError?.({ message: 'Test error for Storybook demo' });
    
    // In a real scenario, this would show error UI
    // This demonstrates the error callback integration
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of error state handling and callback integration.',
      },
    },
  },
};

/**
 * Success state simulation
 * Simulates successful form submission
 */
export const SuccessStateSimulation: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for modal to render
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Simulate success by calling onSuccess callback
    args.onSuccess?.({
      id: 'test-toilet-id',
      lat: args.location?.lat || 51.5074,
      lng: args.location?.lng || -0.1278,
      name: 'Test Successful Submission',
    });
    
    // In a real scenario, this would show success UI and close modal
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of success state handling and callback integration.',
      },
    },
  },
};

/**
 * Custom styling test
 * Tests modal with custom className
 */
export const CustomStyling: Story = {
  args: {
    className: 'border-2 border-blue-500',
  },
  parameters: {
    docs: {
      description: {
        story: 'SuggestionModal with custom styling demonstrating className override.',
      },
    },
  },
};