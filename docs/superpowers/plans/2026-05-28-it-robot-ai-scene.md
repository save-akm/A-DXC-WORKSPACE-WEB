# IT Robot AI Scene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the CyberCore 3D scene on the right side of the Hero with a holographic Humanoid Robot that has mouse-tracking eyes and 3 looping action animations (Wave → Think → Power-Up).

**Architecture:** Single new file `components/it-robot-scene.tsx` built entirely with React Three Fiber primitives. Theme is passed as a prop from the outer component (safe pattern for next-themes inside Canvas). Animation runs via a useRef state machine in useFrame. Eye tracking uses useThree().pointer with lerp clamped to ±30°.

**Tech Stack:** @react-three/fiber v9, @react-three/drei v10, three v0.184, next-themes v0.4, TypeScript

**Spec:** `docs/superpowers/specs/2026-05-28-it-robot-ai-scene-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/it-robot-scene.tsx` | **Create** | Robot geometry, animations, eye tracking, dark/light materials |
| `app/page.tsx` | **Modify** | Swap dynamic import from `it-nextgen-scene` → `it-robot-scene` |
| `components/it-nextgen-scene.tsx` | **Preserve** | No changes — kept as backup |

---

## Task 1: Static Robot Geometry

**Files:**
- Create: `components/it-robot-scene.tsx`

Build the robot from R3F primitives with no animation — just verify it renders in the correct position and size.

**Robot dimensions (Three.js units, camera at z=8, fov=45):**
```
Head:         box 0.8×0.85×0.7  at y=1.6
  Visor:      box 0.55×0.18×0.02 at y=1.65, z=0.36
  Eyes:       sphere r=0.07 ×2  at y=1.65, z=0.36, x=±0.17
Neck:         cylinder r=0.15, h=0.25  at y=1.18
Torso:        box 1.1×1.1×0.65  at y=0.5
  ChestPanel: box 0.5×0.4×0.02  at y=0.6, z=0.34
Shoulders:    box 0.25×0.25×0.25 ×2  at y=0.95, x=±0.7
Right arm pivot group at [0.72, 0.95, 0]:
  UpperArm:   cylinder r=0.12, h=0.55  at local [0, -0.28, 0]
  Elbow pivot at local [0, -0.56, 0]:
    Forearm:  cylinder r=0.10, h=0.45  at local [0, -0.23, 0]
    Hand:     box 0.22×0.2×0.16       at local [0, -0.50, 0]
Left arm: mirror of right arm (x negated)
DataRing1:    torus args=[1.8, 0.03, 16, 100]
DataRing2:    torus args=[2.2, 0.03, 16, 100]
```

- [ ] **Step 1: Create `components/it-robot-scene.tsx` with static geometry**

