import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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

// Two-model setup: male on the left, female on the right.
// Falls back to the existing skeleton.glb when dedicated files are missing.
const MALE_URL = "/skeleton_male.glb";
const FEMALE_URL = "/skeleton_female.glb";
const FALLBACK_URL = "/skeleton.glb";

useGLTF.preload(FALLBACK_URL);

const BASE_COLOR = new THREE.Color("#fbf6e9");      // clean warm bone
const HOVER_COLOR = new THREE.Color("#cfe5ff");     // soft medical blue
const SELECT_COLOR = new THREE.Color("#007aff");    // Apple system blue

interface SkeletonModelProps {
  url: string;
  fallbackUrl?: string;
  xOffset: number;
  label: string;
  selectedBoneId: string | null;
  hoveredBoneId: string | null;
  setHoveredBone: (id: string | null) => void;
  onSelectBone: (id: string | null) => void;
}

function useGLTFWithFallback(url: string, fallback: string) {
  // Probe the requested URL once; if it 404s, swap to the fallback.
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(url, { method: "HEAD" })
      .then((r) => {
        if (cancelled) return;
        setResolvedUrl(r.ok ? url : fallback);
      })
      .catch(() => !cancelled && setResolvedUrl(fallback));
    return () => {
      cancelled = true;
    };
  }, [url, fallback]);
  return resolvedUrl;
}

function SkeletonModel({
  url,
  fallbackUrl,
  xOffset,
  label,
  selectedBoneId,
  hoveredBoneId,
  setHoveredBone,
  onSelectBone,
}: SkeletonModelProps) {
  const resolvedUrl = useGLTFWithFallback(url, fallbackUrl ?? url);
  if (!resolvedUrl) return null;
  return (
    <ResolvedSkeletonModel
      url={resolvedUrl}
      xOffset={xOffset}
      label={label}
      selectedBoneId={selectedBoneId}
      hoveredBoneId={hoveredBoneId}
      setHoveredBone={setHoveredBone}
      onSelectBone={onSelectBone}
    />
  );
}

interface ResolvedProps extends Omit<SkeletonModelProps, "url" | "fallbackUrl"> {
  url: string;
}

function ResolvedSkeletonModel({
  url,
  xOffset,
  label,
  selectedBoneId,
  hoveredBoneId,
  setHoveredBone,
  onSelectBone,
}: ResolvedProps) {
  const gltf = useLoader(GLTFLoader, url);
  const groupRef = useRef<THREE.Group>(null);

  // Clone once so per-instance materials don't leak across remounts
  const cloned = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
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
        if (mesh.name.toLowerCase().includes("outline") || (cur && cur.name.toLowerCase().includes("outline"))) {
          mesh.visible = false;
          mesh.userData.boneId = null;
          return;
        }
        mesh.userData.boneId = boneId;
        const mat = new THREE.MeshStandardMaterial({
          color: BASE_COLOR.clone(),
          roughness: 0.42,
          metalness: 0.04,
          emissive: SELECT_COLOR.clone(),
          emissiveIntensity: 0,
          envMapIntensity: 1.1,
        });
        mesh.material = mat;
      }
    });
    return root;
  }, [gltf]);

  useFrame(() => {
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const boneId = mesh.userData.boneId as string | null;
      if (!boneId) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const isSelected = boneId === selectedBoneId;
      const isHovered = !isSelected && boneId === hoveredBoneId;
      const targetEmissive = isSelected ? 0.7 : isHovered ? 0.18 : 0;
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.15;
      const targetColor = isSelected ? SELECT_COLOR : isHovered ? HOVER_COLOR : BASE_COLOR;
      mat.color.lerp(targetColor, 0.15);
    });

    if (groupRef.current && !selectedBoneId) {
      groupRef.current.rotation.y += 0.0012;
    }
  });

  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const targetHeight = 5.2;
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

  return (
    <group
      ref={groupRef}
      position={[xOffset, 0, 0]}
      scale={scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <primitive object={cloned} position={offset} />
      {/* Floor label */}
      <Html position={[0, -3.2 / scale, 0]} center distanceFactor={10} zIndexRange={[10, 0]}>
        <div className="px-3 py-1 rounded-full bg-white/80 border border-primary/15 backdrop-blur-md text-[10px] tracking-[0.22em] uppercase font-bold text-primary shadow-[0_4px_12px_-4px_oklch(0.62_0.20_255_/_0.25)]">
          {label}
        </div>
      </Html>
    </group>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="text-primary text-sm font-medium tracking-wide animate-pulse">
        Se încarcă scheletele…
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

  useEffect(() => () => { document.body.style.cursor = "auto"; }, []);

  const handleMissed = () => {
    onSelectBone(null);
  };

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.8, 9.5], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={handleMissed}
    >
      {/* Bright clinical white background */}
      <color attach="background" args={["#f8fafc"]} />
      <fog attach="fog" args={["#f8fafc", 14, 28]} />

      {/* High-intensity clinical lighting */}
      <ambientLight intensity={0.9} />
      <hemisphereLight args={["#ffffff", "#dbeafe", 0.6]} />
      <directionalLight
        position={[6, 10, 6]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-6, 6, -4]} intensity={0.7} color="#ffffff" />
      <pointLight position={[0, 3, 5]} intensity={0.5} color="#cfe5ff" />

      <Suspense fallback={<LoadingFallback />}>
        <SkeletonModel
          url={MALE_URL}
          fallbackUrl={FALLBACK_URL}
          xOffset={-1.7}
          label="Masculin"
          selectedBoneId={selectedBoneId}
          hoveredBoneId={hoveredBoneId}
          setHoveredBone={setHoveredBoneId}
          onSelectBone={onSelectBone}
        />
        <SkeletonModel
          url={FEMALE_URL}
          fallbackUrl={FALLBACK_URL}
          xOffset={1.7}
          label="Feminin"
          selectedBoneId={selectedBoneId}
          hoveredBoneId={hoveredBoneId}
          setHoveredBone={setHoveredBoneId}
          onSelectBone={onSelectBone}
        />
        <ContactShadows
          position={[0, -2.85, 0]}
          opacity={0.35}
          scale={14}
          blur={2.8}
          far={5}
          color="#1e3a8a"
        />
        {/* White studio environment for clean reflections on bone */}
        <Environment preset="studio" environmentIntensity={0.9} />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={16}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.6}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
