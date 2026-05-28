# Robot Scene Polish — Design Spec

**Date:** 2026-05-28
**Status:** Approved
**Guided by:** build-stunning-ui skill (3D design guidance + design goals)

## Summary

Apply 3 polish improvements to `components/it-robot-scene.tsx` following `build-stunning-ui` skill principles: strong loading fallback, container visual framing, and responsive mobile height.

---

## Section 1: Loading Fallback

**Problem:** `<Suspense fallback={null}>` shows nothing while Three.js Environment asset loads.

**Skill principle:** "Prefer a strong fallback state while the scene loads."

**Solution:** Replace `fallback={null}` with a minimal R3F skeleton group inside Canvas — wireframe head + torso boxes at the robot's actual positions with low opacity. Robot outline is visible immediately before Environment finishes loading.

```tsx
<Suspense fallback={
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
}>
```

---

## Section 2: Container Polish

**Problem:** Wrapper div is unstyled — no visual framing around the 3D scene.

**Skill principle:** "Use gradients, blur, glass, borders, and shadows sparingly."

**Solution:** Add 2 absolutely-positioned decoration layers inside the wrapper div, both `pointer-events-none`:

- **Glow layer:** `bg-radial` gradient from `sky-500/10` to transparent, `blur-xl`, visible in dark mode only (`dark:opacity-100 opacity-0`)
- **Border layer:** `border border-sky-500/10 dark:border-cyan-400/15`, `rounded-2xl`

Both layers sit behind the Canvas via CSS stacking. No new dependencies.

---

## Section 3: Mobile Height

**Problem:** `h-[330px]` from mobile → xl with only `2xl:h-[500px]` override — too large on small screens.

**Skill principle:** "Test mobile layouts carefully; stack text and reduce scene height when needed."

**Solution:** 4-breakpoint responsive height applied consistently to the wrapper div in `it-robot-scene.tsx` AND the loading placeholder div in `app/page.tsx`:

| Breakpoint | Class | Viewport |
|---|---|---|
| default | `h-[260px]` | < 640px (mobile) |
| sm | `sm:h-[300px]` | 640px+ |
| lg | `lg:h-[330px]` | 1024px+ |
| 2xl | `2xl:h-[500px]` | 1536px+ |

---

## Files Changed

| File | Change |
|------|--------|
| `components/it-robot-scene.tsx` | Suspense fallback skeleton + container decoration layers + height breakpoints |
| `app/page.tsx` | Loading placeholder height classes updated to match |
