---
id: frontend-ui-spec
title: "Frontend UI Specification"
description: "Frontend UI specification covering React components, routing, state management, and mobile responsiveness"
version: 1.0.0
last_updated: "2025-07-09"
category: explanation
---

# Frontend UI Specification

This document is the canonical reference for **how we build, name, and test UI components in CityPee**. It complements the Design System Overview but focuses on the concrete engineering rules that keep the codebase consistent and maintainable.

## 1. Project Structure

```
src/
  components/
    atoms/
    molecules/
    organisms/
    templates/
    pages/
```

* The folder hierarchy mirrors Atomic Design.  
* Each component lives in its own folder (`ComponentName/`) containing `ComponentName.tsx`, `index.ts`, `ComponentName.stories.tsx`, and `ComponentName_test.tsx`.

## 2. Naming Conventions

* **PascalCase** for component names (`MapView`, `SuggestionModal`).  
* **camelCase** for props (`isOpen`, `onSubmit`).  
* Variants are expressed via the `variant` prop and implemented using `class-variance-authority`.

## 3. Breakpoints & Layout

Tailwind breakpoints are extended from the design tokens and must be referenced by semantic aliases:

| Token | Tailwind Name | Pixels |
|-------|--------------|--------|
| `bp-xs` | `xs` | 320 |
| `bp-sm` | `sm` | 640 |
| `bp-md` | `md` | 768 |
| `bp-lg` | `lg` | 1024 |
| `bp-xl` | `xl` | 1280 |

Developers **must not** use raw pixel numbers in class names—always use the token.

## 4. Design Tokens Mapping

Design tokens are exported from Figma into `design/tokens.json` and then transformed by `scripts/gen-tokens.sh` into Tailwind's `theme.extend` block.  **Never** hand-edit Tailwind colors; regenerate from tokens instead.

## 5. Accessibility Rules

1. Minimum touch target: 44 × 44 px.  
2. All interactive elements need accessible names (use `aria-label` where text is absent).  
3. Icon-only buttons include `<span class="sr-only">` text.

## 6. Performance & Bundle Size

* Target: ≤ 150 KB gzipped for initial JS chunk.  
* Use dynamic import for large maps and analytics libraries.

## 7. Storybook & Testing

* Storybook stories sit beside the component and are grouped by hierarchy in the sidebar using `title: "atoms/Button"` notation.  
* All stories must render under mobile (`375 px`), tablet, and desktop viewports.  
* Snapshot testing is handled by Chromatic; functional tests by React Testing Library.

## 8. File Checklist for New Components

- [ ] `ComponentName.tsx` with JSDoc prop table.  
- [ ] `index.ts` re-export.  
- [ ] Storybook story with all variants.  
- [ ] Jest test covering rendering, variant classes, accessibility.

Adhering to this spec ensures any new contributor can predict where a component lives, how it is styled, and how it is tested. 