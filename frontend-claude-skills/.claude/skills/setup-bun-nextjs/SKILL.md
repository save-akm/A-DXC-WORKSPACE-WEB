---
name: setup-bun-nextjs
description: set up a frontend-only bun and next.js starter for stunning ui work. use when initializing a new project, installing required frontend packages, preparing app router structure, standardizing the local environment for design-heavy next.js development, or preparing a project for 3d spline sections.
---

# Setup Bun + Next.js

Set up a clean **frontend-only** project foundation for premium UI work.

## Target stack
- Bun runtime and package manager
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- lucide-react
- framer-motion
- class-variance-authority
- clsx
- tailwind-merge
- Spline packages when 3d sections are requested

## Setup workflow
1. Verify Bun is installed.
2. Create a new Next.js app using Bun.
3. Confirm the project uses App Router and TypeScript.
4. Install the core UI dependencies.
5. Initialize shadcn/ui.
6. Create a clean starter structure for routes and components.
7. Run the dev server and verify the app boots.

## Suggested project structure
- `app/`
- `components/ui/`
- `components/sections/`
- `components/shared/`
- `lib/`
- `public/`
- `styles/` if needed

## Required packages
Install or prepare these when needed:
- `lucide-react`
- `framer-motion`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `sonner` for toasts if needed
- shadcn/ui components as required by the page

## 3d setup workflow
When the user wants a 3d section or hero:
1. Verify the project supports shadcn conventions, Tailwind CSS, and TypeScript.
2. If not, explain what is missing and how to add it.
3. Determine whether the codebase already uses `components/ui` for primitives.
4. If not, explain that placing reusable primitives in `components/ui` keeps imports predictable and matches common shadcn alias patterns.
5. Install the extra dependencies with Bun:
   - `bun add @splinetool/runtime @splinetool/react-spline framer-motion`
6. Add or reuse:
   - `components/ui/splite.tsx`
   - `components/ui/spotlight.tsx`
   - `components/ui/card.tsx`
   - `components/ui/demo.tsx` or a section file with updated imports
7. Ensure path aliases such as `@/components/*` and `@/lib/*` resolve correctly.

## Rules
- Default to Bun commands.
- Do not add backend infra.
- Use mock data for UI work unless real APIs are explicitly requested.
- Keep the starter minimal and easy to extend.
- Reuse existing shadcn primitives when present instead of duplicating files.

## Done criteria
The project should:
- run locally with Bun
- render a clean starter page
- include the required frontend dependencies
- be ready for page or component generation
- be ready for Spline-based 3d sections when requested
