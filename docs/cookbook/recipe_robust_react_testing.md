---
title: "Cookbook: Robust React Testing"
description: "Best practices for writing reliable, maintainable, and robust React component tests using Jest and React Testing Library."
category: cookbook
version: "1.1.0"
last_updated: "2025-07-11"
tags: ["react", "testing", "jest", "react-testing-library", "accessibility", "best-practices"]
author: "Development Team"
status: "published"
audience: "developers"
complexity: "intermediate"
dependencies: ["@testing-library/react", "@testing-library/user-event", "jest", "react"]
related_files: ["./recipe_react_hook_form_with_zod.md", "../howto/test-api-endpoints.md"]
---

# Cookbook: Robust React Testing

Writing tests that are reliable and easy to maintain is as important as writing the component code itself. This guide outlines the canonical patterns for testing React components in this project to ensure our test suite remains stable and effective.

## 1. Handling Asynchronous Operations (`findBy*` and `waitFor`)

**Problem**: Tests can be "flaky" if they try to assert something about the DOM before an asynchronous operation (like a state update after an API call) has completed.

**Solution**: Use `async/await` with `findBy*` queries or wrap assertions in a `waitFor` block.

-   **`findBy*`**: Use this when you need to find an element that is **not available right away**. It is a combination of `getBy*` and `waitFor`.
-   **`waitFor`**: Use this when you need to wait for a specific assertion to become true that doesn't involve finding an element (e.g., asserting an element has a specific attribute).

### Recommended Pattern: `findBy*`

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should display an error message after a failed submission', async () => {
  render(<MyForm />);
  
  // Simulate user interaction that triggers an async update
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  // Use findByRole to wait for the alert to appear in the DOM.
  // This will retry for a short period before timing out.
  const errorAlert = await screen.findByRole('alert');
  
  expect(errorAlert).toBeInTheDocument();
  expect(errorAlert).toHaveTextContent(/submission failed/i);
});
```
**AVOID THIS**: Do not use synchronous queries like `getBy*` for elements that appear asynchronously. The test will fail before the component has had a chance to update.

## 2. Fixing `act()` Warnings

**Problem**: React Testing Library sometimes produces `act()` warnings, indicating a state update happened outside of the expected testing scope. These warnings often occur when an interaction causes a state change that isn't properly awaited.

**Solution**: Wrap the `userEvent` interaction that causes the state update in `await act(async () => { ... })`. This ensures that the test runner waits for all resulting state updates to be processed before moving on.

### Recommended Pattern

```tsx
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should clear the input when the clear button is clicked', async () => {
  render(<MySearchBar />);
  const input = screen.getByRole('searchbox');
  const clearButton = screen.getByRole('button', { name: /clear/i });
  
  await userEvent.type(input, 'testing');
  
  // This userEvent call causes a state update that needs to be wrapped
  await act(async () => {
    await userEvent.click(clearButton);
  });
  
  expect(input).toHaveValue('');
});
```

## 3. Choosing Robust Selectors

**Problem**: Tests that rely on fragile selectors (like CSS class names or `data-testid`) can break easily when the component's implementation details change.

**Solution**: Prioritize selectors that reflect how a user interacts with the page. This makes your tests more resilient to refactoring.

### Selector Priority List

Follow this priority order when querying for elements:

1.  **Queries Accessible to Everyone**: These are the most robust.
    -   `getByRole()`: The highest priority. Query by ARIA role (`button`, `dialog`, `searchbox`). This is how screen readers navigate.
    -   `getByLabelText()`: For form fields.
    -   `getByPlaceholderText()`: Useful for inputs.
    -   `getByText()`: Good for non-interactive elements like `div`, `span`.
    -   `getByDisplayValue()`: For finding form elements by their current value.
2.  **Semantic Queries**:
    -   `getByAltText()`: For images.
    -   `getByTitle()`: For elements with a `title` attribute.
3.  **Test IDs**:
    -   `getByTestId()`: **Use this as a last resort**. Only use `data-testid` when you cannot find an element with an accessible role or text. Overusing test IDs leads to tests that don't reflect user experience.

## 4. Testing Accessibility (Keyboard Focus Order)

**Problem**: It's easy to break keyboard navigation (`Tab` order) with CSS or by reordering JSX.

**Solution**: Write explicit tests to verify the focus order of interactive elements. `userEvent.tab()` simulates a user pressing the Tab key.

### Recommended Pattern

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should have the correct keyboard focus order', async () => {
  render(<MyComplexForm />);
  
  // Get all the interactive elements in their expected order
  const nameInput = screen.getByRole('textbox', { name: /name/i });
  const emailInput = screen.getByRole('textbox', { name: /email/i });
  const submitButton = screen.getByRole('button', { name: /submit/i });
  const cancelButton = screen.getByRole('button', { name: /cancel/i });
  
  // Start by tabbing into the component
  await userEvent.tab();
  expect(nameInput).toHaveFocus();
  
  // Tab to the next element
  await userEvent.tab();
  expect(emailInput).toHaveFocus();
  
  // And so on...
  await userEvent.tab();
  expect(submitButton).toHaveFocus();
  
  await userEvent.tab();
  expect(cancelButton).toHaveFocus();
});
```
This pattern ensures your components remain usable for keyboard-only users.

