---
id: design-explanation
title: "Design System Overview"
description: "Design system overview explaining atomic design principles, component hierarchy, and visual design tokens"
version: 1.0.0
last_updated: "2025-07-09"
category: explanation
---

# Design System Overview (Explanation)

This document merges the **Design High-Level Spec** and the more granular **Design Spec Sheet** into a single source of truth for UX, UI tokens, and interaction patterns.

## Guiding Principles

* Utility-first & Mobile-first.
* Trustworthy civic aesthetic.
* SEO supportive semantic markup.
* Accessibility AA compliance.

## Atomic Hierarchy

| Level | Example |
|-------|---------|
| Atom | Button, Input, Icon |
| Molecule | SearchBar |
| Organism | MapView |
| Template | HomeLayout |
| Page | `/` Home, `/borough/[slug]` |

## Visual Language

* **Color Tokens** – Defined in `design/tokens.json` and exported to Tailwind via `scripts/gen-tokens.sh`.
* **Typography** – Inter, sans-serif, scaling via CSS clamp.
* **Icons** – Lucide + custom toilet/accessibility glyphs.

## Interaction Patterns

Outlined FAB suggestion flow, marker interactions, and sharing mechanisms as described previously.

Refer to Storybook (`npm run storybook`) for live component catalogue. 