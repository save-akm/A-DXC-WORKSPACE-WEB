# IT Robot AI Scene — Design Spec

**Date:** 2026-05-28
**Status:** Approved

## Summary

Replace the existing `it-nextgen-scene.tsx` (CyberCore) on the right side of the Hero section with a new Humanoid Robot AI 3D scene built with React Three Fiber. The robot uses Cyan/Teal colors, supports dark/light mode, has 3 looping action animations, and eye-tracks the mouse cursor.

---

## Section 1: Component Structure

**New file:** `components/it-robot-scene.tsx`
**Modified file:** `app/page.tsx` — change dynamic import to `it-robot-scene`
**Preserved file:** `components/it-nextgen-scene.tsx` — kept as backup, not deleted

Robot built entirely from R3F geometry primitives (no .glb file):

```
RobotScene (Canvas)
└── Robot (group)
    ├── Head (boxGeometry) + Visor (plane, emissive)
    │   └── Eyes (2x sphere) — rotate to follow mouse
    ├── Neck (cylinder)
    ├── Torso (boxGeometry)
    ├── Shoulders (2x box)
    ├── Arms (group x2)
    │   ├── UpperArm (cylinder)
    │   └── Forearm + Hand (cylinder + box)
    └── DataRings (torus x2 orbiting)
```

Robot is upper-body only (floats from waist up) for a holographic aesthetic. DataRings preserve visual continuity with the previous CyberCore scene.

---

## Section 2: Animation System

State machine in `useFrame` cycles through 3 animations continuously:

```
WAVE (3s) → THINK (4s) → POWER_UP (3s) → WAVE → ...
```

### Wave
- Right arm raises and rotates wrist left-right 3 times
- Returns to idle position at end of phase

### Think
- Right arm folds up, hand touches jaw area
- Head tilts slightly left
- Robot bobs slowly (float up-down)

### Power-Up
- emissive intensity on all parts pulses from 1 → 4
- Robot scale expands 1 → 1.05
- DataRings spin faster
- Particles burst outward (60 particles max)
- All values reset smoothly at end of phase

### Eye Tracking (always active, independent of animation state)
- Mouse position from `useThree().pointer` (normalized −1 to 1)
- Eye group `.rotation.y` and `.rotation.x` lerped toward mouse direction
- Rotation clamped to ±30° to avoid uncanny appearance

### Dark / Light Mode
Uses `useTheme()` from `next-themes`:

| Mode  | Emissive color | Emissive intensity | Wireframe opacity | Ambient light |
|-------|---------------|-------------------|-------------------|---------------|
| Dark  | `#0ea5e9`     | 2.5               | 0.8               | 0.5           |
| Light | `#0284c7`     | 1.2               | 0.6               | 1.2           |

---

## Section 3: Files & Edge Cases

### Files Changed

| File | Change |
|------|--------|
| `components/it-robot-scene.tsx` | **Create** — Robot, animations, eye tracking |
| `app/page.tsx` | **Edit** — update dynamic import name |
| `components/it-nextgen-scene.tsx` | **Preserve** — no changes |

### Edge Cases

- **SSR** — `dynamic(() => import(...), { ssr: false })` same as existing scene
- **Loading state** — show "Initializing AI..." placeholder while Canvas loads
- **GSAP Warp** — `#cyber-core-zoom` wrapper id stays the same in `page.tsx`; GSAP scroll timeline is unaffected
- **Performance** — `gl={{ powerPreference: 'high-performance' }}`, particles capped at 60
- **Canvas size** — `h-[330px] 2xl:h-[500px]` unchanged, no responsive resize needed
