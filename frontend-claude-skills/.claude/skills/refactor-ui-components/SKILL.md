---
name: refactor-ui-components
description: refactor next.js frontend components for better reuse, readability, maintainability, visual consistency, and cleaner 3d ui composition in bun-based projects. use when components are too large, duplicated, hard to scan, visually inconsistent, or when spline-based sections need better structure. frontend only.
---

# Refactor UI Components

Refactor messy frontend code into clean, reusable UI architecture.

## Goals
- Reduce duplication
- Improve readability
- Strengthen component boundaries
- Preserve or improve visuals
- Keep behavior stable

## Signals to refactor
- Huge page files
- Repeated card markup
- Repeated button or badge variants
- Mixed business logic and presentation
- Inconsistent spacing or styling tokens
- Too many props passed deeply
- Spline or motion code embedded directly inside page files

## Refactor workflow
1. Identify repeated patterns.
2. Extract shared primitives or sections.
3. Simplify prop shapes.
4. Separate layout components from content data when useful.
5. Preserve responsive behavior.
6. Remove dead styles and unnecessary wrappers.

## Preferred structure
Use patterns like:
- `components/ui/*` for shared primitives
- `components/sections/*` for large page sections
- `components/shared/*` for reused app-specific pieces
- `app/(marketing)/*` and `app/(app)/*` when route grouping improves clarity

## 3d refactor guidance
When a page contains Spline or spotlight effects:
- extract the lazy-loaded Spline wrapper into `components/ui/splite.tsx` or a consistently renamed equivalent
- keep section composition separate from the low-level scene wrapper
- reuse a single `spotlight.tsx` implementation instead of mixing multiple versions
- keep `card.tsx` aligned with the existing shadcn primitive instead of duplicating it unnecessarily
- move scene URLs and copy content into props or content objects when the section may be reused

## Tailwind cleanup rules
- Merge repeated utility patterns into reusable components when repetition becomes noisy.
- Keep utilities inline when extraction would hide simple intent.
- Normalize spacing and sizing scales.
- Remove one-off class clutter where possible.

## Output expectation
Provide:
1. The refactored files
2. A brief explanation of what was extracted or reorganized
3. Any remaining technical debt worth addressing later
