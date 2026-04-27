import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html } from "@react-three/drei";
import * as THREE from "three";

export interface SkeletonPart {
  id: string;
  name: string;
  description: string;
}

interface BonePartProps {
  partId: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  geometry: React.ReactNode;
  selectedId: string | null;
  hoveredId: string | null;
  setHovered: (id: string | null) => void;
  onSelect: (id: string) => void;
}

function BonePart({ partId, position, rotation = [0, 0, 0], geometry, selectedId, hoveredId, setHovered, onSelect }: BonePartProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseId = partId.replace(/-[lr]$/, "").replace(/-\d+$/, "");
  const isSelected = selectedId === baseId;
  const isHovered = hoveredId === partId;

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const targetEmissive = isSelected ? 0.8 : isHovered ? 0.25 : 0;
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.15;
    const targetColor = isSelected ? new THREE.Color("#f5d76e") : new THREE.Color("#f0e6d2");
    mat.color.lerp(targetColor, 0.15);
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(partId);
    document.body.style.cursor = "pointer";
  };
  const handlePointerOut = () => {
    setHovered(null);
    document.body.style.cursor = "auto";
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(partId);
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      castShadow
      receiveShadow
    >
      {geometry}
      <meshStandardMaterial
        color="#f0e6d2"
        roughness={0.45}
        metalness={0.05}
        emissive="#f5d76e"
        emissiveIntensity={0}
      />
    </mesh>
  );
}

interface SkeletonModelProps {
  selectedId: string | null;
  hoveredId: string | null;
  setHovered: (id: string | null) => void;
  onSelect: (id: string) => void;
}

