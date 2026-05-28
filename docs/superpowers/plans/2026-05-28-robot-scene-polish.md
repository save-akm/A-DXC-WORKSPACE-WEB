# Robot Scene Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply 3 polish improvements to the IT Robot scene following build-stunning-ui skill: strong loading fallback, container visual framing, and responsive mobile height.

**Architecture:** All changes stay inside `components/it-robot-scene.tsx` (fallback + decoration + height) and `app/page.tsx` (height only). No new files or dependencies. Tailwind classes only for decoration layers.

**Tech Stack:** React Three Fiber v9, @react-three/drei v10, Tailwind CSS v4, Next.js 16

**Spec:** `docs/superpowers/specs/2026-05-28-robot-scene-polish-design.md`

---

## File Map

| File | Action | Change |
|------|--------|--------|
| `components/it-robot-scene.tsx` | Modify | Suspense fallback skeleton + glow/border decoration divs + height breakpoints |
| `app/page.tsx` | Modify | Loading placeholder height classes |

---

## Task 1: Loading Fallback Skeleton

**Files:**
- Modify: `components/it-robot-scene.tsx` — line 280 (`<Suspense fallback={null}>`)

- [ ] **Step 1: Replace `fallback={null}` with skeleton group**

Find this line in `ITRobotScene()` (around line 280):
```tsx
        <Suspense fallback={null}>
```

Replace with:
```tsx
        <Suspense
          fallback={
            <group>
              <mesh position={[0, 1.6, 0]}>
                <boxGeometry args={[0.8, 0.85, 0.7]} />
                <meshBasicMaterial color="#0ea5e9" wireframe transparent opacity={0.3} />
              </mesh>
              <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1.1, 1.1, 0.65]} />
                <meshBasicMaterial color="#0ea5e9" wireframe transparent opacity={0.2} />
              </mesh>
            </group>
          }
        >
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors in `it-robot-scene.tsx`

- [ ] **Step 3: Visual check**

```bash
npm run dev
```
Open `http://localhost:3000`. Throttle network to "Slow 3G" in DevTools. Reload page. Expected: faint cyan wireframe head + torso visible instantly before full robot appears.

- [ ] **Step 4: Commit**

```bash
git add components/it-robot-scene.tsx
git commit -m "feat: add r3f skeleton fallback to robot scene"
```

---

## Task 2: Container Glow + Border Decoration

**Files:**
- Modify: `components/it-robot-scene.tsx` — the `return (...)` block of `ITRobotScene()`

- [ ] **Step 1: Add decoration layers inside wrapper div**

Find the outer wrapper div in `ITRobotScene()` (the `return` block):
```tsx
    <div className="h-[330px] 2xl:h-[500px] w-full cursor-grab active:cursor-grabbing relative overflow-visible">
      <Canvas key={resolvedTheme} ...>
```

Replace with:
```tsx
    <div className="h-82.5 2xl:h-125 w-full cursor-grab active:cursor-grabbing relative overflow-visible">
      {/* Ambient glow — dark mode only */}
      <div className="absolute inset-0 rounded-2xl bg-sky-500/5 dark:bg-sky-400/10 blur-2xl opacity-0 dark:opacity-100 pointer-events-none" />
      {/* Border ring */}
      <div className="absolute inset-0 rounded-2xl border border-sky-500/10 dark:border-cyan-400/15 pointer-events-none" />
      <Canvas key={resolvedTheme} ...>
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors in `it-robot-scene.tsx`

- [ ] **Step 3: Visual check**

```bash
npm run dev
```
Expected:
- Dark mode: subtle cyan glow halo behind robot + faint border ring
- Light mode: glow invisible, border barely visible at `sky-500/10`
- Canvas still `cursor-grab`, no layout shift

- [ ] **Step 4: Commit**

```bash
git add components/it-robot-scene.tsx
git commit -m "feat: add glow backdrop and border frame to robot scene"
```

---

## Task 3: Responsive Mobile Height

**Files:**
- Modify: `components/it-robot-scene.tsx` — wrapper div height classes
- Modify: `app/page.tsx` — loading placeholder height classes

Target height scale (Tailwind v4 canonical):
```
h-65             mobile  (< 640px)   = 260px
sm:h-75          tablet  (640px+)    = 300px
lg:h-82.5        desktop (1024px+)   = 330px
2xl:h-125        large   (1536px+)   = 500px
```

- [ ] **Step 1: Update wrapper div in `it-robot-scene.tsx`**

Find (inside `ITRobotScene` return, the outer div — already updated in Task 2):
```tsx
    <div className="h-82.5 2xl:h-125 w-full cursor-grab ...">
```

Replace `h-82.5 2xl:h-125` with the full 4-breakpoint canonical scale:
```tsx
    <div className="h-65 sm:h-75 lg:h-82.5 2xl:h-125 w-full cursor-grab active:cursor-grabbing relative overflow-visible">
```

- [ ] **Step 2: Update loading placeholder in `app/page.tsx`**

Find the loading div by its text content `Initializing AI...` (around line 25–30). Replace the entire div with the 4-breakpoint canonical height scale:
```tsx
    <div className="h-65 sm:h-75 lg:h-82.5 2xl:h-125 w-full flex items-center justify-center bg-zinc-900/5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-sm text-muted-foreground">
      Initializing AI...
    </div>
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors in changed files

- [ ] **Step 4: Visual check at mobile breakpoint**

```bash
npm run dev
```
In DevTools, set viewport to 375px wide. Expected: robot scene height ≈ 260px, fits without crowding the left-side headline text. At 768px: ≈ 300px. At 1280px: ≈ 330px.

- [ ] **Step 5: Commit**

```bash
git add components/it-robot-scene.tsx app/page.tsx
git commit -m "feat: add responsive height breakpoints to robot scene"
```
