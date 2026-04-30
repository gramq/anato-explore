import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { LayersState } from "./LayersToggle";

// Map submesh node names → bone IDs from src/data/bones.ts (used by FEMALE simple model)
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

const MALE_COMPLEX_URL = "/masculin_complex.glb";
const FEMALE_URL = "/skeleton_female.glb";
const FALLBACK_URL = "/skeleton.glb";

// Preload the heavy male anatomy model so it doesn't block first paint of the page.
useGLTF.preload(MALE_COMPLEX_URL);
useGLTF.preload(FALLBACK_URL);

export type SkeletonSide = "male" | "female";
export type TissueType = "os" | "muschi" | "tendon";

export interface BoneSelection {
  /** Bone id from src/data/bones.ts when known, otherwise a synthetic id (e.g. "muschi-grup-2"). */
  id: string;
  side: SkeletonSide;
  tissue: TissueType;
  /** Display label (used when the selection is not a catalogued bone). */
  label?: string;
}

const HOVER_COLOR_BONE = new THREE.Color("#bfdcff");
const HOVER_COLOR_MUSCLE = new THREE.Color("#ffb199");
const SELECT_COLOR = new THREE.Color("#007aff");

// ----- Female (simple skeleton GLB) -----------------------------------------

interface SimpleSkeletonModelProps {
  url: string;
  fallbackUrl?: string;
  xOffset: number;
  label: string;
  side: SkeletonSide;
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

function SimpleSkeletonModel(props: SimpleSkeletonModelProps) {
  const resolvedUrl = useGLTFWithFallback(props.url, props.fallbackUrl ?? props.url);
  if (!resolvedUrl) return null;
  return <ResolvedSimpleSkeletonModel {...props} url={resolvedUrl} />;
}

function ResolvedSimpleSkeletonModel({
  url,
  xOffset,
  label,
  side,
  variant,
  selection,
  onSelect,
}: SimpleSkeletonModelProps) {
  const gltf = useLoader(GLTFLoader, url);
  const groupRef = useRef<THREE.Group>(null);

  const baseColor = useMemo(
    () =>
      variant === "pearl"
        ? new THREE.Color("#f6f1e3")
        : new THREE.Color("#fbf6e9"),
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
      mesh.userData.tissue = "os" as TissueType;
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
    return { scale: s, offset: new THREE.Vector3(-center.x, -center.y, -center.z) };
  }, [cloned]);

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
      if (isSelected) return;
      const isHov = hovered && (hovered.userData.boneId as string) === boneId;
      const targetColor = isHov ? HOVER_COLOR_BONE : baseColor;
      mat.color.lerp(targetColor, 0.18);
    });
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    const id = mesh.userData?.boneId as string | null;
    if (!id) return;
    hoveredMeshRef.current = mesh;
    document.body.style.cursor = "pointer";
  };
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hoveredMeshRef.current = null;
    document.body.style.cursor = "auto";
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const id = (e.object.userData?.boneId as string | null) ?? null;
    if (id) onSelect({ id, side, tissue: "os" });
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

// ----- Male (complex multi-layer anatomy GLB) --------------------------------

interface ComplexMaleProps {
  url: string;
  xOffset: number;
  layers: LayersState;
  selection: BoneSelection | null;
  onSelect: (sel: BoneSelection | null) => void;
}

/**
 * Heuristic mesh classification by parent SubTool node + material index.
 * SubTool-0 (4 sub-meshes, material_0, ~230k verts) → muscles
 * SubTool-1 (1 mesh, material_1, ~42k verts)        → skeleton
 * SubTool-2 (1 mesh, material_2, ~10k verts)        → tendons / connective tissue
 */
function classifyMesh(mesh: THREE.Mesh): TissueType {
  let cur: THREE.Object3D | null = mesh;
  while (cur) {
    const n = cur.name || "";
    if (n.includes("SubTool-1")) return "os";
    if (n.includes("SubTool-2")) return "tendon";
    if (n.includes("SubTool-0")) return "muschi";
    cur = cur.parent;
  }
  // fallback by material name
  const mat = mesh.material as THREE.Material | undefined;
  if (mat?.name === "material_1") return "os";
  if (mat?.name === "material_2") return "tendon";
  return "muschi";
}

const MUSCLE_LABELS: Record<number, string> = {
  0: "Grup muscular superior",
  1: "Grup muscular trunchi",
  2: "Grup muscular membre",
  3: "Grup muscular profund",
};

