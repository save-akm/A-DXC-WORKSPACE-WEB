'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.x = time * 0.2;
    meshRef.current.rotation.y = time * 0.3;
  });

  return (
    <Float speed={4} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 100, 100]} scale={1.5}>
        <MeshDistortMaterial
          color="#3b82f6"
          attach="material"
          distort={0.5}
          speed={2}
          roughness={0}
        />
      </Sphere>
    </Float>
  );
}

export default function Scene() {
  return (
    <div className="h-[400px] w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <spotLight position={[-10, -10, -10]} intensity={1} />
        <AnimatedSphere />
      </Canvas>
    </div>
  );
}