## 5. Real-World Debugging Patterns

Based on extensive debugging experience from the ContributionForm component, here are critical patterns that will save hours of troubleshooting:

### Pattern 1: Understanding Test vs Implementation Mismatch

**Problem**: Your tests fail not because the component is broken, but because the test expectations don't match the component's actual (and correct) behavior.

**Solution**: Create diagnostic tests to understand the actual behavior:

```tsx
// Create a minimal diagnostic test to understand actual behavior
it('DIAGNOSTIC: understand validation timing', async () => {
  render(<ContributionForm />);
  
  const nameInput = screen.getByLabelText(/name/i);
  const submitButton = screen.getByRole('button', { name: /submit/i });
  
  // Type invalid data
  await userEvent.type(nameInput, 'ab');
  
  // Check if error appears immediately (onChange validation)
  const immediateError = screen.queryByRole('alert');
  console.log('Immediate error:', immediateError?.textContent || 'None');
  
  // Submit and check for errors
  await userEvent.click(submitButton);
  
  // Check if error appears after submit (onSubmit validation)
  const submitError = await screen.findByRole('alert');
  console.log('Submit error:', submitError.textContent);
});
```

### Pattern 2: Debugging act() Warnings

**Problem**: Mysterious act() warnings that are hard to trace.

**Real Cause**: Most act() warnings in modern testing come from userEvent operations that trigger state updates. The solution is NOT to wrap everything in act().

**Solution**: Identify the specific operation causing the warning:

```tsx
// ✅ CORRECT: Most userEvent methods handle act() internally
await userEvent.type(input, 'text');
await userEvent.click(button);

// Only wrap in act() when you have a custom event that causes state updates
await act(async () => {
  // Custom event that triggers state update
  fireEvent.change(input, { target: { value: 'new value' } });
});
```

### Pattern 3: Testing Forms with Complex State

**Problem**: Form tests fail because of timing issues with conditional fields or dynamic validation.

**Solution**: Use proper async patterns and understand React Hook Form's lifecycle:

```tsx
it('handles conditional fields correctly', async () => {
  render(<ContributionForm />);
  
  // Select option that shows conditional field
  const hoursSelect = screen.getByLabelText(/opening hours/i);
  await userEvent.selectOptions(hoursSelect, 'custom');
  
  // Wait for conditional field to appear
  const customHoursInput = await screen.findByLabelText(/specify hours/i);
  expect(customHoursInput).toBeInTheDocument();
  
  // Test validation of conditional field
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  // Validation error should appear for empty conditional field
  expect(await screen.findByText(/please specify custom hours/i)).toBeInTheDocument();
});
```

### Pattern 4: API Mocking Best Practices

**Problem**: API mocks don't match actual requests, causing tests to fail mysteriously.

**Solution**: Log and verify the actual request payload:

```tsx
beforeEach(() => {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;
  
  mockFetch.mockImplementation(async (url, options) => {
    console.log('Fetch called with:', {
      url,
      method: options?.method,
      body: options?.body,
      headers: options?.headers
    });
    
    // Return appropriate response
    return {
      ok: true,
      json: async () => ({ success: true })
    };
  });
});

it('sends correct data to API', async () => {
  render(<ContributionForm location={{ lat: 51.5, lng: -0.1 }} />);
  
  // Fill form
  await userEvent.type(screen.getByLabelText(/name/i), 'Test Toilet');
  await userEvent.click(screen.getByLabelText(/wheelchair accessible/i));
  
  // Submit
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  // Verify the exact payload
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/suggest'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"name":"Test Toilet"')
      })
    );
  });
});
```

## 6. Complete Testing Example

Here's a comprehensive test suite that demonstrates all the patterns:

```tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContributionForm } from '@/components/molecules/ContributionForm';

describe('ContributionForm', () => {
  // Setup API mocking
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, id: 'test-123' })
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Form Validation', () => {
    it('validates required fields on submit', async () => {
      render(<ContributionForm location={{ lat: 51.5, lng: -0.1 }} />);
      
      // Submit without filling required fields
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));
      
      // Check for validation error
      const error = await screen.findByRole('alert');
      expect(error).toHaveTextContent(/name.*required/i);
    });

    it('validates field constraints', async () => {
      render(<ContributionForm location={{ lat: 51.5, lng: -0.1 }} />);
      
      // Enter invalid data
      await userEvent.type(screen.getByLabelText(/name/i), 'ab'); // Too short
      await userEvent.type(screen.getByLabelText(/fee/i), '15'); // Too high
      
      // Submit
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));
      
      // Check for multiple validation errors
      const errors = await screen.findAllByRole('alert');
      expect(errors).toHaveLength(2);
      expect(errors[0]).toHaveTextContent(/at least 3 characters/i);
      expect(errors[1]).toHaveTextContent(/between £0 and £10/i);
    });
  });

  describe('API Integration', () => {
    it('submits form data correctly', async () => {
      render(<ContributionForm location={{ lat: 51.5, lng: -0.1 }} />);
      
      // Fill form
      await userEvent.type(screen.getByLabelText(/name/i), 'Test Toilet');
      await userEvent.selectOptions(screen.getByLabelText(/hours/i), '24/7');
      await userEvent.click(screen.getByLabelText(/wheelchair accessible/i));
      await userEvent.click(screen.getByLabelText(/baby changing/i));
      
      // Submit
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));
      
      // Verify API call
      await waitFor(() => {
        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        const [url, options] = fetchCall;
        const body = JSON.parse(options.body);
        
        expect(url).toContain('/api/suggest');
        expect(body).toMatchObject({
          name: 'Test Toilet',
          lat: 51.5,
          lng: -0.1,
          hours: '24/7',
          accessible: true,
          changing_table: true
        });
      });
    });

    it('handles API errors gracefully', async () => {
      // Mock API error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' })
      } as Response);
      
      render(<ContributionForm location={{ lat: 51.5, lng: -0.1 }} />);
      
      // Fill and submit
      await userEvent.type(screen.getByLabelText(/name/i), 'Test Toilet');
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));
      
      // Check for error message
      const error = await screen.findByRole('alert');
      expect(error).toHaveTextContent(/server error/i);
    });
  });

  describe('Accessibility', () => {
    it('maintains proper focus order', async () => {
      render(<ContributionForm location={{ lat: 51.5, lng: -0.1 }} />);
      
      // Tab through form
      await userEvent.tab(); // Focus first input
      expect(screen.getByLabelText(/name/i)).toHaveFocus();
      
      await userEvent.tab(); // Focus hours select
      expect(screen.getByLabelText(/hours/i)).toHaveFocus();
      
      // Continue through all interactive elements
      const interactiveElements = [
        /name/i,
        /hours/i,
        /wheelchair accessible/i,
        /baby changing/i,
        /fee/i,
        /submit/i
      ];
      
      // Verify each element can receive focus
      for (const pattern of interactiveElements) {
        const element = screen.getByRole(/(textbox|combobox|checkbox|button)/, { name: pattern });
        element.focus();
        expect(element).toHaveFocus();
      }
    });

    it('announces errors to screen readers', async () => {
      render(<ContributionForm location={{ lat: 51.5, lng: -0.1 }} />);
      
      // Submit invalid form
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));
      
      // Error should have correct ARIA attributes
      const error = await screen.findByRole('alert');
      expect(error).toBeInTheDocument();
      
      // Associated input should be marked invalid
      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby');
    });
  });
});
```

## 7. Troubleshooting Guide

### Common Test Failures and Solutions

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| "Unable to find element" | Element renders asynchronously | Use `findBy*` instead of `getBy*` |
| "Not wrapped in act()" | State update after test ends | Ensure all async operations complete |
| Test passes alone but fails in suite | Test pollution | Add proper cleanup in `afterEach` |
| Focus test fails | Unexpected tab order | Debug actual DOM order, not assumptions |
| API mock not called | URL mismatch | Log actual fetch calls to debug |

## Prerequisites

- Jest configured with jsdom environment
- React Testing Library and user-event installed
- Understanding of async/await patterns
- Familiarity with ARIA roles and accessibility

## Related Documentation

- [React Hook Form with Zod](./recipe_react_hook_form_with_zod.md) - Form validation patterns
- [Test API Endpoints](../howto/test-api-endpoints.md) - API mocking strategies
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

## References

- ContributionForm test suite: `tests/components/molecules/ContributionForm_test.tsx`
- Debugging saga: `status/plan_frontend_ui_detailed_task_molecules_implementation_status.md`
- Original test patterns: `tests/components/molecules/` 