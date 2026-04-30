import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Map submesh node names → bone IDs from src/data/bones.ts
const MESH_TO_BONE: Record<string, string> = {
  SM_HumanSkeleton_17: "frontal",
  SM_HumanSkeleton_18: "mandibula",
  SM_HumanSkeleton_13: "scapula",
  SM_HumanSkeleton_15: "scapula",
  SM_HumanSkeleton_10: "humerus",
  SM_HumanSkeleton_12: "humerus",
  SM_HumanSkeleton_08: "coaste",
  SM_HumanSkeleton_20: "vert-toracice",
  SM_HumanSkeleton_16: "coxal",
  SM_HumanSkeleton_14: "radius",
  SM_HumanSkeleton_19: "radius",
  SM_HumanSkeleton_04: "femur",
  SM_HumanSkeleton_05: "femur",
  SM_HumanSkeleton_06: "tibia",
  SM_HumanSkeleton_07: "tibia",
  SM_HumanSkeleton_03: "tars",
  SM_HumanSkeleton_09: "tars",
  SM_HumanSkeleton_01: "carp",
  SM_HumanSkeleton_02: "carp",
};

const MALE_URL = "/skeleton_male.glb";
const FEMALE_URL = "/skeleton_female.glb";
const FALLBACK_URL = "/skeleton.glb";

useGLTF.preload(FALLBACK_URL);

export type SkeletonSide = "male" | "female";
export interface BoneSelection {
  id: string;
  side: SkeletonSide;
}

const HOVER_COLOR = new THREE.Color("#bfdcff");
const SELECT_COLOR = new THREE.Color("#007aff");

interface SkeletonModelProps {
  url: string;
  fallbackUrl?: string;
  xOffset: number;
  label: string;
  side: SkeletonSide;
  /** Variant tweaks — matte (male) vs pearl (female). */
  variant: "matte" | "pearl";
  selection: BoneSelection | null;
  onSelect: (sel: BoneSelection | null) => void;
}

