/**
 * Test: Restored Success and Warning Variants
 * 
 * This test verifies that colorSchemeVariants contains success and warning entries
 * with proper theme-based class strings. It should FAIL initially (RED phase) because
 * these variants are currently missing.
 * 
 * @artifact-annotation
 * canonical-docs: docs/cookbook/recipe_atomic_components.md
 * plan: plan_fix_variants_0024.txt
 * task: test_variants_restored
 * tdd-phase: TEST_CREATION
 */

import { colorSchemeVariants } from '../../src/lib/variants'

describe('Restored Variants Test', () => {
  describe('Success variant', () => {
    test('should exist in colorSchemeVariants', () => {
      expect(colorSchemeVariants).toHaveProperty('success')
      expect(typeof colorSchemeVariants.success).toBe('string')
    })

    test('should use theme-based color classes', () => {
      expect(colorSchemeVariants.success).toMatch(/bg-success\b/)
      expect(colorSchemeVariants.success).toMatch(/text-success-foreground\b/)
    })

    test('should include hover state with opacity', () => {
      expect(colorSchemeVariants.success).toMatch(/hover:bg-success\/90\b/)
    })

    test('should NOT contain hard-coded colors', () => {
      expect(colorSchemeVariants.success).not.toMatch(/bg-green-\d{3}/)
      expect(colorSchemeVariants.success).not.toMatch(/text-green-\d{3}/)
    })

    test('should follow same pattern as other variants', () => {
      // Compare with primary variant pattern
      const primaryPattern = /^bg-\w+ text-\w+-foreground hover:bg-\w+\/\d+$/
      expect(colorSchemeVariants.success).toMatch(primaryPattern)
    })
  })

  describe('Warning variant', () => {
    test('should exist in colorSchemeVariants', () => {
      expect(colorSchemeVariants).toHaveProperty('warning')
      expect(typeof colorSchemeVariants.warning).toBe('string')
    })

    test('should use theme-based color classes', () => {
      expect(colorSchemeVariants.warning).toMatch(/bg-warning\b/)
      expect(colorSchemeVariants.warning).toMatch(/text-warning-foreground\b/)
    })

    test('should include hover state with opacity', () => {
      expect(colorSchemeVariants.warning).toMatch(/hover:bg-warning\/90\b/)
    })

    test('should NOT contain hard-coded colors', () => {
      expect(colorSchemeVariants.warning).not.toMatch(/bg-yellow-\d{3}/)
      expect(colorSchemeVariants.warning).not.toMatch(/text-yellow-\d{3}/)
      expect(colorSchemeVariants.warning).not.toMatch(/bg-amber-\d{3}/)
    })

    test('should follow same pattern as other variants', () => {
      // Compare with primary variant pattern
      const primaryPattern = /^bg-\w+ text-\w+-foreground hover:bg-\w+\/\d+$/
      expect(colorSchemeVariants.warning).toMatch(primaryPattern)
    })
  })

  describe('Variant ordering and completeness', () => {
    test('should have all expected color scheme variants', () => {
      const expectedVariants = [
        'primary',
        'secondary',
        'destructive',
        'outline',
        'ghost',
        'success',
        'warning'
      ]

      expectedVariants.forEach(variant => {
        expect(colorSchemeVariants).toHaveProperty(variant)
      })

      // Verify we have exactly the expected variants
      const actualVariants = Object.keys(colorSchemeVariants)
      expect(actualVariants.sort()).toEqual(expectedVariants.sort())
    })
  })
})