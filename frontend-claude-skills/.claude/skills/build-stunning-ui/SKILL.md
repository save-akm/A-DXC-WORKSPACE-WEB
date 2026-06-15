---
name: build-stunning-ui
description: build stunning, modern frontend websites with bun and next.js app router. use when creating new pages, sections, responsive layouts, polished ui systems, marketing sites, saas dashboards, premium visual redesigns, or 3d website sections using spline. frontend only. avoid backend architecture, databases, auth setup, vector stores, and api design unless required only for mock data.
---

# Build Stunning UI

Build premium-looking frontend experiences with **Bun + Next.js App Router**.

## Default stack
- Use **Bun** for package management and scripts.
- Use **Next.js** with the **App Router**.
- Use **TypeScript**.
- Use **Tailwind CSS**.
- Prefer **shadcn/ui** for primitives.
- Prefer **lucide-react** for icons.
- Prefer **framer-motion** only when motion clearly improves the experience.

## Hard rules
- Stay **frontend only**.
- Create realistic UI with placeholder or mock data when needed.
- Do not introduce databases, qdrant, rag pipelines, vector search, or server-heavy patterns.
- Favor clean composition, strong spacing, visual hierarchy, and accessible semantics.
- Make the result look launch-ready, not tutorial-like.

## Design goals
Aim for these qualities by default:
- Bold but restrained visual hierarchy
- Clean typography scale
- Strong whitespace and rhythm
- Clear call-to-action placement
- Excellent mobile responsiveness
- Subtle motion, not noisy motion
- Accessible contrast and keyboard-friendly interactions

## Workflow
1. Identify the page type: landing page, dashboard, portfolio, docs, pricing, marketing section, or 3d hero section.
2. Define the content structure before writing components.
3. Build layout first, then typography, then cards/sections, then interaction polish.
4. Make the first screen visually strong.
5. Improve empty states, hover states, loading states, and responsiveness.

## Page blueprint
Use this structure when it fits:
- announcement or trust bar
- hero section
- social proof or logos
- features grid
- product showcase or screenshots
- testimonials or metrics
- pricing or call to action
- faq
- footer

## Implementation preferences
- Prefer server components unless client state is clearly needed.
- Keep components small and reusable.
- Extract repeated sections into dedicated components.
- Use `container`, `max-w-*`, and generous vertical spacing.
- Use gradients, blur, glass, borders, and shadows sparingly.
- Keep class names readable and grouped by layout -> spacing -> color -> effects.

## 3d website integration workflow
Use this workflow when the user asks for a **3d website design**, **spline hero**, **interactive 3d section**, or a premium scene-based landing page.

1. Verify that the codebase supports:
   - shadcn-style project structure
   - Tailwind CSS
   - TypeScript
2. If any of those are missing, explain how to set them up first.
3. Determine the component path and styles path already used by the project.
4. If shared UI primitives are not under `/components/ui`, explain why this folder matters:
   - it keeps reusable primitives in one predictable place
   - it matches common shadcn and alias conventions
   - it reduces import drift across generated code
5. Install the required packages with **Bun**:
   - `bun add @splinetool/runtime @splinetool/react-spline framer-motion`
6. Add the required UI files.
7. Keep the imported paths consistent with the actual folder structure.
8. Preserve performance by making the Spline component lazy-loaded and client-only.
9. Keep the scene in a visually strong section, usually the hero or product showcase.

## 3d file placement guidance
Unless the project already has a better established structure, use:
- `components/ui/splite.tsx`
- `components/ui/spotlight.tsx`
- `components/ui/card.tsx`
- `components/ui/demo.tsx` or rename to a clearer section file and update imports consistently

If renaming `splite.tsx` to `spline.tsx`, update all imports in the same edit. If following the user's provided prompt literally, keep `splite.tsx` as-is to avoid broken imports.

## 3d component snippets
Use these snippets when integrating the provided Spline scene.

### `components/ui/splite.tsx`
```tsx
'use client'

import { Suspense, lazy } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <span className="loader"></span>
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  )
}
```

### `components/ui/demo.tsx`
```tsx
'use client'

import { SplineScene } from '@/components/ui/splite'
import { Card } from '@/components/ui/card'
import { Spotlight } from '@/components/ui/spotlight'

export function SplineSceneBasic() {
  return (
    <Card className="w-full h-[500px] bg-black/[0.96] relative overflow-hidden">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />

      <div className="flex h-full">
        <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
            Interactive 3D
          </h1>
          <p className="mt-4 text-neutral-300 max-w-lg">
            Bring your UI to life with beautiful 3D scenes. Create immersive experiences
            that capture attention and enhance your design.
          </p>
        </div>

        <div className="flex-1 relative">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  )
}
```

### `components/ui/spotlight.tsx`
Default to the following version because it matches the provided demo API with the `fill` prop:
```tsx
import React from 'react'
import { cn } from '@/lib/utils'

type SpotlightProps = {
  className?: string
  fill?: string
}

export const Spotlight = ({ className, fill }: SpotlightProps) => {
  return (
    <svg
      className={cn(
        'animate-spotlight pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%] opacity-0',
        className,
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <g filter="url(#filter)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill={fill || 'white'}
          fillOpacity="0.21"
        ></ellipse>
      </g>
      <defs>
        <filter
          id="filter"
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          ></feBlend>
          <feGaussianBlur
            stdDeviation="151"
            result="effect1_foregroundBlur_1065_8"
          ></feGaussianBlur>
        </filter>
      </defs>
    </svg>
  )
}
```

### `components/ui/card.tsx`
Use this file only when the project does not already have the shadcn card primitive:
```tsx
import * as React from 'react'

import { cn } from '@/lib/utils'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className,
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className,
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

## Alternate spotlight option
If the user specifically wants a cursor-following glow effect instead of the static Aceternity-style spotlight, replace the spotlight implementation with the provided Ibelick variant and keep `framer-motion` installed.

## 3d design guidance
- Use 3d sparingly and intentionally.
- Let the 3d scene support the message, not overwhelm it.
- Pair dark backgrounds with restrained gradients and high-contrast text.
- Keep copy readable and place the strongest headline opposite the scene.
- Test mobile layouts carefully; stack text and reduce scene height when needed.
- Prefer a strong fallback state while the scene loads.

## Avoid
- Dense walls of text
- Weak hero sections
- Random colors without a system
- Overusing animation
- Tiny spacing differences that create visual noise
- Backend TODOs unless explicitly requested
- Forcing heavy 3d scenes into every section

## Output expectation
When implementing, produce:
1. New or updated files
2. A short summary of the UI direction
3. Any follow-up suggestions for polish or extension
