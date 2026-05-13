// src/components/ThreeSportsBackground.tsx

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const AnimatedBall: React.FC<{
  position: [number, number, number];
  color: string;
  accentColor: string;
  scale?: number;
}> = ({ position, color, accentColor, scale = 1 }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    groupRef.current.rotation.x += delta * 0.25;
    groupRef.current.rotation.y += delta * 0.35;
  });

  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={1.2}>
      <group ref={groupRef} position={position} scale={scale}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <MeshDistortMaterial
            color={color}
            roughness={0.35}
            metalness={0.15}
            distort={0.18}
            speed={1.5}
          />
        </mesh>

        {/* Đường viền mô phỏng họa tiết bóng */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.02, 0.025, 16, 100]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.3} />
        </mesh>

        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[1.03, 0.02, 16, 100]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.25} />
        </mesh>
      </group>
    </Float>
  );
};

const ThreeSportsBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <color attach="background" args={['#050816']} />

        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <pointLight position={[-4, -2, 4]} intensity={3} color="#2563eb" />
        <pointLight position={[4, 3, 3]} intensity={2.5} color="#9333ea" />

        <Stars
          radius={80}
          depth={40}
          count={900}
          factor={4}
          saturation={0}
          fade
          speed={0.8}
        />

        <AnimatedBall
          position={[-3.3, 1.4, 0]}
          color="#2563eb"
          accentColor="#93c5fd"
          scale={1.05}
        />

        <AnimatedBall
          position={[3.2, -1.1, -0.5]}
          color="#f97316"
          accentColor="#fed7aa"
          scale={0.9}
        />

        <AnimatedBall
          position={[1.7, 2.1, -1.5]}
          color="#16a34a"
          accentColor="#bbf7d0"
          scale={0.55}
        />

        {/* Vòng năng lượng phía sau form */}
        <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.5}>
          <mesh position={[0, 0, -2]} rotation={[0.5, 0.3, 0]}>
            <torusGeometry args={[2.7, 0.035, 16, 180]} />
            <meshStandardMaterial
              color="#60a5fa"
              emissive="#2563eb"
              emissiveIntensity={1.3}
              transparent
              opacity={0.65}
            />
          </mesh>
        </Float>
      </Canvas>

      {/* Overlay giúp form dễ đọc hơn */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-blue-950/40 to-purple-950/50" />
    </div>
  );
};

export default ThreeSportsBackground;