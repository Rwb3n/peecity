/**
 * @fileoverview ContributionForm component Storybook stories - Red phase TDD
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, waitFor, expect } from '@storybook/test';
import { ContributionForm } from './ContributionForm';

const meta: Meta<typeof ContributionForm> = {
  title: 'Molecules/ContributionForm',
  component: ContributionForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A form component for users to contribute new toilet locations to the database.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: { action: 'submitted' },
    onCancel: { action: 'cancelled' },
    onSuccess: { action: 'success' },
    location: {
      control: 'object',
      description: 'Pre-filled location coordinates',
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading state during submission',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md mx-auto p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultLocation = {
  lat: 51.5074,
  lng: -0.1278,
};

/**
 * Empty form ready for input
 */
export const Empty: Story = {
  args: {
    location: defaultLocation,
  },
};

/**
 * Form with all fields filled
 */
export const Filled: Story = {
  args: {
    location: defaultLocation,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Fill in the form
    const nameInput = canvas.getByLabelText(/toilet name/i);
    await userEvent.type(nameInput, 'Victoria Park Public Toilet');
    
    const hoursSelect = canvas.getByLabelText(/opening hours/i);
    await userEvent.selectOptions(hoursSelect, '24/7');
    
    const accessibleCheckbox = canvas.getByLabelText(/wheelchair accessible/i);
    await userEvent.click(accessibleCheckbox);
    
    const babyChangeCheckbox = canvas.getByLabelText(/baby changing/i);
    await userEvent.click(babyChangeCheckbox);
    
    const feeInput = canvas.getByLabelText(/usage fee/i);
    await userEvent.clear(feeInput);
    await userEvent.type(feeInput, '0.20');
  },
};

/**
 * Form in submitting state
 */
export const Submitting: Story = {
  args: {
    location: defaultLocation,
    loading: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Pre-fill some data
    const nameInput = canvas.getByLabelText(/toilet name/i);
    await userEvent.type(nameInput, 'Test Toilet');
  },
};

/**
 * Form with validation errors
 */
export const Error: Story = {
  args: {
    location: defaultLocation,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Try to submit empty form
    const submitButton = canvas.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(canvas.getByText(/toilet name is required/i)).toBeInTheDocument();
    });
  },
};

/**
 * Form with custom hours input
 */
export const CustomHours: Story = {
  args: {
    location: defaultLocation,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Select custom hours
    const hoursSelect = canvas.getByLabelText(/opening hours/i);
    await userEvent.selectOptions(hoursSelect, 'custom');
    
    // Wait for custom input to appear
    await waitFor(() => {
      const customInput = canvas.getByLabelText(/specify hours/i);
      expect(customInput).toBeInTheDocument();
    });
    
    // Type custom hours
    const customInput = canvas.getByLabelText(/specify hours/i);
    await userEvent.type(customInput, 'Mon-Fri: 8am-6pm, Sat-Sun: 10am-4pm');
  },
};

/**
 * Form with all features selected
 */
export const AllFeatures: Story = {
  args: {
    location: defaultLocation,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Select all features
    const checkboxes = canvas.getAllByRole('checkbox');
    for (const checkbox of checkboxes) {
      await userEvent.click(checkbox);
    }
  },
};

/**
 * Form submission flow
 */
export const SubmissionFlow: Story = {
  args: {
    location: defaultLocation,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Fill required fields
    const nameInput = canvas.getByLabelText(/toilet name/i);
    await userEvent.type(nameInput, 'New Public Toilet');
    
    const hoursSelect = canvas.getByLabelText(/opening hours/i);
    await userEvent.selectOptions(hoursSelect, '24/7');
    
    // Submit form
    const submitButton = canvas.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);
  },
};

/**
 * Mobile-optimized form
 */
export const Mobile: Story = {
  args: {
    location: defaultLocation,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Form layout optimized for mobile devices',
      },
    },
  },
};

/**
 * Form with pre-populated data (edit mode)
 */
export const EditMode: Story = {
  args: {
    location: defaultLocation,
    initialData: {
      name: 'Existing Toilet',
      hours: '9am - 5pm',
      accessible: true,
      fee: 0.5,
      features: {
        babyChange: true,
        radar: false,
        automatic: true,
        contactless: true,
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Form pre-populated with existing toilet data for editing',
      },
    },
  },
};