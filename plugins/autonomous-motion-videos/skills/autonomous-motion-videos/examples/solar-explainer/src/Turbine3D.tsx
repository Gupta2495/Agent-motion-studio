import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const Blade: React.FC<{ angle: number }> = ({ angle }) => (
  <mesh rotation={[0, 0, angle]} position={[0, 0, 0.25]}>
    <boxGeometry args={[0.18, 3.2, 0.05]} />
    <meshStandardMaterial color="#F2F5FA" roughness={0.35} metalness={0.1} />
  </mesh>
);

export const Turbine3D: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const spin = f * 0.08;
  const camX = interpolate(f, [0, 150], [-3, 3]);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#5AA8F0, #CFE9FF)" }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [camX, 2, 11], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={2.2} castShadow />
        <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#6FA35A" />
        </mesh>
        <mesh position={[0, -1.2, 0]}>
          <cylinderGeometry args={[0.12, 0.28, 5.6, 24]} />
          <meshStandardMaterial color="#E6EAF0" roughness={0.4} />
        </mesh>
        <group position={[0, 1.7, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.28, 0.9, 8, 16]} />
            <meshStandardMaterial color="#DDE3EA" roughness={0.3} />
          </mesh>
          <group rotation={[0, 0, spin]} position={[0, 0, 0.6]}>
            {[0, 1, 2].map((i) => <group key={i} rotation={[0, 0, (i * 2 * Math.PI) / 3]}><group position={[0, 1.6, 0]}><Blade angle={0} /></group></group>)}
            <mesh><sphereGeometry args={[0.22, 24, 24]} /><meshStandardMaterial color="#C9D0DA" /></mesh>
          </group>
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
