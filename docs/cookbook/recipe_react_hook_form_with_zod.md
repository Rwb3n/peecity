---
title: "Cookbook: React Hook Form with Zod"
description: "Canonical guide for robust form handling using React Hook Form and Zod for schema-based validation."
category: cookbook
version: "1.1.0"
last_updated: "2025-07-11"
tags: ["react", "forms", "validation", "zod", "react-hook-form", "typescript"]
author: "Development Team"
status: "published"
audience: "developers"
complexity: "intermediate"
dependencies: ["react-hook-form", "zod", "@hookform/resolvers"]
related_files: ["./recipe_robust_react_testing.md", "../howto/test-api-endpoints.md"]
---

# Cookbook: React Hook Form with Zod

This cookbook provides the standard, validated patterns for implementing robust forms in this project using `react-hook-form` for state management and `zod` for schema-based validation. Following these patterns is mandatory for ensuring consistency, reliability, and maintainability.

## 1. Core Dependencies

Ensure the following dependencies are installed:

```bash
npm install react-hook-form zod @hookform/resolvers
```

## 2. Standard Schema and Form Setup

This is the canonical structure for creating a form.

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// 1. Define the Zod schema
const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  // ... other fields
});

// 2. Infer the TypeScript type from the schema
type FormData = z.infer<typeof formSchema>;

export const MyFormComponent: React.FC = () => {
  // 3. Set up the useForm hook with the Zod resolver
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    // Recommended mode: 'onSubmit' for UX, but can be 'onChange'
    mode: 'onSubmit', 
  });

  const handleFormSubmit = (data: FormData) => {
    console.log('Form submitted successfully:', data);
    // ... handle API submission
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      {/* ... form fields ... */}
    </form>
  );
};
```

## 3. Handling Numeric Inputs (The `z.coerce` Pattern)

**Problem**: Standard HTML inputs of `type="text"` return strings, which will fail `z.number()` validation.

**Solution**: Use `z.coerce.number()` to automatically convert the string value to a number before validation. This is the **only approved method** for handling numeric inputs from text fields.

```ts
const formSchema = z.object({
  // This will coerce "50" to 50, or "" to 0 before validating.
  // It gracefully handles empty strings without crashing.
  fee: z.coerce.number()
    .min(0, 'Fee must be £0 or greater')
    .max(10, 'Fee must be £10 or less')
    .optional()
    .default(0),
});
```
**AVOID THIS PATTERN**: Do not use `z.preprocess` with `Number(val)`. This pattern is flawed because `Number('')` results in `0`, but an empty string from a user might not mean `0`. Worse, `Number('abc')` results in `NaN`, which can cause unhandled exceptions in the Zod resolver. `z.coerce` is safer and more explicit.

## 4. Manual Validation Fallback with `safeParse`

**Problem**: In complex scenarios (like real-time validation outside of `react-hook-form`'s control), the `zodResolver` can throw unhandled exceptions that crash the submission process before the UI can be updated.

**Solution**: Implement a manual validation fallback using Zod's `safeParse` method. This method **does not throw an error** on failure. Instead, it returns a result object containing the parsed data or the error details.

### Correctly Parsing Zod Errors (`error.issues`)

A critical detail is that a `ZodError` object contains the validation errors in an `issues` array, **not** an `errors` array.

```tsx
import { z, ZodError } from 'zod';

const handleManualSubmit = async (data: FormData) => {
  // 1. Use safeParse - it will not throw an error
  const validationResult = formSchema.safeParse(data);

  if (!validationResult.success) {
    const newErrors: Record<string, { message: string }> = {};

    // 2. Correctly access the 'issues' property
    if (validationResult.error) {
      validationResult.error.issues.forEach(issue => {
        const path = issue.path[0] as string;
        // Set the first error encountered for a given field
        if (!newErrors[path]) {
          newErrors[path] = { message: issue.message };
        }
      });
    }
    
    // Update a manual error state in your component
    // setManualErrors(newErrors); 
    return; // Stop the submission
  }

  // Proceed with the validated data
  const validatedData = validationResult.data;
  // ... make API call
};
```

This pattern gives you full control over the validation lifecycle and prevents unexpected crashes, making your forms more robust.

## 5. Complete Working Example: ContributionForm

Here's a battle-tested example from the CityPee project that demonstrates all the patterns together:

```tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define the schema with proper coercion for numeric fields
const contributionSchema = z.object({
  name: z.string().min(3, 'Toilet name must be at least 3 characters'),
  lat: z.number(),
  lng: z.number(),
  hours: z.string().optional(),
  customHours: z.string().optional(),
  fee: z.coerce.number()
    .min(0, 'Fee must be between £0 and £10')
    .max(10, 'Fee must be between £0 and £10')
    .optional()
    .default(0),
  features: z.object({
    accessible: z.boolean().optional(),
    babyChange: z.boolean().optional(),
    radar: z.boolean().optional(),
    automatic: z.boolean().optional(),
    staffed: z.boolean().optional(),
  }).optional(),
}).refine(
  (data) => {
    if (data.hours === 'custom') {
      return !!data.customHours && data.customHours.length > 0;
    }
    return true;
  },
  {
    message: 'Please specify custom hours',
    path: ['customHours'],
  }
);

type FormData = z.infer<typeof contributionSchema>;

