/**
 * Diagnostic Test: Tailwind Content Glob Configuration
 * 
 * This test verifies that the Tailwind configuration's content array
 * includes patterns that will capture Storybook story files, preventing
 * Tailwind from purging classes used only in stories.
 * 
 * @artifact-annotation
 * canonical-docs: docs/cookbook/recipe_atomic_components.md
 * epic: fix_tailwind_colors_0034
 * plan: plan_fix_tailwind_colors_0034.txt
 * task: tailwind_content_glob_diag_test_create
 * tdd-phase: RED
 */

const tailwindConfig = require('../../tailwind.config.js')
const path = require('path')

describe('Tailwind Content Glob Configuration Diagnostic', () => {
  test('content array should exist and be non-empty', () => {
    expect(tailwindConfig.content).toBeDefined()
    expect(Array.isArray(tailwindConfig.content)).toBe(true)
    expect(tailwindConfig.content.length).toBeGreaterThan(0)
  })

  test('content array should include pattern for story files', () => {
    const patterns = tailwindConfig.content
    
    // Check if any pattern would match story files
    const hasStoryPattern = patterns.some(pattern => {
      // Check for common story file patterns
      return pattern.includes('stories') || 
             pattern.includes('*.stories.*') ||
             pattern.includes('**/*.stories.*')
    })
    
    expect(hasStoryPattern).toBe(true)
  })

  test('content array should cover all component directories including stories', () => {
    const patterns = tailwindConfig.content
    
    // Expected patterns for complete coverage
    const expectedPatterns = [
      // Should have pattern for components that includes stories
      expect.stringMatching(/\.\/src\/components\/\*\*\/\*\.\{.*stories.*\}/),
      // Or a dedicated pattern for stories
      expect.stringMatching(/\*\*\/\*\.stories\.\{js,jsx,ts,tsx\}/)
    ]
    
    // At least one of these patterns should exist
    const hasAdequateCoverage = expectedPatterns.some(expectedPattern => 
      patterns.some(pattern => expectedPattern.asymmetricMatch(pattern))
    )
    
    expect(hasAdequateCoverage).toBe(true)
  })

  test('content patterns should include TypeScript story files', () => {
    const patterns = tailwindConfig.content
    
    // Check if patterns include .tsx extension for TypeScript stories
    const includesTsx = patterns.some(pattern => 
      pattern.includes('tsx') && 
      (pattern.includes('stories') || pattern.includes('components'))
    )
    
    expect(includesTsx).toBe(true)
  })

  test('recommended story pattern should be present', () => {
    const patterns = tailwindConfig.content
    
    // The recommended pattern from feedback.txt
    const recommendedPattern = './src/**/*.stories.@(js|jsx|ts|tsx)'
    const alternativePattern = './src/**/*.stories.{js,jsx,ts,tsx}'
    
    const hasRecommendedPattern = patterns.includes(recommendedPattern) || 
                                  patterns.includes(alternativePattern)
    
    expect(hasRecommendedPattern).toBe(true)
  })
})