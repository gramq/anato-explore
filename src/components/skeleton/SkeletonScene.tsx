import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Map submesh node names → bone IDs from src/data/bones.ts
// Derived from bounding-box analysis of skeleton.glb (Y-up, ~183cm tall).
const MESH_TO_BONE: Record<string, string> = {
  SM_HumanSkeleton_17: "frontal",        // craniu (neurocraniu)
  SM_HumanSkeleton_18: "mandibula",      // mandibulă
  SM_HumanSkeleton_13: "scapula",        // scapula dreaptă
  SM_HumanSkeleton_15: "scapula",        // scapula stângă
  SM_HumanSkeleton_10: "humerus",        // humerus stâng
  SM_HumanSkeleton_12: "humerus",        // humerus drept
  SM_HumanSkeleton_08: "coaste",         // cutia toracică
  SM_HumanSkeleton_20: "vert-toracice",  // coloana vertebrală
  SM_HumanSkeleton_16: "coxal",          // pelvis
  SM_HumanSkeleton_14: "radius",         // antebraț drept
  SM_HumanSkeleton_19: "radius",         // antebraț stâng
  SM_HumanSkeleton_04: "femur",          // femur stâng
  SM_HumanSkeleton_05: "femur",          // femur drept
  SM_HumanSkeleton_06: "tibia",          // gambă dreaptă
  SM_HumanSkeleton_07: "tibia",          // gambă stângă
  SM_HumanSkeleton_03: "tars",           // picior drept
  SM_HumanSkeleton_09: "tars",           // picior stâng
  SM_HumanSkeleton_01: "carp",           // mână dreaptă
  SM_HumanSkeleton_02: "carp",           // mână stângă
};

const MODEL_URL = "/skeleton.glb";
useGLTF.preload(MODEL_URL);

const BASE_COLOR = new THREE.Color("#f0e6d2");
const HOVER_COLOR = new THREE.Color("#fff2c4");
const SELECT_COLOR = new THREE.Color("#f5d76e");

interface SkeletonModelProps {
  selectedBoneId: string | null;
  hoveredBoneId: string | null;
  setHoveredBone: (id: string | null) => void;
  onSelectBone: (id: string | null) => void;
}

function SkeletonModel({
  selectedBoneId,
  hoveredBoneId,
  setHoveredBone,
  onSelectBone,
}: SkeletonModelProps) {
  const { scene } = useGLTF(MODEL_URL);
  const groupRef = useRef<THREE.Group>(null);

  // Clone once so per-instance materials don't leak across remounts
  const cloned = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // Walk up to find the named SM_HumanSkeleton_NN parent
        let cur: THREE.Object3D | null = obj;
        let boneId: string | null = null;
        while (cur) {
          const match = Object.keys(MESH_TO_BONE).find((k) => cur!.name.startsWith(k));
          if (match) {
            boneId = MESH_TO_BONE[match];
            break;
          }
          cur = cur.parent;
        }
        // Hide the OutLine pass (cosmetic black silhouette) so it doesn't block picks
        if (mesh.name.toLowerCase().includes("outline") || (cur && cur.name.toLowerCase().includes("outline"))) {
          mesh.visible = false;
          mesh.userData.boneId = null;
          return;
        }
        mesh.userData.boneId = boneId;
        // Replace material with our themed standard material so highlight works
        const mat = new THREE.MeshStandardMaterial({
          color: BASE_COLOR.clone(),
          roughness: 0.5,
          metalness: 0.05,
          emissive: SELECT_COLOR.clone(),
          emissiveIntensity: 0,
        });
        mesh.material = mat;
      }
    });
    return root;
  }, [scene]);

  // Animate highlight per frame
  useFrame(() => {
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const boneId = mesh.userData.boneId as string | null;
      if (!boneId) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const isSelected = boneId === selectedBoneId;
      const isHovered = !isSelected && boneId === hoveredBoneId;
      const targetEmissive = isSelected ? 0.85 : isHovered ? 0.25 : 0;
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.15;
      const targetColor = isSelected ? SELECT_COLOR : isHovered ? HOVER_COLOR : BASE_COLOR;
      mat.color.lerp(targetColor, 0.15);
    });

    // Slow idle rotation while nothing is selected
    if (groupRef.current && !selectedBoneId) {
      groupRef.current.rotation.y += 0.0015;
    }
  });

  // Center + scale the model to a comfortable viewing size
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const targetHeight = 5.5;
    const s = targetHeight / (size.y || 1);
    return {
      scale: s,
      offset: new THREE.Vector3(-center.x, -center.y, -center.z),
    };
  }, [cloned]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const id = (e.object.userData?.boneId as string | null) ?? null;
    if (id) {
      setHoveredBone(id);
      document.body.style.cursor = "pointer";
    }
  };
  const handlePointerOut = () => {
    setHoveredBone(null);
    document.body.style.cursor = "auto";
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const id = (e.object.userData?.boneId as string | null) ?? null;
    if (id) onSelectBone(id);
  };
  const handleMissed = () => {
    onSelectBone(null);
  };

  return (
    <group
      ref={groupRef}
      scale={scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      onPointerMissed={handleMissed}
    >
      <primitive object={cloned} position={offset} />
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
  const [hoveredBoneId, setHoveredBoneId] = useState<string | null>(null);

  // Reset cursor on unmount
  useEffect(() => () => { document.body.style.cursor = "auto"; }, []);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.5, 7], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#15171f"]} />
      <fog attach="fog" args={["#15171f", 9, 20]} />

      <ambientLight intensity={0.45} />
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
        <SkeletonModel
          selectedBoneId={selectedBoneId}
          hoveredBoneId={hoveredBoneId}
          setHoveredBone={setHoveredBoneId}
          onSelectBone={onSelectBone}
        />
        <ContactShadows
          position={[0, -3, 0]}
          opacity={0.45}
          scale={9}
          blur={2.6}
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
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
