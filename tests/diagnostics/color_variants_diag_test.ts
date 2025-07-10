/**
 * Diagnostic Test: Missing Color Variants in Design System
 * 
 * This test verifies that success and warning color variants exist in the shared
 * design system utilities. It should FAIL in the current state, proving that
 * these variants were incorrectly removed during badge_impl_refactor task.
 * 
 * @diagnostic-for issue_0024
 * @artifact-annotation
 * canonical-docs: docs/cookbook/recipe_atomic_components.md
 * plan: plan_diagnose_0024.txt
 * task: color_variants_diag_test_create
 * tdd-phase: DIAGNOSTIC_TEST_CREATION
 */

import { colorSchemeVariants } from '../../src/lib/variants'

describe('Color Variants Diagnostic Test', () => {
  test('colorSchemeVariants should contain success variant with theme tokens', () => {
    // This test should FAIL - success variant was deleted
    expect(colorSchemeVariants).toHaveProperty('success')
    
    // When restored, it should use theme-based colors, not hard-coded ones
    expect(colorSchemeVariants.success).toMatch(/bg-success/)
    expect(colorSchemeVariants.success).toMatch(/text-success-foreground/)
    expect(colorSchemeVariants.success).not.toMatch(/bg-green-500/) // No hard-coded colors
  })

  test('colorSchemeVariants should contain warning variant with theme tokens', () => {
    // This test should FAIL - warning variant was deleted
    expect(colorSchemeVariants).toHaveProperty('warning')
    
    // When restored, it should use theme-based colors, not hard-coded ones
    expect(colorSchemeVariants.warning).toMatch(/bg-warning/)
    expect(colorSchemeVariants.warning).toMatch(/text-warning-foreground/)
    expect(colorSchemeVariants.warning).not.toMatch(/bg-yellow-500/) // No hard-coded colors
  })

  test('all color scheme variants should follow consistent pattern', () => {
    // Verify all variants follow the same pattern
    const expectedVariants = ['primary', 'secondary', 'destructive', 'outline', 'ghost', 'success', 'warning']
    
    expectedVariants.forEach(variant => {
      expect(colorSchemeVariants).toHaveProperty(variant)
      expect(typeof colorSchemeVariants[variant]).toBe('string')
    })
  })

  test('color scheme variants should support hover states', () => {
    // Success and warning should have hover states like other variants
    expect(colorSchemeVariants.success).toMatch(/hover:/)
    expect(colorSchemeVariants.warning).toMatch(/hover:/)
  })
})