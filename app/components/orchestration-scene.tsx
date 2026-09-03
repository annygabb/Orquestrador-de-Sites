"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Line, PresentationControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function Core({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame((state, delta) => {
    if (!group.current || reducedMotion) return;
    group.current.rotation.y += delta * 0.18;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, state.pointer.y * 0.12, 0.035);
    if (material.current) material.current.iridescenceIOR = 1.3 + Math.sin(state.clock.elapsedTime * 0.7) * 0.08;
  });

  return (
    <group ref={group}>
      <mesh castShadow>
        <torusKnotGeometry args={[1.15, 0.33, 180, 28, 2, 3]} />
        <meshPhysicalMaterial ref={material} color="#7657ff" roughness={0.16} metalness={0.3} transmission={0.18} thickness={1.1} clearcoat={1} clearcoatRoughness={0.12} iridescence={0.9} iridescenceIOR={1.3} />
      </mesh>
      <mesh scale={1.72}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color="#8deeff" wireframe transparent opacity={0.13} />
      </mesh>
      <pointLight color="#c7ff43" intensity={5.2} distance={7} position={[1.8, -0.4, 2.6]} />
      <pointLight color="#9a72ff" intensity={4.8} distance={7} position={[-2.2, 1.5, 1.2]} />
    </group>
  );
}

function Nodes({ reducedMotion }: { reducedMotion: boolean }) {
  const nodes: Array<[number, number, number]> = [[-2.25, 1.35, 0.15], [2.2, 1.05, -0.05], [-1.9, -1.55, 0.25], [2.05, -1.35, 0.1]];
  const colors = ["#9a72ff", "#8deeff", "#c7ff43", "#ff8b66"];
  return <>
    {nodes.map((position, index) => (
      <Float key={colors[index]} speed={reducedMotion ? 0 : 1.1 + index * 0.08} rotationIntensity={reducedMotion ? 0 : 0.18} floatIntensity={reducedMotion ? 0 : 0.22}>
        <mesh position={position}>
          <octahedronGeometry args={[0.27, 0]} />
          <meshStandardMaterial color={colors[index]} emissive={colors[index]} emissiveIntensity={0.75} roughness={0.25} metalness={0.35} />
        </mesh>
      </Float>
    ))}
    {nodes.map((position, index) => <Line key={`line-${index}`} points={[[0, 0, 0], position]} color={colors[index]} transparent opacity={0.38} lineWidth={0.7} />)}
  </>;
}

function CameraRig() {
  const { camera } = useThree();
  useFrame((state) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, state.pointer.x * 0.22, 0.025);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export function OrchestrationScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <Canvas dpr={[1, 1.45]} camera={{ position: [0, 0, 6.8], fov: 42 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} fallback={<div className="orchestration-poster" aria-hidden="true" />}>
      <ambientLight intensity={0.7} />
      <hemisphereLight color="#e8edff" groundColor="#090713" intensity={1.35} />
      <directionalLight color="#e8edff" intensity={2.6} position={[3, 4, 5]} />
      <PresentationControls global={false} enabled={!reducedMotion} cursor snap rotation={[0.06, -0.15, 0]} polar={[-0.3, 0.3]} azimuth={[-0.5, 0.5]}>
        <Core reducedMotion={reducedMotion} />
        <Nodes reducedMotion={reducedMotion} />
      </PresentationControls>
      {!reducedMotion && <CameraRig />}
    </Canvas>
  );
}