```tsx
'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useRef, Suspense } from 'react'
import * as THREE from 'three'
import { Float, Torus, PerspectiveCamera, Environment } from '@react-three/drei'
import { useTheme } from 'next-themes'

// ─── Types ───────────────────────────────────────────────────────────────────

type AnimPhase = 'WAVE' | 'THINK' | 'POWER_UP'

const PHASE_DURATION: Record<AnimPhase, number> = {
  WAVE: 3,
  THINK: 4,
  POWER_UP: 3,
}
const PHASE_ORDER: AnimPhase[] = ['WAVE', 'THINK', 'POWER_UP']

// ─── Materials helper ─────────────────────────────────────────────────────────

function useMats(isDark: boolean) {
  const primary = isDark ? '#0ea5e9' : '#0284c7'
  const accent  = isDark ? '#22d3ee' : '#0891b2'
  const baseEI  = isDark ? 2.5 : 1.2
  const wireOp  = isDark ? 0.8 : 0.6
  return { primary, accent, baseEI, wireOp }
}

// ─── Robot inner component (runs inside Canvas) ───────────────────────────────

function Robot({ isDark }: { isDark: boolean }) {
  const { primary, accent, baseEI, wireOp } = useMats(isDark)

  // Part refs for animation
  const headGroupRef    = useRef<THREE.Group>(null!)
  const eyeGroupRef     = useRef<THREE.Group>(null!)
  const rightShoulderRef = useRef<THREE.Group>(null!)
  const rightElbowRef   = useRef<THREE.Group>(null!)
  const leftShoulderRef  = useRef<THREE.Group>(null!)
  const robotRootRef    = useRef<THREE.Group>(null!)
  const ring1Ref        = useRef<THREE.Mesh>(null!)
  const ring2Ref        = useRef<THREE.Mesh>(null!)

  // Shared material refs for emissive updates (Power-Up)
  const matRefs = useRef<THREE.MeshStandardMaterial[]>([])
  const addMat = (m: THREE.MeshStandardMaterial | null) => {
    if (m && !matRefs.current.includes(m)) matRefs.current.push(m)
  }

  // Animation state machine
  const phaseRef     = useRef<AnimPhase>('WAVE')
  const phaseTimeRef = useRef(0)

  const { pointer } = useThree()

  useFrame((_, delta) => {
    // Advance phase timer
    phaseTimeRef.current += delta
    const duration = PHASE_DURATION[phaseRef.current]
    if (phaseTimeRef.current >= duration) {
      const idx = PHASE_ORDER.indexOf(phaseRef.current)
      phaseRef.current = PHASE_ORDER[(idx + 1) % PHASE_ORDER.length]
      phaseTimeRef.current = 0
    }
    const t = phaseTimeRef.current / duration // 0..1

    // Eye tracking (always active)
    if (eyeGroupRef.current) {
      eyeGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        eyeGroupRef.current.rotation.y,
        pointer.x * (Math.PI / 6),
        0.05,
      )
      eyeGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        eyeGroupRef.current.rotation.x,
        -pointer.y * (Math.PI / 6),
        0.05,
      )
    }

    // Animations handled in Task 3
  })

  const matProps = {
    color: primary,
    emissive: primary,
    emissiveIntensity: baseEI,
    transparent: true,
    opacity: wireOp,
    wireframe: true,
  }
  const solidProps = {
    color: accent,
    emissive: accent,
    emissiveIntensity: baseEI * 1.5,
  }

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={1}>
      <group ref={robotRootRef}>

        {/* ── Head ── */}
        <group ref={headGroupRef} position={[0, 1.6, 0]}>
          <mesh>
            <boxGeometry args={[0.8, 0.85, 0.7]} />
            <meshStandardMaterial ref={addMat} {...matProps} />
          </mesh>
          {/* Visor */}
          <mesh position={[0, 0.05, 0.36]}>
            <boxGeometry args={[0.55, 0.18, 0.02]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={4} />
          </mesh>
          {/* Eyes (eye-tracking group) */}
          <group ref={eyeGroupRef}>
            <mesh position={[-0.17, 0.05, 0.36]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshBasicMaterial color={accent} toneMapped={false} />
            </mesh>
            <mesh position={[0.17, 0.05, 0.36]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshBasicMaterial color={accent} toneMapped={false} />
            </mesh>
          </group>
        </group>

        {/* ── Neck ── */}
        <mesh position={[0, 1.18, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.25, 8]} />
          <meshStandardMaterial ref={addMat} {...matProps} />
        </mesh>

        {/* ── Torso ── */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.1, 1.1, 0.65]} />
          <meshStandardMaterial ref={addMat} {...matProps} />
        </mesh>
        {/* Chest panel */}
        <mesh position={[0, 0.6, 0.34]}>
          <boxGeometry args={[0.5, 0.4, 0.02]} />
          <meshStandardMaterial {...solidProps} />
        </mesh>

        {/* ── Shoulders ── */}
        <mesh position={[0.7, 0.95, 0]}>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshStandardMaterial ref={addMat} {...matProps} />
        </mesh>
        <mesh position={[-0.7, 0.95, 0]}>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshStandardMaterial ref={addMat} {...matProps} />
        </mesh>

        {/* ── Right Arm (pivot at shoulder) ── */}
        <group ref={rightShoulderRef} position={[0.72, 0.95, 0]}>
          <mesh position={[0, -0.28, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.55, 8]} />
            <meshStandardMaterial ref={addMat} {...matProps} />
          </mesh>
          {/* Elbow pivot */}
          <group ref={rightElbowRef} position={[0, -0.56, 0]}>
            <mesh position={[0, -0.23, 0]}>
              <cylinderGeometry args={[0.10, 0.10, 0.45, 8]} />
              <meshStandardMaterial ref={addMat} {...matProps} />
            </mesh>
            <mesh position={[0, -0.50, 0]}>
              <boxGeometry args={[0.22, 0.2, 0.16]} />
              <meshStandardMaterial ref={addMat} {...matProps} />
            </mesh>
          </group>
        </group>

        {/* ── Left Arm (mirror) ── */}
        <group ref={leftShoulderRef} position={[-0.72, 0.95, 0]}>
          <mesh position={[0, -0.28, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.55, 8]} />
            <meshStandardMaterial ref={addMat} {...matProps} />
          </mesh>
          <group position={[0, -0.56, 0]}>
            <mesh position={[0, -0.23, 0]}>
              <cylinderGeometry args={[0.10, 0.10, 0.45, 8]} />
              <meshStandardMaterial ref={addMat} {...matProps} />
            </mesh>
            <mesh position={[0, -0.50, 0]}>
              <boxGeometry args={[0.22, 0.2, 0.16]} />
              <meshStandardMaterial ref={addMat} {...matProps} />
            </mesh>
          </group>
        </group>

        {/* ── Data Rings ── */}
        <Torus ref={ring1Ref} args={[1.8, 0.03, 16, 100]} rotation={[Math.PI / 3, 0, 0]}>
          <meshStandardMaterial color={primary} emissive={primary} emissiveIntensity={2} transparent opacity={0.5} />
        </Torus>
        <Torus ref={ring2Ref} args={[2.2, 0.03, 16, 100]} rotation={[0, Math.PI / 4, Math.PI / 4]}>
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} transparent opacity={0.4} />
        </Torus>

      </group>
    </Float>
  )
}

// ─── Scene wrapper ────────────────────────────────────────────────────────────

export default function ITRobotScene() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <div className="h-[330px] 2xl:h-[500px] w-full cursor-grab active:cursor-grabbing relative overflow-visible">
      <Canvas gl={{ powerPreference: 'high-performance', antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
        <ambientLight intensity={isDark ? 0.5 : 1.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color={isDark ? '#0ea5e9' : '#0284c7'} />
        <pointLight position={[-10, -10, -10]} intensity={1.0} color="#22d3ee" />
        <Suspense fallback={null}>
          <Robot isDark={isDark} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 3: Visual check in browser**

```bash
npm run dev
```
Open `http://localhost:3000`. Expected: Robot wireframe shape visible on right side of Hero, arms in resting position, DataRings orbiting.

