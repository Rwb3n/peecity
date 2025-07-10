---
id: recipe-storybook-setup
title: "Recipe: Storybook Setup"
description: "Setup recipe for Storybook with React components, visual testing, and documentation"
version: 1.0.0
last_updated: "2025-07-09"
category: cookbook
---

# Recipe: Storybook Setup and Configuration

**Version**: 1.0  
**Epic**: Frontend UI  
**Created**: 2025-07-05  
**Last Updated**: 2025-07-05  

## Overview

This recipe documents the complete setup and configuration of Storybook 7.x with Next.js, TailwindCSS integration, accessibility testing, and performance optimizations for the CityPee project.

## Prerequisites

- Next.js 14+ with App Router
- TailwindCSS 3.x configured
- TypeScript 5.x
- Node.js 20.x LTS

## Installation

### 1. Core Storybook Packages

```bash
npm install --save-dev \
  @storybook/nextjs@^7.6.20 \
  @storybook/addon-essentials@^7.6.20 \
  @storybook/addon-a11y@^7.6.20 \
  @storybook/addon-viewport@^7.6.20 \
  storybook@^7.6.20
```

### 2. Visual Regression Testing

```bash
npm install --save-dev chromatic@^13.1.2
```

### 3. Package.json Scripts

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "chromatic": "chromatic --exit-zero-on-changes"
  }
}
```

## Configuration Files

### 1. Main Configuration (.storybook/main.ts)

```typescript
import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    // Atomic design organization
    '../src/components/atoms/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/components/molecules/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/components/organisms/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: '../next.config.js',
    },
  },
  features: {
    storyStoreV7: true,
    modernInlineRender: true,
    buildStoriesJson: true,
  },
  webpackFinal: async (config) => {
    // Performance optimizations
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    }

    // Enable webpack cache
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    }

    return config
  },
}

export default config
```

### 2. Preview Configuration (.storybook/preview.js)

```javascript
import '../src/app/globals.css'

const preview = {
  parameters: {
    // Accessibility configuration
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'focus-visible', enabled: true },
          { id: 'keyboard-navigation', enabled: true },
        ],
      },
    },
    // Mobile-first viewports
    viewport: {
      viewports: {
        mobile1: {
          name: 'Mobile (320px)',
          styles: { width: '320px', height: '568px' },
        },
        tablet: {
          name: 'Tablet (768px)',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop (1024px)',
          styles: { width: '1024px', height: '768px' },
        },
      },
      defaultViewport: 'mobile1',
    },
  },
  // Story organization
  options: {
    storySort: {
      order: ['Introduction', 'Atoms', 'Molecules', 'Organisms', 'Templates', 'Pages'],
    },
  },
}

export default preview
```

### 3. Chromatic Configuration (chromatic.config.json)

```json
{
  "buildScriptName": "build-storybook",
  "threshold": 0.2,
  "exitZeroOnChanges": true,
  "autoAcceptChanges": "main"
}
```

## Reusable Story Templates

### Atom Template Pattern

```typescript
import { createAtomMeta, AtomVariants, type AtomStory } from '../.storybook/templates'
import { Button } from './Button'

const meta = createAtomMeta('Atoms/Button', Button, {
  children: 'Click me',
})

export default meta

export const Default: AtomStory = AtomVariants.Default
export const AllVariants: AtomStory = AtomVariants.AllVariants
export const MobileErgonomics: AtomStory = AtomVariants.MobileErgonomics
```

## Testing Integration

### Accessibility Testing

- All stories include a11y addon configuration
- WCAG 2.1 AA compliance checking
- Color contrast validation
- Keyboard navigation testing

### Visual Regression Testing

```bash
# Run visual tests
npm run chromatic

# Run with specific build
npx chromatic --build-script-name=build-storybook
```

### Mobile Ergonomics

- 44px minimum touch targets
- Mobile-first viewport defaults
- Thumb-zone optimization testing

## Performance Optimizations

### Build Optimizations

1. **Webpack Caching**: Filesystem cache for faster rebuilds
2. **Code Splitting**: Vendor chunks separated
3. **Modern Features**: StoryStore v7, modern inline render

### Expected Performance Improvements

- 20% reduction in Storybook build time
- Faster development server startup
- Improved bundle size through tree-shaking

## Troubleshooting

### Common Issues

1. **Storybook Binary Not Found**
   - Use direct path: `node node_modules/@storybook/cli/bin/index.js`
   - Ensure packages are in package.json devDependencies

2. **TailwindCSS Not Loading**
   - Verify globals.css import in preview.js
   - Check PostCSS configuration in webpackFinal

3. **Performance Issues**
   - Enable webpack cache
   - Use story-level code splitting
   - Optimize addon usage

### Validation Commands

```bash
# Test Storybook setup
npm test -- tests/storybook_setup_test.js

# Start development server
npm run storybook

# Build static version
npm run build-storybook
```

## Integration with Atomic Design

### Story Organization

```
src/components/
├── atoms/
│   └── Button/Button.stories.tsx
├── molecules/
│   └── SearchForm/SearchForm.stories.tsx
└── organisms/
    └── Header/Header.stories.tsx
```

### Template Usage

1. **Atoms**: Use AtomTemplate for buttons, inputs, icons
2. **Molecules**: Use MoleculeTemplate for forms, cards
3. **Organisms**: Use OrganismTemplate for headers, navigation

## Best Practices

1. **Mobile-First Development**: Always test on mobile viewport first
2. **Accessibility First**: Include a11y testing in all stories
3. **Performance Monitoring**: Use webpack-bundle-analyzer for bundle optimization
4. **Visual Testing**: Set up Chromatic CI/CD integration
5. **Documentation**: Use MDX for comprehensive component documentation

## Next Steps

1. Create component stories using templates
2. Set up Chromatic project token
3. Configure CI/CD pipeline integration
4. Implement interaction testing with @storybook/test