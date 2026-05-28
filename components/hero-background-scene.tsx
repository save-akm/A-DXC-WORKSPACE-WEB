'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { warpState } from '@/lib/warp-state';

// ─── Ambient Floating Particles ───────────────────────────────────────────────
// The original background particles. During warp they glow brighter / larger.
function DataParticles({ count = 300, color = "#6366f1" }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.PointsMaterial>(null!);

  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3]     = (Math.random() - 0.5) * 20;
      p[i * 3 + 1] = (Math.random() - 0.5) * 20;
      p[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return p;
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      pointsRef.current.rotation.x = state.clock.getElapsedTime() * 0.02;
    }

    // Boost brightness & size during warp phase
    if (materialRef.current) {
      const p = warpState.progress;
      // Smooth bell-curve intensity centered around p=0.45
      const warpIntensity = Math.max(0, Math.sin(Math.min(p / 0.7, 1) * Math.PI));
      materialRef.current.opacity = 0.5 + warpIntensity * 0.35;
      materialRef.current.size = 0.06 + warpIntensity * 0.04;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.06}
        color={color}
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Warp Streaks (Hyperspace Light Trails) ───────────────────────────────────
// Instanced thin boxes positioned in a cylindrical shell around the camera path.
// During warp, they elongate along Z to create Star-Wars-style speed lines.
function WarpStreaks({ count = 150 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 7 + 1.5;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: Math.random() * 40 - 20,
        speed: Math.random() * 0.5 + 0.5,
      };
    });
  }, [count]);

  useFrame(() => {
    if (!meshRef.current) return;
    const p = warpState.progress;

    // Streaks visible during warp phase (0.30 → 0.85)
    const intensity =
      p < 0.30 ? 0 :
      p < 0.45 ? (p - 0.30) / 0.15 :
      p < 0.75 ? 1 :
      p < 0.85 ? 1 - (p - 0.75) / 0.10 :
      0;

    particles.forEach((pt, i) => {
      dummy.position.set(pt.x, pt.y, pt.z);

      // Scale Z: tiny → long streak
      const streakLength = 1 + intensity * 30 * pt.speed;
      dummy.scale.set(1, 1, streakLength);

      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;

    // Fade material
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = intensity * 0.55;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      {/* Thin box along Z axis — scales to become streak */}
      <boxGeometry args={[0.025, 0.025, 0.15]} />
      <meshBasicMaterial
        color="#c7d2fe"
        transparent
        opacity={0}
        toneMapped={false}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ─── Camera Controller ────────────────────────────────────────────────────────
// Reads warpState.progress and smoothly moves the camera Z + adjusts FOV.
//
// Phase guide:
//   0.00–0.30  Approach: gentle forward drift, slight FOV increase
//   0.30–0.60  Warp:     accelerate hard, dramatic FOV expansion
//   0.60–0.80  Exit:     decelerate, FOV contracts
//   0.80–1.00  Settle:   camera rests, FOV normalizes
function CameraController() {
  const { camera } = useThree();

  useFrame(() => {
    const p = warpState.progress;

    // ── Camera Z ──
    let targetZ: number;
    if (p < 0.3) {
      targetZ = THREE.MathUtils.lerp(10, 6, p / 0.3);
    } else if (p < 0.6) {
      const t = (p - 0.3) / 0.3;
      targetZ = THREE.MathUtils.lerp(6, -6, t * t); // ease-in acceleration
    } else {
      targetZ = THREE.MathUtils.lerp(-6, -8, (p - 0.6) / 0.4);
    }

    // ── FOV ──
    let targetFov: number;
    if (p < 0.3) {
      targetFov = THREE.MathUtils.lerp(45, 60, p / 0.3);
    } else if (p < 0.6) {
      targetFov = THREE.MathUtils.lerp(60, 120, (p - 0.3) / 0.3);
    } else if (p < 0.8) {
      targetFov = THREE.MathUtils.lerp(120, 55, (p - 0.6) / 0.2);
    } else {
      targetFov = THREE.MathUtils.lerp(55, 45, (p - 0.8) / 0.2);
    }

    // Smooth follow (lerp factor 0.12 → ~7-8 frames to settle)
    camera.position.z += (targetZ - camera.position.z) * 0.12;

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov += (targetFov - camera.fov) * 0.12;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

// ─── Exported Scene ───────────────────────────────────────────────────────────
export default function HeroBackgroundScene() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />

      {/* Canvas for Particles + Warp */}
      <Canvas
        gl={{ powerPreference: 'high-performance', antialias: false, alpha: true }}
        camera={{ position: [0, 0, 10], fov: 45 }}
        className="absolute inset-0"
      >
        <ambientLight intensity={0.5} />
        <DataParticles count={500} color="#818cf8" />
        <DataParticles count={250} color="#c084fc" />
        <WarpStreaks count={150} />
        <CameraController />
      </Canvas>
    </div>
  );
}