- [ ] **Step 4: Commit**

```bash
git add components/it-robot-scene.tsx
git commit -m "feat: add IT Robot AI scene - static geometry"
```

---

## Task 2: Eye Tracking

**Files:**
- Modify: `components/it-robot-scene.tsx` — `useFrame` already has eye tracking stub from Task 1. This task verifies it works correctly and adds the head subtle follow.

The eye tracking code is already in the stub from Task 1 (`eyeGroupRef` + `pointer` lerp). This task adds a subtle head nod follow (30% of pointer influence on head) to make it feel more natural.

- [ ] **Step 1: Add head subtle follow to `useFrame` inside `Robot`**

Inside the `useFrame` callback, after the existing eye tracking block, add:

```ts
// Subtle head follow (30% of eye influence)
if (headGroupRef.current) {
  headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
    headGroupRef.current.rotation.y,
    pointer.x * (Math.PI / 20),
    0.03,
  )
}
```

- [ ] **Step 2: Visual check**

```bash
npm run dev
```
Move mouse left/right — eyes and head should follow smoothly, clamped to ~30°. Mouse at extreme left should not make eyes look backward.

- [ ] **Step 3: Commit**

```bash
git add components/it-robot-scene.tsx
git commit -m "feat: add eye and head mouse tracking to robot scene"
```

---

## Task 3: Animation State Machine

**Files:**
- Modify: `components/it-robot-scene.tsx` — fill in the `switch (phaseRef.current)` block in `useFrame`

Replace the `// Animations handled in Task 3` comment inside `useFrame` with the full animation switch block.

**Animation targets:**