function useGLTFWithFallback(url: string, fallback: string) {
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

function SkeletonModel(props: SkeletonModelProps) {
  const resolvedUrl = useGLTFWithFallback(props.url, props.fallbackUrl ?? props.url);
  if (!resolvedUrl) return null;
  return <ResolvedSkeletonModel {...props} url={resolvedUrl} />;
}

function ResolvedSkeletonModel({
  url,
  xOffset,
  label,
  side,
  variant,
  selection,
  onSelect,
}: SkeletonModelProps) {
  const gltf = useLoader(GLTFLoader, url);
  const groupRef = useRef<THREE.Group>(null);

  const baseColor = useMemo(
    () =>
      variant === "pearl"
        ? new THREE.Color("#f6f1e3") // warm pearl ivory
        : new THREE.Color("#fbf6e9"), // matte bone
    [variant],
  );

  const cloned = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
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

      if (
        mesh.name.toLowerCase().includes("outline") ||
        (cur && cur.name.toLowerCase().includes("outline"))
      ) {
        mesh.visible = false;
        mesh.userData.boneId = null;
        return;
      }

      mesh.userData.boneId = boneId;
      mesh.userData.side = side;

      const mat = new THREE.MeshPhysicalMaterial({
        color: baseColor.clone(),
        roughness: variant === "pearl" ? 0.28 : 0.5,
        metalness: 0,
        clearcoat: variant === "pearl" ? 0.6 : 0.1,
        clearcoatRoughness: variant === "pearl" ? 0.25 : 0.6,
        sheen: variant === "pearl" ? 0.6 : 0,
        sheenColor: new THREE.Color("#e6e0ff"),
        sheenRoughness: 0.6,
        emissive: SELECT_COLOR.clone(),
        emissiveIntensity: 0,
        envMapIntensity: 1.2,
      });
      mesh.material = mat;
    });
    return root;
  }, [gltf, baseColor, variant, side]);

  useFrame(() => {
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const boneId = mesh.userData.boneId as string | null;
      if (!boneId) return;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;

      const isSelected =
        selection !== null && selection.side === side && selection.id === boneId;
      const targetEmissive = isSelected ? 0.75 : 0;
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.18;
      const targetColor = isSelected ? SELECT_COLOR : baseColor;
      mat.color.lerp(targetColor, 0.18);
    });

    if (groupRef.current && !selection) {
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

  const [isHovered, setIsHovered] = useState(false);

  // Hover highlight: track per-mesh hover via ref to keep state minimal.
  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);
  useFrame(() => {
    const hovered = hoveredMeshRef.current;
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const boneId = mesh.userData.boneId as string | null;
      if (!boneId) return;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      const isSelected =
        selection !== null && selection.side === side && selection.id === boneId;
      if (isSelected) return; // selection wins
      const isHov = hovered && (hovered.userData.boneId as string) === boneId;
      const targetColor = isHov ? HOVER_COLOR : baseColor;
      mat.color.lerp(targetColor, 0.18);
    });
    void isHovered;
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    const id = mesh.userData?.boneId as string | null;
    if (!id) return;
    hoveredMeshRef.current = mesh;
    setIsHovered(true);
    document.body.style.cursor = "pointer";
  };
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hoveredMeshRef.current = null;
    setIsHovered(false);
    document.body.style.cursor = "auto";
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const id = (e.object.userData?.boneId as string | null) ?? null;
    if (id) onSelect({ id, side });
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
      <Html position={[0, -3.2 / scale, 0]} center distanceFactor={10} zIndexRange={[10, 0]}>
        <div className="px-3 py-1 rounded-full bg-white/85 border border-primary/15 backdrop-blur-md text-[10px] tracking-[0.22em] uppercase font-bold text-primary shadow-[0_4px_12px_-4px_oklch(0.62_0.20_255_/_0.25)]">
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
  selection: BoneSelection | null;
  onSelect: (sel: BoneSelection | null) => void;
}

export function SkeletonScene({ selection, onSelect }: SkeletonSceneProps) {
  useEffect(() => () => { document.body.style.cursor = "auto"; }, []);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.8, 9.5], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => onSelect(null)}
    >
      {/* Subtle ice-blue background so white bones pop */}
      <color attach="background" args={["#f0f4f8"]} />
      <fog attach="fog" args={["#f0f4f8", 14, 28]} />

      {/* Sky/ground hemisphere fill — soft shadows in cavities */}
      <hemisphereLight args={["#ffffff", "#b8c8d8", 0.85]} />
      <ambientLight intensity={0.35} />

      {/* Key light */}
      <directionalLight
        position={[6, 10, 6]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
      />
      {/* Fill */}
      <directionalLight position={[-6, 6, -2]} intensity={0.5} color="#ffffff" />
      {/* Rim light — separates bones from background */}
      <directionalLight position={[0, 4, -8]} intensity={1.1} color="#dbeafe" />
      <pointLight position={[0, 3, 5]} intensity={0.35} color="#cfe5ff" />

      <Suspense fallback={<LoadingFallback />}>
        <SkeletonModel
          url={MALE_URL}
          fallbackUrl={FALLBACK_URL}
          xOffset={-1.7}
          label="Masculin"
          side="male"
          variant="matte"
          selection={selection}
          onSelect={onSelect}
        />
        <SkeletonModel
          url={FEMALE_URL}
          fallbackUrl={FALLBACK_URL}
          xOffset={1.7}
          label="Feminin"
          side="female"
          variant="pearl"
          selection={selection}
          onSelect={onSelect}
        />
        <ContactShadows
          position={[0, -2.85, 0]}
          opacity={0.4}
          scale={14}
          blur={2.6}
          far={5}
          color="#1e3a8a"
        />
        <Environment preset="studio" environmentIntensity={0.95} />
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
