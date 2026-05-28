'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { 
  Float, 
  Sphere, 
  Torus,
  PerspectiveCamera,
  Environment,
  Icosahedron,
} from '@react-three/drei';

function DataParticles({ count = 100, color = "#6366f1" }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        p[i * 3] = (Math.random() - 0.5) * 10;
        p[i * 3 + 1] = (Math.random() - 0.5) * 10;
        p[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return p;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color={color} transparent opacity={0.6} />
    </points>
  );
}

function OrbitingNode({ radius, color, speed = 1, size = 0.05 }: { radius: number; color: string; speed?: number; size?: number }) {
  const pingRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame(({ clock }) => {
    if (pingRef.current && materialRef.current) {
      // คำนวณเวลาเพื่อทำ animation วนลูป (Ping effect)
      const t = (clock.elapsedTime * speed * 1.2) % 1;
      
      const currentScale = 1 + t * 1.0;
      pingRef.current.scale.set(currentScale, currentScale, currentScale);
      
      materialRef.current.opacity = 0.6 * (1 - t);
    }
  });

  return (
    <group position={[radius, 0, 0]}>
      <Sphere args={[size, 16, 16]}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </Sphere>
      <Sphere ref={pingRef} args={[size, 16, 16]}>
        <meshBasicMaterial 
          ref={materialRef}
          color={color} 
          toneMapped={false}
          transparent={true}
          opacity={0.6}
          depthWrite={false}
        />
      </Sphere>
    </group>
  );
}

function CyberCore() {
  const coreRef = useRef<THREE.Mesh>(null!);
  const ring1Ref = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const ring3Ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Core rotation
    if (coreRef.current) coreRef.current.rotation.z = time * 0.1;
    
    // Rings rotation
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = time * 0.5;
      ring1Ref.current.rotation.y = time * 0.2;
      ring1Ref.current.rotation.z = time * 1.5; // ให้จุดวิ่งตามเส้น
    }
    
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = time * 0.3;
      ring2Ref.current.rotation.y = time * 0.4;
      ring2Ref.current.rotation.z = -time * 2.0; // ย้อนศร
    }
    
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = time * 0.1;
      ring3Ref.current.rotation.y = time * 0.2;
      ring3Ref.current.rotation.z = time * 1.2;
    }
  });

  return (
    <group>
      {/* Central Core */}
      <Float speed={3} rotationIntensity={1} floatIntensity={1.5}>
        <Icosahedron ref={coreRef} args={[1.4, 1]}>
          <meshStandardMaterial color="#818cf8" wireframe={true} emissive="#6366f1" emissiveIntensity={2} />
        </Icosahedron>
        {/* แกนในแบบทึบ */}
        <Icosahedron args={[0.8, 0]}>
          <meshStandardMaterial color="#4f46e5" emissive="#3730a3" emissiveIntensity={1} transparent opacity={0.8} />
        </Icosahedron>
      </Float>

      {/* Orbiting Rings */}
      <Torus ref={ring1Ref} args={[1.8, 0.05, 16, 100]}>
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2} transparent opacity={0.6} />
        <OrbitingNode radius={1.8} color="#0ea5e9" speed={1} size={0.09} />
      </Torus>
      
      <Torus ref={ring2Ref} args={[2.2, 0.04, 16, 100]}>
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={2} transparent opacity={0.5} />
        <OrbitingNode radius={2.2} color="#ec4899" speed={1.5} size={0.09} />
      </Torus>

      <Torus ref={ring3Ref} args={[2.6, 0.03, 16, 100]}>
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={2} transparent opacity={0.4} />
        <OrbitingNode radius={2.6} color="#8b5cf6" speed={0.8} size={0.09} />
      </Torus>

      {/* <DataParticles /> */}
    </group>
  );
}

export default function ITNextGenScene() {
  return (
    <div className="h-[330px] 2xl:h-[500px] w-full cursor-grab active:cursor-grabbing relative overflow-visible">
      <Canvas gl={{ powerPreference: 'high-performance', antialias: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#818cf8" />
        <pointLight position={[-10, -10, -10]} intensity={1.5} color="#c084fc" />
        <spotLight position={[0, 5, 0]} intensity={1} />
        
        <Suspense fallback={null}>
          <CyberCore />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
