import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Html, useGLTF, useProgress } from "@react-three/drei";
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

const MALE_COMPLEX_URL = "/anatomy/z-anatomy-musculoskeletal.glb?v=20260502-selection-2";
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
  /** Original English anatomical name, useful for stable classification/search. */
  labelEn?: string;
}

const HOVER_COLOR_BONE = new THREE.Color("#7dd3fc");
const HOVER_COLOR_MUSCLE = new THREE.Color("#ff9f1c");
const SELECT_COLOR = new THREE.Color("#00d9ff");
const SELECT_EMISSIVE = new THREE.Color("#00a3ff");
const DIM_COLOR = new THREE.Color("#dbe4ee");

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

function ComplexMaleModel({ url, xOffset, layers, selection, onSelect }: ComplexMaleProps) {
  const gltf = useLoader(GLTFLoader, url);
  const groupRef = useRef<THREE.Group>(null);

  const { cloned, layerMeshes } = useMemo(() => {
    const root = gltf.scene.clone(true);
    const layerMeshes: Record<TissueType, THREE.Mesh[]> = { os: [], muschi: [], tendon: [] };
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const tissue = ((mesh.userData.tissue as TissueType | undefined) ?? "muschi");
      const structureId =
        (mesh.userData.structureId as string | undefined) ??
        `${tissue}-${mesh.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const structureName =
        (mesh.userData.structureName as string | undefined) ??
        mesh.name.replace(/\.[a-z]+$/i, "").replace(/[()[\]]/g, "").trim();
      const structureNameEn = (mesh.userData.structureNameEn as string | undefined) ?? structureName;

      mesh.userData.tissue = tissue;
      mesh.userData.side = "male";
      mesh.userData.selectionId = structureId;
      mesh.userData.selectionLabel = structureName;
      mesh.userData.selectionLabelEn = structureNameEn;

      const baseColor =
        tissue === "os"
          ? new THREE.Color("#f6ead2")
          : tissue === "muschi"
            ? new THREE.Color("#b23a32")
            : new THREE.Color("#ead2ad");

      const mat = new THREE.MeshPhysicalMaterial({
        color: baseColor,
        roughness: tissue === "os" ? 0.42 : tissue === "muschi" ? 0.58 : 0.55,
        metalness: 0,
        clearcoat: tissue === "muschi" ? 0.2 : 0.16,
        clearcoatRoughness: 0.45,
        emissive: SELECT_EMISSIVE.clone(),
        emissiveIntensity: 0,
        transparent: true,
        opacity: tissue === "muschi" ? 0.62 : tissue === "tendon" ? 0.72 : 1,
        depthWrite: tissue === "os",
        envMapIntensity: 1.1,
        side: THREE.DoubleSide,
      });
      mat.userData.baseColor = baseColor.clone();
      mat.userData.baseOpacity = mat.opacity;
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

  // Center & scale to a calm anatomy-viewer size without changing the authored orientation.
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const targetHeight = 5.8;
    const s = targetHeight / (size.y || size.z || 1);
    return { scale: s, offset: new THREE.Vector3(-center.x, -center.y, -center.z) };
  }, [cloned]);

  const hoveredMeshRef = useRef<THREE.Mesh | null>(null);

  useFrame(() => {
    const hovered = hoveredMeshRef.current;
    const hasSelection = selection !== null && selection.side === "male";
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const mat = mesh.material as THREE.MeshPhysicalMaterial;
      const baseColor = (mat.userData.baseColor as THREE.Color) ?? mat.color;
      const baseOpacity = (mat.userData.baseOpacity as number | undefined) ?? mat.opacity;
      const tissue = mesh.userData.tissue as TissueType;
      const selectionId = mesh.userData.selectionId as string | undefined;

      const isSelected =
        selection !== null &&
        selection.side === "male" &&
        selection.id === selectionId;
      const isHov =
        !!selectionId &&
        hovered !== null &&
        hovered.userData.selectionId === selectionId &&
        !isSelected;

      mesh.renderOrder = isSelected ? 10 : 0;
      mat.depthWrite = isSelected || (!hasSelection && tissue === "os");
      mat.depthTest = true;

      const targetOpacity = isSelected
        ? 1
        : hasSelection
          ? tissue === "os"
            ? 0.18
            : tissue === "muschi"
              ? 0.12
              : 0.1
          : isHov
            ? Math.min(1, baseOpacity + 0.2)
            : baseOpacity;
      mat.opacity += (targetOpacity - mat.opacity) * 0.22;

      const targetEmissive = isSelected ? 1.35 : isHov ? 0.2 : 0;
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.18;

      const hoverColor = tissue === "muschi" ? HOVER_COLOR_MUSCLE : HOVER_COLOR_BONE;
      const targetColor = isSelected ? SELECT_COLOR : hasSelection ? DIM_COLOR : isHov ? hoverColor : baseColor;
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
    const tissue = mesh.userData?.tissue as TissueType | undefined;
    const id = mesh.userData?.selectionId as string | undefined;
    const label = mesh.userData?.selectionLabel as string | undefined;
    const labelEn = mesh.userData?.selectionLabelEn as string | undefined;
    if (!tissue || !id) return;
    onSelect({ id, side: "male", tissue, label, labelEn });
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
      <Html position={[0, -3.35 / scale, 0]} center distanceFactor={8} zIndexRange={[10, 0]}>
        <div className="px-3 py-1 rounded-full bg-white/90 border border-primary/10 backdrop-blur-md text-[10px] tracking-[0.22em] uppercase font-bold text-primary shadow-[0_4px_12px_-4px_oklch(0.62_0.20_255_/_0.18)]">
          Model principal
        </div>
      </Html>
    </group>
  );
}

function LoadingFallback() {
  const { progress } = useProgress();
  const roundedProgress = Math.round(progress);
  return (
    <Html center>
      <div className="min-w-[240px] rounded-2xl border border-primary/15 bg-white/90 px-4 py-3 text-center shadow-lg backdrop-blur-md">
        <div className="text-sm font-bold tracking-tight text-primary">
          Se încarcă modelul anatomic
        </div>
        <div className="mt-1 text-[11px] font-medium text-muted-foreground">
          {roundedProgress > 0 ? `${roundedProgress}%` : "Pregătire model 3D..."}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${Math.max(roundedProgress, 8)}%` }}
          />
        </div>
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
      camera={{ position: [0, 0.15, 10], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={["#ffffff"]} />
      <fog attach="fog" args={["#ffffff", 10, 22]} />

      <hemisphereLight args={["#ffffff", "#d9e4ef", 1.05]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[5, 8, 7]}
        intensity={1.25}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-5, 5, 5]} intensity={0.55} color="#ffffff" />
      <directionalLight position={[0, 4, -8]} intensity={0.7} color="#eaf2ff" />
      <pointLight position={[0, 2.5, 5]} intensity={0.22} color="#ffffff" />

      <Suspense fallback={<LoadingFallback />}>
        <ComplexMaleModel
          url={MALE_COMPLEX_URL}
          xOffset={0}
          layers={layers}
          selection={selection}
          onSelect={onSelect}
        />
        <ContactShadows
          position={[0, -2.9, 0]}
          opacity={0.22}
          scale={8}
          blur={2.2}
          far={5}
          color="#94a3b8"
        />
        <Environment preset="studio" environmentIntensity={0.7} />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={5.8}
        maxDistance={15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.6}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
