import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SkeletonScene, type BoneSelection } from "@/components/skeleton/SkeletonScene";
import { BoneInfoPanel } from "@/components/skeleton/BoneInfoPanel";
import { ReferencesButton } from "@/components/layout/ReferencesButton";
import { bones } from "@/data/bones";
import { MousePointerClick } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Explorator Schelet 3D — InfoMed 3D" },
      {
        name: "description",
        content:
          "Explorează scheletul uman în 3D. Click pe orice os pentru a-i descoperi anatomia, funcția și descrierea în limba română.",
      },
      { property: "og:title", content: "Explorator Schelet 3D — InfoMed 3D" },
      {
        property: "og:description",
        content: "Vizualizare interactivă 3D a celor 206 oase ale corpului uman.",
      },
    ],
  }),
  component: ExploratorPage,
});

function ExploratorPage() {
  const [selection, setSelection] = useState<BoneSelection | null>(null);
  const selectedBone = useMemo(
    () => (selection ? bones.find((b) => b.id === selection.id) ?? null : null),
    [selection],
  );

  return (
    <div className="absolute inset-0 m-4 mt-2 rounded-3xl overflow-hidden glass">
      <SkeletonScene selection={selection} onSelect={setSelection} />

      {!selectedBone && (
        <div className="absolute left-6 top-6 glass rounded-2xl px-4 py-3 flex items-center gap-2.5 fade-up">
          <MousePointerClick className="size-4 text-primary" />
          <span className="text-xs text-muted-foreground tracking-tight">
            Apasă pe un os pentru detalii
          </span>
        </div>
      )}

      <BoneInfoPanel bone={selectedBone} onClose={() => setSelection(null)} />
      <ReferencesButton />
    </div>
  );
}