function ComplexMaleModel({ url, xOffset, layers, selection, onSelect }: ComplexMaleProps) {
  const gltf = useLoader(GLTFLoader, url);
  const groupRef = useRef<THREE.Group>(null);

  const { cloned, layerMeshes } = useMemo(() => {
    const root = gltf.scene.clone(true);
    const layerMeshes: Record<TissueType, THREE.Mesh[]> = { os: [], muschi: [], tendon: [] };
    let muscleIdx = 0;
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const tissue = classifyMesh(mesh);
      mesh.userData.tissue = tissue;
      mesh.userData.side = "male";

      // Synthetic ids so each sub-mesh is independently selectable
      if (tissue === "os") {
        // Try to map all bones onto a generic "schelet-masculin" so the AI gets bone context.
        mesh.userData.selectionId = "schelet-masculin";
        mesh.userData.selectionLabel = "Sistem osos (masculin)";
      } else if (tissue === "muschi") {
        const idx = muscleIdx++;
        mesh.userData.selectionId = `muschi-grup-${idx}`;
        mesh.userData.selectionLabel = MUSCLE_LABELS[idx] ?? `Grup muscular ${idx + 1}`;
      } else {
        mesh.userData.selectionId = "tendon-conjunctiv";
        mesh.userData.selectionLabel = "Tendon / țesut conjunctiv";
      }

      const baseColor =
        tissue === "os"
          ? new THREE.Color("#f4ecd6")
          : tissue === "muschi"
            ? new THREE.Color("#a83232") // anatomical red
            : new THREE.Color("#e9c9a4"); // tendon ivory

      const mat = new THREE.MeshPhysicalMaterial({
        color: baseColor,
        roughness: tissue === "os" ? 0.5 : tissue === "muschi" ? 0.55 : 0.6,
        metalness: 0,
        clearcoat: tissue === "muschi" ? 0.25 : 0.1,
        clearcoatRoughness: 0.5,
        emissive: SELECT_COLOR.clone(),
        emissiveIntensity: 0,
        transparent: tissue === "muschi" || tissue === "tendon",
        opacity: tissue === "muschi" ? 0.78 : tissue === "tendon" ? 0.85 : 1,
        depthWrite: tissue === "os",
        envMapIntensity: 1.1,
        side: THREE.DoubleSide,
      });
      mat.userData.baseColor = baseColor.clone();
      mesh.material = mat;
      layerMeshes[tissue].push(mesh);
    });
    return { cloned: root, layerMeshes };
  }, [gltf]);

  // Apply layer visibility
  useEffect(() => {
    layerMeshes.os.forEach((m) => (m.visible = layers.skeleton));
    layerMeshes.muschi.forEach((m) => (m.visible = layers.muscles));
    layerMeshes.tendon.forEach((m) => (m.visible = layers.tendons));
  }, [layers, layerMeshes]);

  // Center & scale to ~5.2 units height
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const targetHeight = 5.2;
    const s = targetHeight / (size.y || 1);
    return { scale: s, offset: new THREE.Vector3(-center.x, -center.y, -center.z) };
  }, [cloned]);

  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);

  useFrame(() => {
    const hovered = hoveredMeshRef.current;
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      const baseColor = (mat.userData.baseColor as THREE.Color) ?? mat.color;
      const tissue = mesh.userData.tissue as TissueType;
      const selectionId = mesh.userData.selectionId as string;

      const isSelected =
        selection !== null &&
        selection.side === "male" &&
        selection.id === selectionId;
      const isHov = hovered === mesh && !isSelected;

      const targetEmissive = isSelected ? 0.7 : 0;
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.18;

      const hoverColor = tissue === "muschi" ? HOVER_COLOR_MUSCLE : HOVER_COLOR_BONE;
      const targetColor = isSelected ? SELECT_COLOR : isHov ? hoverColor : baseColor;
      mat.color.lerp(targetColor, 0.18);
    });

    if (groupRef.current && !selection) {
      groupRef.current.rotation.y += 0.0012;
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    if (!mesh.userData?.selectionId) return;
    hoveredMeshRef.current = mesh;
    document.body.style.cursor = "pointer";
  };
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hoveredMeshRef.current = null;
    document.body.style.cursor = "auto";
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    const id = mesh.userData?.selectionId as string | undefined;
    const tissue = mesh.userData?.tissue as TissueType | undefined;
    const label = mesh.userData?.selectionLabel as string | undefined;
    if (!id || !tissue) return;
    onSelect({ id, side: "male", tissue, label });
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
          Masculin · Anatomie
        </div>
      </Html>
    </group>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="text-primary text-sm font-medium tracking-wide animate-pulse">
        Se încarcă modelele anatomice…
      </div>
    </Html>
  );
}

interface SkeletonSceneProps {
  selection: BoneSelection | null;
  onSelect: (sel: BoneSelection | null) => void;
  layers: LayersState;
}

export function SkeletonScene({ selection, onSelect, layers }: SkeletonSceneProps) {
  useEffect(() => () => { document.body.style.cursor = "auto"; }, []);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0.8, 9.5], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={["#f0f4f8"]} />
      <fog attach="fog" args={["#f0f4f8", 14, 28]} />

      <hemisphereLight args={["#ffffff", "#b8c8d8", 0.85]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[6, 10, 6]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-6, 6, -2]} intensity={0.5} color="#ffffff" />
      <directionalLight position={[0, 4, -8]} intensity={1.1} color="#dbeafe" />
      <pointLight position={[0, 3, 5]} intensity={0.35} color="#cfe5ff" />

      <Suspense fallback={<LoadingFallback />}>
        <ComplexMaleModel
          url={MALE_COMPLEX_URL}
          xOffset={-1.9}
          layers={layers}
          selection={selection}
          onSelect={onSelect}
        />
        <SimpleSkeletonModel
          url={FEMALE_URL}
          fallbackUrl={FALLBACK_URL}
          xOffset={1.9}
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