| Phase | Part | Target rotation | Notes |
|-------|------|----------------|-------|
| WAVE | rightShoulder.z | lerp → `−π × 0.6` | Arm raises to side |
| WAVE | rightElbow.z | `sin(t × π × 8) × 0.5` | Wrist waves 4× |
| THINK | rightShoulder.x | lerp → `−π × 0.5` | Arm forward |
| THINK | rightShoulder.z | lerp → `−π × 0.35` | Arm slightly up |
| THINK | rightElbow.x | lerp → `π × 0.65` | Elbow bends, hand to chin |
| THINK | headGroup.z | lerp → `−0.18` | Head tilts, thinking |
| POWER_UP | all mats `.emissiveIntensity` | pulse `baseEI + sin(t×π×4) × 3` | Pulse 4× |
| POWER_UP | robotRoot.scale | `1 + sin(t×π×2) × 0.05` | Subtle expand |
| POWER_UP | ring1/ring2 rotation | spin faster `× 3` speed | Rings accelerate |
| RESET (any→next) | all targets | lerp back to neutral 0 | Smooth return |

- [ ] **Step 1: Replace animation comment with full switch block**

Inside the `useFrame` callback, replace `// Animations handled in Task 3` with:

```ts
// ── Reset arms to neutral (lerp from any pose) ──
if (rightShoulderRef.current) {
  rightShoulderRef.current.rotation.x = THREE.MathUtils.lerp(rightShoulderRef.current.rotation.x, 0, 0.05)
  rightShoulderRef.current.rotation.z = THREE.MathUtils.lerp(rightShoulderRef.current.rotation.z, 0, 0.05)
}
if (rightElbowRef.current) {
  rightElbowRef.current.rotation.x = THREE.MathUtils.lerp(rightElbowRef.current.rotation.x, 0, 0.05)
  rightElbowRef.current.rotation.z = THREE.MathUtils.lerp(rightElbowRef.current.rotation.z, 0, 0.05)
}
if (headGroupRef.current) {
  headGroupRef.current.rotation.z = THREE.MathUtils.lerp(headGroupRef.current.rotation.z, 0, 0.05)
}

// ── Phase animations (override neutral lerp) ──
switch (phaseRef.current) {
  case 'WAVE': {
    if (rightShoulderRef.current) {
      rightShoulderRef.current.rotation.z = THREE.MathUtils.lerp(
        rightShoulderRef.current.rotation.z,
        -Math.PI * 0.6,
        0.06,
      )
    }
    if (rightElbowRef.current) {
      rightElbowRef.current.rotation.z = Math.sin(t * Math.PI * 8) * 0.5
    }
    break
  }
  case 'THINK': {
    if (rightShoulderRef.current) {
      rightShoulderRef.current.rotation.x = THREE.MathUtils.lerp(rightShoulderRef.current.rotation.x, -Math.PI * 0.5, 0.06)
      rightShoulderRef.current.rotation.z = THREE.MathUtils.lerp(rightShoulderRef.current.rotation.z, -Math.PI * 0.35, 0.06)
    }
    if (rightElbowRef.current) {
      rightElbowRef.current.rotation.x = THREE.MathUtils.lerp(rightElbowRef.current.rotation.x, Math.PI * 0.65, 0.06)
    }
    if (headGroupRef.current) {
      headGroupRef.current.rotation.z = THREE.MathUtils.lerp(headGroupRef.current.rotation.z, -0.18, 0.04)
    }
    break
  }
  case 'POWER_UP': {
    const pulse = baseEI + Math.sin(t * Math.PI * 4) * 3
    matRefs.current.forEach((m) => { m.emissiveIntensity = pulse })
    if (robotRootRef.current) {
      const s = 1 + Math.sin(t * Math.PI * 2) * 0.05
      robotRootRef.current.scale.setScalar(s)
    }
    if (ring1Ref.current) ring1Ref.current.rotation.y += delta * 3
    if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 3
    break
  }
}

// ── Ring base rotation (always) ──
if (phaseRef.current !== 'POWER_UP') {
  if (ring1Ref.current) ring1Ref.current.rotation.y += delta * 0.5
  if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 0.4
}
```

