"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface DotGlobeHeroProps {
  rotationSpeed?: number;
  globeRadius?: number;
  className?: string;
  children?: React.ReactNode;
}

function Globe({ rotationSpeed, radius }: { rotationSpeed: number; radius: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [colors, setColors] = useState<{ line: string; dot: string }>();

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    setColors({
      line: styles.getPropertyValue("--color-stage-bright").trim(),
      dot: styles.getPropertyValue("--color-stage-ice").trim(),
    });
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += rotationSpeed;
    groupRef.current.rotation.x += rotationSpeed * 0.3;
    groupRef.current.rotation.z += rotationSpeed * 0.1;
  });

  if (!colors) return null;

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshBasicMaterial color={colors.line} transparent opacity={0.22} wireframe />
      </mesh>
      <points>
        <sphereGeometry args={[radius * 1.02, 28, 28]} />
        <pointsMaterial color={colors.dot} size={0.012} transparent opacity={0.7} />
      </points>
    </group>
  );
}

const DotGlobeHero = React.forwardRef<HTMLDivElement, DotGlobeHeroProps>(
  ({ rotationSpeed = 0.004, globeRadius = 1, className, children, ...props }, ref) => (
    <div ref={ref} className={cn("relative size-full overflow-hidden", className)} {...props}>
      <div className="relative z-10 flex size-full flex-col items-center justify-center">{children}</div>
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
          <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={72} />
          <ambientLight intensity={0.5} />
          <pointLight position={[6, 6, 6]} intensity={1} />
          <Globe rotationSpeed={rotationSpeed} radius={globeRadius} />
        </Canvas>
      </div>
    </div>
  ),
);
DotGlobeHero.displayName = "DotGlobeHero";

export { DotGlobeHero, type DotGlobeHeroProps };
