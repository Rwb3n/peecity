/**
 * Diagnostic Test: Badge Component Success/Warning Variant Support
 * 
 * This test verifies that the Badge component properly supports success and warning
 * variants using the shared design system. It should FAIL in the current state,
 * proving that these variants are not available after their removal.
 * 
 * @diagnostic-for issue_0024
 * @artifact-annotation
 * canonical-docs: docs/cookbook/recipe_atomic_components.md
 * plan: plan_diagnose_0024.txt
 * task: badge_variant_diag_test_create
 * tdd-phase: DIAGNOSTIC_TEST_CREATION
 */

import React from 'react'
import { render } from '@testing-library/react'
import { Badge } from '../../src/components/atoms/Badge/Badge'

describe('Badge Variant Diagnostic Test', () => {
  test('Badge should support success variant with proper theme classes', () => {
    // This test should FAIL - success variant is not supported
    const { container } = render(<Badge variant="success">Success Badge</Badge>)
    const badge = container.querySelector('.badge')
    
    expect(badge).toBeTruthy()
    // Should have theme-based success classes
    expect(badge?.className).toMatch(/bg-success/)
    expect(badge?.className).toMatch(/text-success-foreground/)
    // Should NOT have hard-coded colors
    expect(badge?.className).not.toMatch(/bg-green-500/)
  })

  test('Badge should support warning variant with proper theme classes', () => {
    // This test should FAIL - warning variant is not supported
    const { container } = render(<Badge variant="warning">Warning Badge</Badge>)
    const badge = container.querySelector('.badge')
    
    expect(badge).toBeTruthy()
    // Should have theme-based warning classes
    expect(badge?.className).toMatch(/bg-warning/)
    expect(badge?.className).toMatch(/text-warning-foreground/)
    // Should NOT have hard-coded colors
    expect(badge?.className).not.toMatch(/bg-yellow-500/)
  })

  test('Badge should accept success and warning as valid variant props', () => {
    // TypeScript should allow these variants
    const validVariants = ['default', 'secondary', 'destructive', 'outline', 'success', 'warning']
    
    validVariants.forEach(variant => {
      const { container } = render(<Badge variant={variant as any}>Test</Badge>)
      const badge = container.querySelector('.badge')
      expect(badge).toBeTruthy()
    })
  })

  test('Badge variants should have hover states', () => {
    const { container: successContainer } = render(<Badge variant="success">Success</Badge>)
    const { container: warningContainer } = render(<Badge variant="warning">Warning</Badge>)
    
    const successBadge = successContainer.querySelector('.badge')
    const warningBadge = warningContainer.querySelector('.badge')
    
    // Check for hover classes
    expect(successBadge?.className).toMatch(/hover:/)
    expect(warningBadge?.className).toMatch(/hover:/)
  })
})