export const ContributionForm: React.FC<{ location: { lat: number; lng: number } }> = ({ location }) => {
  const [apiError, setApiError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(contributionSchema),
    mode: 'onSubmit', // Validate on submit for better UX
    defaultValues: {
      lat: location.lat,
      lng: location.lng,
      fee: 0,
      features: {},
    },
  });

  // Watch the hours field to conditionally show custom hours input
  const hoursValue = watch('hours');

  const onSubmit = async (data: FormData) => {
    setApiError(null); // Clear previous errors
    
    try {
      // Prepare API payload
      const payload = {
        ...data,
        // Map features to API format
        accessible: data.features?.accessible,
        changing_table: data.features?.babyChange,
        radar_key: data.features?.radar,
        automatic: data.features?.automatic,
        attended: data.features?.staffed,
      };
      
      // Remove internal fields
      delete payload.features;
      delete payload.customHours;
      
      // If custom hours, use that value
      if (data.hours === 'custom' && data.customHours) {
        payload.hours = data.customHours;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Submission failed');
      }
      
      // Handle success
      const result = await response.json();
      console.log('Submission successful:', result);
      
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to submit. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="name">Toilet Name *</label>
        <input
          id="name"
          type="text"
          {...register('name')}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" role="alert" className="error">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="hours">Opening Hours</label>
        <select id="hours" {...register('hours')}>
          <option value="">Select hours</option>
          <option value="24/7">24/7</option>
          <option value="business">Business hours</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {hoursValue === 'custom' && (
        <div>
          <label htmlFor="customHours">Specify Hours</label>
          <input
            id="customHours"
            type="text"
            {...register('customHours')}
            placeholder="e.g., Mon-Fri 9am-5pm"
          />
          {errors.customHours && (
            <p role="alert" className="error">
              {errors.customHours.message}
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="fee">Usage Fee (£)</label>
        <input
          id="fee"
          type="text"
          inputMode="decimal"
          {...register('fee')}
          aria-invalid={!!errors.fee}
        />
        {errors.fee && (
          <p role="alert" className="error">
            {errors.fee.message}
          </p>
        )}
      </div>

      <fieldset>
        <legend>Features</legend>
        <label>
          <input type="checkbox" {...register('features.accessible')} />
          Wheelchair Accessible
        </label>
        <label>
          <input type="checkbox" {...register('features.babyChange')} />
          Baby Changing
        </label>
        {/* More feature checkboxes... */}
      </fieldset>

      {apiError && (
        <div role="alert" className="error">
          {apiError}
        </div>
      )}

      <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

## 6. Common Pitfalls and Solutions

### Pitfall 1: Unhandled ZodError Crashes

**Problem**: Using incorrect preprocessing can cause unhandled exceptions that crash your form.

```ts
// ❌ BAD: This crashes when fee is empty
fee: z.preprocess(
  (val) => (val === '' ? Number.NaN : Number(val)),
  z.number().min(0)
)
```

**Solution**: Use `z.coerce` which handles edge cases gracefully:
```ts
// ✅ GOOD: Safely coerces to number
fee: z.coerce.number().min(0).optional().default(0)
```

### Pitfall 2: Missing Form Data in API Calls

**Problem**: Manually collecting form data can miss fields, especially nested ones.

**Solution**: Always use React Hook Form's data from `handleSubmit`:
```tsx
// The data parameter contains ALL registered fields
const onSubmit = handleSubmit(async (data) => {
  // data is fully typed and complete
  await fetch('/api/endpoint', {
    body: JSON.stringify(data)
  });
});
```

### Pitfall 3: Validation Timing Confusion

**Problem**: Tests expect immediate validation but form validates on submit.

**Solution**: Be explicit about validation mode:
```tsx
useForm({
  mode: 'onSubmit',    // Validates on submit only (better UX)
  // mode: 'onChange',  // Validates on every change (more aggressive)
  // mode: 'onBlur',    // Validates when field loses focus
});
```

## 7. Testing Forms with React Hook Form

When testing components that use React Hook Form, ensure your tests match the validation mode:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('validates on submit when mode is onSubmit', async () => {
  render(<MyForm />);
  
  // Type invalid data
  await userEvent.type(screen.getByLabelText(/name/i), 'ab');
  
  // Error should NOT appear yet
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  
  // Submit the form
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  // NOW the error should appear
  const error = await screen.findByRole('alert');
  expect(error).toHaveTextContent(/at least 3 characters/i);
});
```

## Troubleshooting

### Issue: "Cannot read properties of undefined"
- **Cause**: Trying to access `validationResult.error.errors` instead of `validationResult.error.issues`
- **Solution**: Use the correct property name for ZodError

### Issue: Form submits with empty data
- **Cause**: Not using `register()` on all inputs
- **Solution**: Ensure every input has `{...register('fieldName')}`

### Issue: Numeric inputs always fail validation
- **Cause**: HTML inputs return strings, not numbers
- **Solution**: Use `z.coerce.number()` in your schema

## Related Documentation

- [Robust React Testing](./recipe_robust_react_testing.md) - Testing patterns for React Hook Form
- [Test API Endpoints](../howto/test-api-endpoints.md) - Testing form submissions to APIs
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)

## References

- ContributionForm debugging saga: `status/plan_frontend_ui_detailed_task_molecules_implementation_status.md`
- Original implementation: `src/components/molecules/ContributionForm/ContributionForm.tsx`
- Test suite: `tests/components/molecules/ContributionForm_test.tsx` 