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
  const wireOp  = isDark ? 0.8 : 0.6
  return { primary, accent, wireOp }
}

// ─── Robot inner component (runs inside Canvas) ───────────────────────────────

function Robot({ isDark }: { isDark: boolean }) {
  const baseEI = isDark ? 2.5 : 1.2
  const { primary, accent, wireOp } = useMats(isDark)

  // Part refs for animation
  const headGroupRef    = useRef<THREE.Group>(null!)
  const eyeGroupRef     = useRef<THREE.Group>(null!)
  const rightShoulderRef = useRef<THREE.Group>(null!)
  const rightElbowRef   = useRef<THREE.Group>(null!)
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
        THREE.MathUtils.clamp(pointer.x * (Math.PI / 6), -Math.PI / 6, Math.PI / 6),
        0.05,
      )
      eyeGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        eyeGroupRef.current.rotation.x,
        THREE.MathUtils.clamp(-pointer.y * (Math.PI / 6), -Math.PI / 6, Math.PI / 6),
        0.05,
      )
    }

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
      // Subtle head follow (30% of eye influence)
      headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        headGroupRef.current.rotation.y,
        pointer.x * (Math.PI / 20),
        0.03,
      )
    }

    // ── Phase animations ──
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
        const pulse = Math.max(0, baseEI + Math.sin(t * Math.PI * 4) * 3)
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

    // ── Ring base rotation (always, except POWER_UP) ──
    if (phaseRef.current !== 'POWER_UP') {
      if (ring1Ref.current) ring1Ref.current.rotation.y += delta * 0.5
      if (ring2Ref.current) ring2Ref.current.rotation.z -= delta * 0.4
    }
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
        <group position={[-0.72, 0.95, 0]}>
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
    <div className="h-65 sm:h-75 lg:h-82.5 2xl:h-125 w-full cursor-grab active:cursor-grabbing relative overflow-visible">
      {/* Ambient glow — dark mode only */}
      <div className="absolute inset-0 rounded-2xl bg-sky-500/5 dark:bg-sky-400/10 blur-2xl opacity-0 dark:opacity-100 pointer-events-none" />
      {/* Border ring */}
      <div className="absolute inset-0 rounded-2xl border border-sky-500/10 dark:border-cyan-400/15 pointer-events-none" />
      <Canvas key={resolvedTheme} gl={{ powerPreference: 'high-performance', antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
        <ambientLight intensity={isDark ? 0.5 : 1.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color={isDark ? '#0ea5e9' : '#0284c7'} />
        <pointLight position={[-10, -10, -10]} intensity={1.0} color="#22d3ee" />
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
          <Robot isDark={isDark} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  )
}