function SkeletonModel(props: SkeletonModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && !props.selectedId) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  const part = (id: string, pos: [number, number, number], geom: React.ReactNode, rot?: [number, number, number]) => (
    <BonePart
      key={id}
      partId={id}
      position={pos}
      rotation={rot}
      geometry={geom}
      selectedId={props.selectedId}
      hoveredId={props.hoveredId}
      setHovered={props.setHovered}
      onSelect={props.onSelect}
    />
  );

  return (
    <group ref={groupRef} position={[0, -1.6, 0]}>
      {/* CRANIU */}
      {part("frontal", [0, 3.4, 0], <sphereGeometry args={[0.42, 32, 32]} />)}
      {/* MANDIBULA */}
      {part("mandibula", [0, 3.0, 0.05], <boxGeometry args={[0.35, 0.18, 0.32]} />)}

      {/* COLOANA — vertebre cervicale */}
      {Array.from({ length: 7 }).map((_, i) =>
        part(`vert-cervicale-${i}`, [0, 2.75 - i * 0.07, 0], <cylinderGeometry args={[0.08, 0.09, 0.06, 16]} />)
      )}

      {/* CLAVICULE */}
      {part("clavicula-l", [-0.45, 2.3, 0.1], <cylinderGeometry args={[0.05, 0.05, 0.55, 12]} />, [0, 0, Math.PI / 2.6])}
      {part("clavicula-r", [0.45, 2.3, 0.1], <cylinderGeometry args={[0.05, 0.05, 0.55, 12]} />, [0, 0, -Math.PI / 2.6])}

      {/* SCAPULE */}
      {part("scapula-l", [-0.7, 2.1, -0.15], <boxGeometry args={[0.35, 0.45, 0.05]} />)}
      {part("scapula-r", [0.7, 2.1, -0.15], <boxGeometry args={[0.35, 0.45, 0.05]} />)}

      {/* STERN */}
      {part("stern", [0, 1.85, 0.18], <boxGeometry args={[0.18, 0.7, 0.06]} />)}

      {/* COASTE — 12 perechi */}
      {Array.from({ length: 12 }).map((_, i) => {
        const y = 2.15 - i * 0.13;
        const w = 0.9 - Math.abs(i - 4) * 0.04;
        return (
          <group key={`ribs-${i}`}>
            {part(`coaste-l-${i}`, [-w / 2, y, 0], <torusGeometry args={[w / 2, 0.025, 8, 24, Math.PI]} />, [Math.PI / 2, 0, 0])}
            {part(`coaste-r-${i}`, [w / 2, y, 0], <torusGeometry args={[w / 2, 0.025, 8, 24, Math.PI]} />, [Math.PI / 2, Math.PI, 0])}
          </group>
        );
      })}

      {/* VERTEBRE TORACICE */}
      {Array.from({ length: 12 }).map((_, i) =>
        part(`vert-toracice-${i}`, [0, 2.15 - i * 0.13, -0.18], <cylinderGeometry args={[0.09, 0.1, 0.1, 16]} />)
      )}

      {/* VERTEBRE LOMBARE */}
      {Array.from({ length: 5 }).map((_, i) =>
        part(`vert-lombare-${i}`, [0, 0.55 - i * 0.14, -0.18], <cylinderGeometry args={[0.11, 0.12, 0.12, 16]} />)
      )}

      {/* SACRUM */}
      {part("sacrum", [0, -0.25, -0.12], <coneGeometry args={[0.22, 0.4, 16]} />, [Math.PI, 0, 0])}
      {part("coccis", [0, -0.55, -0.05], <coneGeometry args={[0.06, 0.15, 8]} />, [Math.PI, 0, 0])}

      {/* PELVIS — coxale */}
      {part("coxal-l", [-0.3, -0.35, 0], <torusGeometry args={[0.28, 0.08, 8, 16, Math.PI]} />, [0, 0, Math.PI / 2])}
      {part("coxal-r", [0.3, -0.35, 0], <torusGeometry args={[0.28, 0.08, 8, 16, Math.PI]} />, [0, 0, -Math.PI / 2])}

      {/* MEMBRE SUPERIOARE — humerus */}
      {part("humerus-l", [-0.85, 1.5, 0], <cylinderGeometry args={[0.08, 0.07, 0.95, 16]} />)}
      {part("humerus-r", [0.85, 1.5, 0], <cylinderGeometry args={[0.08, 0.07, 0.95, 16]} />)}

      {/* RADIUS + ULNA */}
      {part("radius-l", [-0.92, 0.55, 0], <cylinderGeometry args={[0.05, 0.05, 0.85, 12]} />)}
      {part("ulna-l", [-0.78, 0.55, 0], <cylinderGeometry args={[0.05, 0.05, 0.85, 12]} />)}
      {part("radius-r", [0.92, 0.55, 0], <cylinderGeometry args={[0.05, 0.05, 0.85, 12]} />)}
      {part("ulna-r", [0.78, 0.55, 0], <cylinderGeometry args={[0.05, 0.05, 0.85, 12]} />)}

      {/* MÂINI */}
      {part("carp-l", [-0.85, 0.05, 0], <boxGeometry args={[0.18, 0.1, 0.06]} />)}
      {part("carp-r", [0.85, 0.05, 0], <boxGeometry args={[0.18, 0.1, 0.06]} />)}
      {part("metacarp-l", [-0.85, -0.12, 0], <boxGeometry args={[0.2, 0.18, 0.06]} />)}
      {part("metacarp-r", [0.85, -0.12, 0], <boxGeometry args={[0.2, 0.18, 0.06]} />)}
      {part("falange-mana-l", [-0.85, -0.32, 0], <boxGeometry args={[0.22, 0.22, 0.05]} />)}
      {part("falange-mana-r", [0.85, -0.32, 0], <boxGeometry args={[0.22, 0.22, 0.05]} />)}

      {/* MEMBRE INFERIOARE — femur */}
      {part("femur-l", [-0.22, -1.15, 0], <cylinderGeometry args={[0.1, 0.08, 1.4, 16]} />)}
      {part("femur-r", [0.22, -1.15, 0], <cylinderGeometry args={[0.1, 0.08, 1.4, 16]} />)}

      {/* ROTULA */}
      {part("rotula-l", [-0.22, -1.9, 0.12], <sphereGeometry args={[0.1, 16, 16]} />)}
      {part("rotula-r", [0.22, -1.9, 0.12], <sphereGeometry args={[0.1, 16, 16]} />)}

      {/* TIBIA + FIBULA */}
      {part("tibia-l", [-0.2, -2.6, 0], <cylinderGeometry args={[0.08, 0.06, 1.3, 16]} />)}
      {part("fibula-l", [-0.32, -2.6, 0], <cylinderGeometry args={[0.04, 0.04, 1.3, 12]} />)}
      {part("tibia-r", [0.2, -2.6, 0], <cylinderGeometry args={[0.08, 0.06, 1.3, 16]} />)}
      {part("fibula-r", [0.32, -2.6, 0], <cylinderGeometry args={[0.04, 0.04, 1.3, 12]} />)}

      {/* PICIOARE */}
      {part("tars-l", [-0.22, -3.32, 0.05], <boxGeometry args={[0.18, 0.12, 0.25]} />)}
      {part("tars-r", [0.22, -3.32, 0.05], <boxGeometry args={[0.18, 0.12, 0.25]} />)}
      {part("metatars-l", [-0.22, -3.4, 0.25], <boxGeometry args={[0.18, 0.08, 0.18]} />)}
      {part("metatars-r", [0.22, -3.4, 0.25], <boxGeometry args={[0.18, 0.08, 0.18]} />)}
      {part("falange-picior-l", [-0.22, -3.42, 0.4], <boxGeometry args={[0.18, 0.06, 0.1]} />)}
      {part("falange-picior-r", [0.22, -3.42, 0.4], <boxGeometry args={[0.18, 0.06, 0.1]} />)}
    </group>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="text-bone text-sm font-medium tracking-wide animate-pulse">
        Se încarcă scheletul…
      </div>
    </Html>
  );
}

