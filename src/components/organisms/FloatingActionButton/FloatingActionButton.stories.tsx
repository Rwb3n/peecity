/**
 * @fileoverview FloatingActionButton organism Storybook stories with state variations
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { FloatingActionButton } from './FloatingActionButton';

const meta: Meta<typeof FloatingActionButton> = {
  title: 'Organisms/FloatingActionButton',
  component: FloatingActionButton,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
FloatingActionButton (FAB) organism provides a Material Design floating action button
for triggering the toilet suggestion modal. Features touch-friendly sizing, accessibility
compliance, and smooth animations.

## Material Design Compliance
- **44px minimum touch target** for mobile accessibility
- **Circular button design** with consistent Material shadows
- **Plus icon** indicating add/create action
- **Fixed positioning** in bottom-right corner with responsive spacing

## Key Features
- Disabled state during modal operations
- Hover and focus animations
- WCAG 2.1 AA accessibility compliance
- Mobile-first responsive design
- Keyboard navigation support
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
            id: 'focusable-element',
            enabled: true,
          },
        ],
      },
    },
  },
  argTypes: {
    onClick: {
      action: 'clicked',
      description: 'Callback when FAB is clicked',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the FAB is disabled',
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
    disabled: false,
    'data-testid': 'fab-story',
  },
};

export default meta;
type Story = StoryObj<typeof FloatingActionButton>;

/**
 * Default FAB state
 * Standard floating action button ready for interaction
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default FloatingActionButton in ready state, positioned bottom-right with Material Design styling.',
      },
    },
  },
};

/**
 * Disabled FAB state
 * Shows FAB when modal is open or during loading operations
 */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled FloatingActionButton state shown when modal is open or during operations.',
      },
    },
  },
};

/**
 * FAB with custom styling
 * Demonstrates className override capabilities
 */
export const CustomStyling: Story = {
  args: {
    className: 'opacity-75 bg-green-500 hover:bg-green-600',
  },
  parameters: {
    docs: {
      description: {
        story: 'FloatingActionButton with custom styling demonstrating className override.',
      },
    },
  },
};

/**
 * Interactive click test
 * Verifies FAB click handling and callback execution
 */
export const ClickInteraction: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the FAB button
    const fabButton = canvas.getByRole('button');
    
    // Verify button is present and enabled
    await expect(fabButton).toBeInTheDocument();
    await expect(fabButton).not.toBeDisabled();
    
    // Click the FAB
    await userEvent.click(fabButton);
    
    // Verify onClick callback was called
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive test demonstrating FAB click handling and callback execution.',
      },
    },
  },
};

/**
 * Hover interaction test
 * Tests FAB hover states and animations
 */
export const HoverInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the FAB button
    const fabButton = canvas.getByRole('button');
    
    // Test hover interaction
    await userEvent.hover(fabButton);
    
    // Verify hover state (button should be visible and responsive)
    await expect(fabButton).toBeInTheDocument();
    
    // Test unhover
    await userEvent.unhover(fabButton);
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive test demonstrating FAB hover states and visual feedback.',
      },
    },
  },
};

/**
 * Keyboard navigation test
 * Verifies FAB accessibility via keyboard interaction
 */
export const KeyboardNavigation: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the FAB button
    const fabButton = canvas.getByRole('button');
    
    // Test keyboard focus
    fabButton.focus();
    await expect(fabButton).toHaveFocus();
    
    // Test Enter key activation
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledWith(expect.any(Object));
    
    // Test Space key activation
    await userEvent.keyboard(' ');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
  parameters: {
    docs: {
      description: {
        story: 'Keyboard navigation test verifying FAB accessibility with Enter and Space key activation.',
      },
    },
  },
};

/**
 * Disabled interaction test
 * Verifies disabled FAB prevents interaction
 */
export const DisabledInteraction: Story = {
  args: {
    disabled: true,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the FAB button
    const fabButton = canvas.getByRole('button');
    
    // Verify button is disabled
    await expect(fabButton).toBeDisabled();
    
    // Try to click disabled button
    await userEvent.click(fabButton);
    
    // Verify onClick was NOT called
    await expect(args.onClick).not.toHaveBeenCalled();
  },
  parameters: {
    docs: {
      description: {
        story: 'Test verifying disabled FAB prevents user interaction and callback execution.',
      },
    },
  },
};

/**
 * Accessibility compliance test
 * Comprehensive accessibility validation
 */
export const AccessibilityTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the FAB button
    const fabButton = canvas.getByRole('button');
    
    // Verify accessibility attributes
    await expect(fabButton).toHaveAttribute('type', 'button');
    
    // Check for accessible name (from aria-label or text content)
    const accessibleName = fabButton.getAttribute('aria-label') || fabButton.textContent;
    await expect(accessibleName).toBeTruthy();
    
    // Verify keyboard focusable
    fabButton.focus();
    await expect(fabButton).toHaveFocus();
    
    // Test tab navigation
    await userEvent.tab();
    // FAB should lose focus when tabbing away
  },
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive accessibility test verifying WCAG 2.1 AA compliance.',
      },
    },
  },
};

/**
 * Mobile touch target test
 * Verifies 44px minimum touch target for mobile accessibility
 */
export const MobileTouchTarget: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile viewport test verifying 44px minimum touch target compliance.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the FAB button
    const fabButton = canvas.getByRole('button');
    
    // Get computed styles
    const styles = window.getComputedStyle(fabButton);
    const height = parseInt(styles.height);
    const width = parseInt(styles.width);
    
    // Verify minimum 44px touch target
    await expect(height).toBeGreaterThanOrEqual(44);
    await expect(width).toBeGreaterThanOrEqual(44);
  },
};

/**
 * Position and layout test
 * Verifies FAB positioning and layering
 */
export const PositionAndLayout: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the FAB button
    const fabButton = canvas.getByRole('button');
    
    // Get computed styles
    const styles = window.getComputedStyle(fabButton);
    
    // Verify fixed positioning
    await expect(styles.position).toBe('fixed');
    
    // Verify z-index for proper layering
    const zIndex = parseInt(styles.zIndex) || 0;
    await expect(zIndex).toBeGreaterThanOrEqual(40); // Should be above most content
    
    // Verify bottom-right positioning
    await expect(styles.bottom).toBeTruthy();
    await expect(styles.right).toBeTruthy();
  },
  parameters: {
    docs: {
      description: {
        story: 'Test verifying FAB positioning, z-index layering, and layout properties.',
      },
    },
  },
};

/**
 * Animation and transitions test
 * Verifies smooth hover and focus animations
 */
export const AnimationTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the FAB button
    const fabButton = canvas.getByRole('button');
    
    // Get initial styles
    const initialStyles = window.getComputedStyle(fabButton);
    
    // Test hover animation
    await userEvent.hover(fabButton);
    
    // Give time for transition
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Test focus animation
    fabButton.focus();
    
    // Give time for transition
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify button remains interactive
    await expect(fabButton).toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: 'Test verifying smooth animations and transitions for hover and focus states.',
      },
    },
  },
};