Note: `baseEI` must be accessible inside `useFrame`. Move it out of `useMats` or pass it as a ref. Add at the top of `Robot`:

```ts
const baseEI = isDark ? 2.5 : 1.2
```

Remove `baseEI` from the `useMats` destructure (keep `primary`, `accent`, `wireOp`).

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 3: Visual check — all 3 phases**

```bash
npm run dev
```
Watch for ~10 seconds. Expected sequence:
1. Robot raises right arm and waves wrist (3s)
2. Right arm folds to chin area, head tilts (4s)
3. Robot pulses with bright cyan glow, rings spin fast (3s)
4. Repeats from Wave

- [ ] **Step 4: Commit**

```bash
git add components/it-robot-scene.tsx
git commit -m "feat: add wave/think/power-up animation loop to robot scene"
```

---

## Task 4: Dark/Light Mode

**Files:**
- Modify: `components/it-robot-scene.tsx` — verify colors update when theme toggles

The `isDark` prop already flows from `ITRobotScene` (which calls `useTheme`) → `Robot`. However, React Three Fiber materials are imperative — changing the `color` prop on `<meshStandardMaterial>` after mount requires the `key` trick or a `useEffect` to push color updates to GPU.

- [ ] **Step 1: Add `useEffect` to push color updates when theme changes**

Add this inside the `Robot` component, after the refs:

```ts
import { useEffect } from 'react'

// ...inside Robot component...
useEffect(() => {
  matRefs.current.forEach((m) => {
    m.color.set(isDark ? '#0ea5e9' : '#0284c7')
    m.emissive.set(isDark ? '#0ea5e9' : '#0284c7')
    m.emissiveIntensity = isDark ? 2.5 : 1.2
    m.opacity = isDark ? 0.8 : 0.6
  })
}, [isDark])
```

Also add key to the Canvas so lights re-render on theme change:

In `ITRobotScene`, add `key={resolvedTheme}` to the `<ambientLight>` and both `<pointLight>` elements. Or more simply, add `key={resolvedTheme}` to the whole `<Canvas>` component — this remounts the Canvas cleanly on theme switch, which is acceptable since theme changes are infrequent:

```tsx
<Canvas key={resolvedTheme} gl={{ powerPreference: 'high-performance', antialias: true }}>
```

- [ ] **Step 2: Visual check — dark/light toggle**

```bash
npm run dev
```
Click the ThemeToggle button on the hero. Expected:
- Dark mode: bright cyan wireframe with high emissive glow
- Light mode: slightly darker cyan, lower glow, brighter ambient

- [ ] **Step 3: Commit**

```bash
git add components/it-robot-scene.tsx
git commit -m "feat: add dark/light mode support to robot scene"
```

---

## Task 5: Wire Into page.tsx

**Files:**
- Modify: `app/page.tsx` lines 24–27

Replace the existing dynamic import block:

```tsx
// BEFORE
const Scene = dynamic(() => import('@/components/it-nextgen-scene'), { 
  ssr: false,
  loading: () => <div className="h-100 w-full flex items-center justify-center bg-zinc-900/5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">Initiating Core...</div>
});
```

With:

```tsx
// AFTER
const Scene = dynamic(() => import('@/components/it-robot-scene'), {
  ssr: false,
  loading: () => (
    <div className="h-[330px] 2xl:h-[500px] w-full flex items-center justify-center bg-zinc-900/5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-sm text-muted-foreground">
      Initializing AI...
    </div>
  ),
})
```

No other changes — `<Scene />` usage, wrapper id `cyber-core-zoom`, and GSAP timeline remain identical.

- [ ] **Step 1: Edit the dynamic import in `app/page.tsx`**

Make the change shown above.

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 3: Full visual acceptance check**

```bash
npm run dev
```
Verify:
1. Hero loads with Robot on right (not CyberCore)
2. Eyes follow mouse cursor
3. Animations cycle: Wave → Think → Power-Up
4. Scroll down — GSAP warp zoom triggers correctly on `#cyber-core-zoom`
5. After warp, Landing section appears normally
6. Toggle theme — Robot updates colors

- [ ] **Step 4: Final commit**

```bash
git add app/page.tsx
git commit -m "feat: replace CyberCore with IT Robot AI scene on hero"
```
