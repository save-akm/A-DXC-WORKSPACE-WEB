---
name: review-nextjs-frontend
description: review next.js frontend codebases built with bun for ui quality, app router structure, component patterns, responsiveness, accessibility, maintainability, and 3d section integration quality. use when auditing pages, finding frontend issues, or suggesting improvements without drifting into backend architecture.
---

# Review Next.js Frontend

Review the codebase as a **frontend quality auditor**.

## Review focus
Check for:
- weak visual hierarchy
- inconsistent spacing
- poor component boundaries
- avoidable client components
- app router misuse
- bad responsive behavior
- accessibility issues
- duplicated UI patterns
- messy Tailwind usage
- unclear naming and folder structure
- 3d scene performance or integration issues when Spline is used

## Review method
1. Understand the page or component goal.
2. Inspect layout structure.
3. Inspect component composition.
4. Inspect responsiveness and accessibility.
5. Inspect styling consistency.
6. Suggest the smallest high-impact improvements first.

## What good looks like
- Clear route and component structure
- Reusable section/component patterns
- Minimal client-side complexity
- Predictable Tailwind conventions
- Good empty, loading, and hover states
- Accessible headings, labels, landmarks, and buttons

## Extra checks for 3d pages
When Spline or other 3d sections are present, review:
- whether the scene is lazily loaded
- whether the section still communicates clearly before the scene finishes loading
- whether the layout remains readable on small screens
- whether the 3d scene competes with the CTA
- whether shared files live in predictable paths such as `components/ui`
- whether imports remain consistent if `splite.tsx` or `spotlight.tsx` were renamed

## Output format
Use this structure:

### What is working
- brief strengths

### Issues to fix now
- highest-priority problems

### Improvements worth doing next
- medium-priority refinements

### Suggested refactor direction
- concrete structure or component changes

## Guidance style
- Be direct and practical.
- Prefer actionable suggestions over generic comments.
- Show improved code only when it helps resolve a specific issue.
- Keep the review frontend-focused.
