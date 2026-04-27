import { type Bone, categoryLabels } from "@/data/bones";
import { X, BookMarked, Sparkles } from "lucide-react";

interface Props {
  bone: Bone | null;
  onClose: () => void;
}

export function BoneInfoPanel({ bone, onClose }: Props) {
  if (!bone) return null;
  return (
    <div
      key={bone.id}
      className="absolute right-6 top-6 bottom-24 w-[340px] glass-strong rounded-3xl p-6 flex flex-col fade-up overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <BookMarked className="size-4 text-primary" />
          </div>
          <span className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-semibold">
            {categoryLabels[bone.category]}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Închide"
          className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <h2 className="text-3xl font-bold tracking-tight leading-tight mb-1">{bone.name}</h2>
      <p className="text-sm italic text-muted-foreground mb-5">{bone.latin}</p>

      <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-2xl bg-bone-glow/10 border border-bone-glow/20 w-fit">
        <Sparkles className="size-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary">
          {bone.count} {bone.count === 1 ? "exemplar" : "exemplare"} în corp
        </span>
      </div>

      <div className="space-y-4 overflow-y-auto pr-1 flex-1">
        <Section title="Descriere">
          <p className="text-sm leading-relaxed text-foreground/90">{bone.description}</p>
        </Section>
        <Section title="Funcție">
          <p className="text-sm leading-relaxed text-foreground/90">{bone.funcție}</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-semibold mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}
