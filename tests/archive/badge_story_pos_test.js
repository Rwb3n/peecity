/**
 * Badge Story Position Test
 * 
 * Tests to verify that Badge Storybook stories use parent-driven positioning
 * and render with proper theme colors.
 * 
 * @artifact-annotation
 * canonical-docs: docs/cookbook/recipe_atomic_components.md
 * epic: badge_story_fix_0025
 * plan: plan_badge_story_fix_0025.txt
 * task: story_test_create
 * tdd-phase: RED
 */

// Direct story file testing without @storybook/testing-react
const fs = require('fs')
const path = require('path')

describe('Badge Story Position Tests', () => {
  const storyFilePath = path.join(__dirname, '../../src/components/atoms/Badge/Badge.stories.tsx')
  let storyContent

  beforeAll(() => {
    storyContent = fs.readFileSync(storyFilePath, 'utf8')
  })

  describe('NotificationBadges story', () => {
    test('should use parent wrapper div with absolute positioning', () => {
      // Check that the story uses wrapper divs for positioning
      expect(storyContent).toContain('NotificationBadges')
      
      // Look for the notification badges section
      const notificationSection = storyContent.match(/export const NotificationBadges[^}]*\{[^}]*render:[^}]*\}[^}]*\}/s)
      expect(notificationSection).toBeTruthy()
      
      // Should have absolute positioning divs
      expect(notificationSection[0]).toContain('className="absolute')
      expect(notificationSection[0]).toContain('-top-')
      expect(notificationSection[0]).toContain('-right-')
    })

    test('should render success variant Badge', () => {
      // Check for success variant usage
      const notificationSection = storyContent.match(/export const NotificationBadges[^}]*\{[^}]*render:[^}]*\}[^}]*\}/s)
      
      expect(notificationSection[0]).toContain('variant="success"')
      expect(notificationSection[0]).toContain('99+') // Shopping cart badge content
    })

    test('should not use position prop on Badge components', () => {
      // Ensure no Badge has position prop
      const badgeMatches = storyContent.matchAll(/<Badge[^>]*>/g)
      
      for (const match of badgeMatches) {
        expect(match[0]).not.toContain('position=')
      }
    })
  })

  describe('StatusIndicators story', () => {
    test('should render warning variant Badge', () => {
      // Check for warning variant in StatusIndicators
      const statusSection = storyContent.match(/export const StatusIndicators[^}]*\{[^}]*render:[^}]*\}[^}]*\}/s)
      expect(statusSection).toBeTruthy()
      
      expect(statusSection[0]).toContain('variant="warning"')
      expect(statusSection[0]).toContain('Degraded')
    })
  })

  describe('Badge component TypeScript interface', () => {
    test('should not have position prop in Badge.tsx', () => {
      const badgeComponentPath = path.join(__dirname, '../../src/components/atoms/Badge/Badge.tsx')
      const badgeContent = fs.readFileSync(badgeComponentPath, 'utf8')
      
      // Check BadgeProps interface doesn't include position
      const propsMatch = badgeContent.match(/export interface BadgeProps[^}]*\}/s)
      expect(propsMatch).toBeTruthy()
      expect(propsMatch[0]).not.toContain('position')
    })
  })
})