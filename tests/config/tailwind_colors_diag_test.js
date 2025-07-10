/**
 * Diagnostic Test: Tailwind Colors Configuration
 * 
 * This test verifies that the Tailwind configuration includes
 * success and warning color definitions with DEFAULT and foreground
 * sub-keys, which are required for Badge variant rendering in Storybook.
 * 
 * @artifact-annotation
 * canonical-docs: docs/cookbook/recipe_atomic_components.md
 * epic: fix_tailwind_colors_0034
 * plan: plan_fix_tailwind_colors_0034.txt
 * task: tailwind_colors_diag_test_create
 * tdd-phase: RED
 */

const tailwindConfig = require('../../tailwind.config.js')

describe('Tailwind Colors Configuration Diagnostic', () => {
  test('theme.extend.colors should contain success color definition', () => {
    expect(tailwindConfig.theme.extend.colors).toHaveProperty('success')
    expect(tailwindConfig.theme.extend.colors.success).toEqual({
      DEFAULT: expect.stringContaining('hsl(var(--success))'),
      foreground: expect.stringContaining('hsl(var(--success-foreground))')
    })
  })

  test('theme.extend.colors should contain warning color definition', () => {
    expect(tailwindConfig.theme.extend.colors).toHaveProperty('warning')
    expect(tailwindConfig.theme.extend.colors.warning).toEqual({
      DEFAULT: expect.stringContaining('hsl(var(--warning))'),
      foreground: expect.stringContaining('hsl(var(--warning-foreground))')
    })
  })

  test('CSS variables for success and warning should be referenced consistently', () => {
    const colors = tailwindConfig.theme.extend.colors
    
    // Check success references correct CSS variables
    expect(colors.success?.DEFAULT).toBe('hsl(var(--success))')
    expect(colors.success?.foreground).toBe('hsl(var(--success-foreground))')
    
    // Check warning references correct CSS variables
    expect(colors.warning?.DEFAULT).toBe('hsl(var(--warning))')
    expect(colors.warning?.foreground).toBe('hsl(var(--warning-foreground))')
  })

  test('color definitions should follow existing pattern', () => {
    const colors = tailwindConfig.theme.extend.colors
    
    // Verify existing colors follow the pattern (to ensure consistency)
    expect(colors.primary).toEqual({
      DEFAULT: 'hsl(var(--primary))',
      foreground: 'hsl(var(--primary-foreground))'
    })
    
    // Success and warning should follow the same pattern
    if (colors.success) {
      expect(colors.success).toHaveProperty('DEFAULT')
      expect(colors.success).toHaveProperty('foreground')
    }
    
    if (colors.warning) {
      expect(colors.warning).toHaveProperty('DEFAULT')
      expect(colors.warning).toHaveProperty('foreground')
    }
  })
})