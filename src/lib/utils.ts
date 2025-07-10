/**
 * Utility functions for component styling and class management
 * 
 * @doc refs docs/frontend-ui-spec.md
 * @artifact-annotation
 * canonical-docs: docs/frontend-ui-spec.md
 * epic: frontend_ui
 * plan: plan_frontend_atoms.txt
 * task: atoms_impl
 * tdd-phase: GREEN
 */

import { clsx, type ClassValue } from 'clsx'

/**
 * Combines class names using clsx utility
 * Commonly used pattern in shadcn/ui components for conditional styling
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}