interface SkeletonSceneProps {
  selectedBoneId: string | null;
  onSelectBone: (id: string | null) => void;
}

export function SkeletonScene({ selectedBoneId, onSelectBone }: SkeletonSceneProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Map mesh part id → bone data id (strip suffixes like -l, -r, -0..N)
  const handleSelect = (partId: string) => {
    const baseId = partId.replace(/-[lr]$/, "").replace(/-\d+$/, "");
    onSelectBone(baseId);
  };

  // Reverse: which mesh ids match the selected bone (for highlighting)
  const isSelected = (partId: string) => {
    if (!selectedBoneId) return false;
    const baseId = partId.replace(/-[lr]$/, "").replace(/-\d+$/, "");
    return baseId === selectedBoneId;
  };

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 7], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#15171f"]} />
      <fog attach="fog" args={["#15171f", 8, 18]} />

      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} color="#7eb5ff" />
      <pointLight position={[0, 2, 4]} intensity={0.3} color="#f5d76e" />

      <Suspense fallback={<LoadingFallback />}>
        <SkeletonModelWithSelection
          selectedId={selectedBoneId}
          hoveredId={hoveredId}
          setHovered={setHoveredId}
          onSelect={handleSelect}
          isSelected={isSelected}
        />
        <ContactShadows
          position={[0, -3.5, 0]}
          opacity={0.4}
          scale={8}
          blur={2.5}
          far={4}
        />
        <Environment preset="city" />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={12}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.6}
      />
    </Canvas>
  );
}

interface SMS extends SkeletonModelProps {
  isSelected: (id: string) => boolean;
}

function SkeletonModelWithSelection(props: SMS) {
  // We pass selectedId resolution differently — wrap so each part picks up its own selection
  return (
    <group>
      <SkeletonModel
        selectedId={props.selectedId}
        hoveredId={props.hoveredId}
        setHovered={props.setHovered}
        onSelect={props.onSelect}
      />
    </group>
  );
}
