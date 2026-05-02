import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SkeletonScene, type AnatomyModelMode, type BoneSelection } from "@/components/skeleton/SkeletonScene";
import { BoneInfoPanel } from "@/components/skeleton/BoneInfoPanel";
import { LayersToggle, type LayersState } from "@/components/skeleton/LayersToggle";
import { bones } from "@/data/bones";
import { MousePointerClick } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Explorator Anatomie 3D — Santix" },
      {
        name: "description",
        content:
          "Explorează anatomia umană în 3D — schelet, mușchi și tendoane. Click pe orice structură pentru detalii și asistent AI de simptome.",
      },
      { property: "og:title", content: "Explorator Anatomie 3D — Santix" },
      {
        property: "og:description",
        content: "Vizualizare interactivă 3D a oaselor și sistemului muscular.",
      },
    ],
  }),
  component: ExploratorPage,
});

function ExploratorPage() {
  const [selection, setSelection] = useState<BoneSelection | null>(null);
  const [layers, setLayers] = useState<LayersState>({
    skeleton: true,
    muscles: true,
    tendons: true,
  });
  const [modelMode, setModelMode] = useState<AnatomyModelMode>("simple");

  const selectedBone = useMemo(
    () => (selection ? bones.find((b) => b.id === selection.id) ?? null : null),
    [selection],
  );

  return (
    <div className="absolute inset-0 m-4 mt-2 rounded-3xl overflow-hidden glass">
      <SkeletonScene selection={selection} onSelect={setSelection} layers={layers} mode={modelMode} />

      {!selection && (
        <div className="absolute left-6 top-6 glass rounded-2xl px-4 py-3 flex items-center gap-2.5 fade-up">
          <MousePointerClick className="size-4 text-primary" />
          <span className="text-xs text-muted-foreground tracking-tight">
            Apasă pe un os sau mușchi pentru detalii
          </span>
        </div>
      )}

      <div className="absolute right-6 top-6 glass rounded-2xl p-1.5 flex items-center gap-1 fade-up">
        {(["simple", "complex"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setSelection(null);
              setModelMode(mode);
            }}
            className={[
              "px-3 py-2 rounded-xl text-[11px] font-bold tracking-[0.08em] uppercase transition-all",
              modelMode === mode
                ? "bg-primary text-primary-foreground shadow-[0_8px_24px_-12px_oklch(0.62_0.20_255_/_0.7)]"
                : "text-muted-foreground hover:bg-muted/70",
            ].join(" ")}
          >
            {mode === "simple" ? "Rapid" : "Complex"}
          </button>
        ))}
      </div>

      {modelMode === "complex" && <LayersToggle layers={layers} onChange={setLayers} />}

      <BoneInfoPanel
        bone={selectedBone}
        selection={selection}
        onClose={() => setSelection(null)}
      />
    </div>
  );
}
