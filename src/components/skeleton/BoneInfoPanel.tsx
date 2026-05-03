import { useEffect, useState } from "react";
import { type Bone, categoryLabels } from "@/data/bones";
import { X, BookMarked, Sparkles, Stethoscope, AlertTriangle, Activity, Layers } from "lucide-react";
import {
  analyzePainLocally,
  getPainQuestions,
  painLevels,
  validateAnswerConsistency,
  type SymptomAnalysis,
} from "@/data/painKnowledge";
import { classifyAnatomyStructure } from "@/data/anatomyCurriculum";
import type { BoneSelection, TissueType } from "./SkeletonScene";

interface Props {
  bone: Bone | null;
  selection: BoneSelection | null;
  onClose: () => void;
}

const TISSUE_META: Record<TissueType, { label: string; Icon: typeof BookMarked; tagBg: string; tagText: string }> = {
  os: {
    label: "Țesut osos",
    Icon: BookMarked,
    tagBg: "bg-primary/15 border-primary/25",
    tagText: "text-primary",
  },
  muschi: {
    label: "Țesut muscular",
    Icon: Activity,
    tagBg: "bg-[oklch(0.55_0.18_25_/_0.12)] border-[oklch(0.55_0.18_25_/_0.3)]",
    tagText: "text-[oklch(0.50_0.18_25)]",
  },
  tendon: {
    label: "Tendon / țesut conjunctiv",
    Icon: Layers,
    tagBg: "bg-accent/15 border-accent/30",
    tagText: "text-accent-foreground",
  },
};

export function BoneInfoPanel({ bone, selection, onClose }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SymptomAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAnswers({});
    setResult(null);
    setError(null);
  }, [selection?.id, selection?.regionId, selection?.side]);

  if (!selection) return null;

  const tissue = selection.tissue;
  const meta = TISSUE_META[tissue];
  const Icon = meta.Icon;
  const curriculum = classifyAnatomyStructure({
    tissue,
    label: selection.label,
    labelEn: selection.labelEn,
    id: selection.id,
  });

  // Resolve display strings — bones come from the catalog, muscles/tendons use the selection label.
  const displayName = bone?.name ?? selection.regionLabel ?? selection.label ?? "Structură anatomică";
  const displayLatin = bone?.latin ?? (tissue === "muschi" ? "Musculus" : tissue === "tendon" ? "Tendo" : "");
  const categoryText = bone ? categoryLabels[bone.category] : curriculum.group;
  const description =
    bone?.description ??
    (tissue === "muschi"
      ? `${curriculum.group}${curriculum.subgroup ? ` - ${curriculum.subgroup}` : ""}. Mușchii produc mișcare prin contracție și se atașează de oase prin tendoane.`
      : tissue === "tendon"
        ? `${curriculum.group}${curriculum.subgroup ? ` - ${curriculum.subgroup}` : ""}. Țesut conjunctiv fibros care stabilizează sau transmite forța musculară.`
        : `${curriculum.group}${curriculum.subgroup ? ` - ${curriculum.subgroup}` : ""}. Structură osoasă organizată după regiunile aparatului locomotor.`);
  const funcText =
    bone?.funcție ??
    curriculum.functionHint;

  const questions = getPainQuestions(tissue);
  const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;
  const canSubmit = answeredCount === questions.length;

  const handleAnalyze = () => {
    if (!canSubmit) return;
    setError(null);
    setResult(null);
    const consistency = validateAnswerConsistency(answers);
    if (!consistency.ok) {
      setError(consistency.message ?? "Răspunsurile se contrazic. Revizuiește selecțiile.");
      return;
    }
    setResult(
      analyzePainLocally({
        tissueType: tissue,
        selectedName: displayName,
        answers,
        segment: curriculum.segment,
        group: curriculum.group,
      }),
    );
  };

  return (
    <div
      key={`${selection.side}-${selection.id}`}
      className="absolute right-6 top-6 bottom-24 w-[360px] glass-strong rounded-3xl p-6 flex flex-col fade-up overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className={`size-10 rounded-2xl border flex items-center justify-center ${meta.tagBg}`}>
            <Icon className={`size-4 ${meta.tagText}`} />
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] tracking-[0.22em] uppercase font-semibold ${meta.tagText}`}>
              {meta.label}
            </span>
            <span className="text-[10px] tracking-wide text-muted-foreground">{categoryText}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Închide"
          className="size-8 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <h2 className="text-3xl font-bold tracking-tight leading-tight mb-1">{displayName}</h2>
      {displayLatin && <p className="text-sm italic text-muted-foreground mb-5">{displayLatin}</p>}

      {bone && (
        <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-2xl bg-bone-glow/10 border border-bone-glow/20 w-fit">
          <Sparkles className="size-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">
            {bone.count} {bone.count === 1 ? "exemplar" : "exemplare"} în corp
          </span>
        </div>
      )}

      <div className="flex flex-col gap-4 overflow-y-auto pr-1 flex-1 -mr-1">
        <Section title="Descriere">
          <p className="text-sm leading-relaxed text-foreground/90">{description}</p>
        </Section>
        <Section title="Funcție">
          <p className="text-sm leading-relaxed text-foreground/90">{funcText}</p>
        </Section>
        <Section title="Încadrare anatomică">
          <div className="grid grid-cols-2 gap-2">
            <InfoChip label="Sistem" value={curriculum.system} />
            <InfoChip label="Segment" value={curriculum.segment} />
            <InfoChip label="Grupă" value={curriculum.group} />
            <InfoChip label="Subgrupă" value={curriculum.subgroup ?? "General"} />
            <InfoChip label="Față / plan" value={curriculum.aspect ?? "Plan general"} />
          </div>
        </Section>

        <div className="order-first pb-3 mb-1 border-b border-primary/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_4px_12px_-4px_oklch(0.62_0.20_255_/_0.45)]">
              <Stethoscope className="size-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Triaj rapid local</h3>
              <p className="text-[11px] text-muted-foreground">
                Întrebări generale · {displayName.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {questions.map((question, questionIndex) => (
              <div key={question.id} className="rounded-2xl bg-white/70 border border-primary/10 p-3">
                <div className="flex items-start gap-2">
                  <span className="shrink-0 size-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center">
                    {questionIndex + 1}
                  </span>
                  <p className="text-xs font-semibold leading-snug text-foreground/90">{question.question}</p>
                </div>
                <div className="mt-2 grid gap-1.5">
                  {question.options.map((option, optionIndex) => {
                    const selected = answers[question.id] === optionIndex;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => {
                          setAnswers((current) => ({ ...current, [question.id]: optionIndex }));
                          setResult(null);
                        }}
                        className={[
                          "rounded-xl border px-3 py-2 text-left text-xs leading-snug transition-all",
                          selected
                            ? "border-primary/35 bg-primary/10 text-primary font-semibold"
                            : "border-primary/10 bg-white/70 text-foreground/80 hover:border-primary/25 hover:bg-primary/5",
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!canSubmit}
            className={[
              "mt-2.5 w-full h-10 rounded-2xl font-semibold text-sm tracking-tight",
              "bg-gradient-to-br from-primary to-accent text-primary-foreground",
              "shadow-[0_4px_14px_-4px_oklch(0.62_0.20_255_/_0.5)]",
              "transition-all duration-300",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              !canSubmit ? "" : "hover:shadow-[0_8px_24px_-6px_oklch(0.62_0.20_255_/_0.65)] hover:-translate-y-[1px]",
              "flex items-center justify-center gap-2",
            ].join(" ")}
          >
            <Sparkles className="size-4" />
            Calculează triajul
          </button>

          {!canSubmit && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Răspunde la toate întrebările pentru a calcula nivelul de triaj.
            </p>
          )}

          {error && (
            <div className="mt-3 rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-3 fade-up">
              <div className={`rounded-2xl border px-3.5 py-2.5 ${painLevels[result.nivel].tone}`}>
                <h4 className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-1">
                  Nivel durere
                </h4>
                <p className="text-sm font-bold">{painLevels[result.nivel].label}</p>
                <p className="mt-1 text-xs leading-snug opacity-85">{result.explicatieNivel}</p>
              </div>
              <div>
                <h4 className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-semibold mb-1.5">
                  Posibile cauze
                </h4>
                <ul className="space-y-1.5">
                  {result.cauze.map((c, i) => (
                    <li
                      key={i}
                      className="text-sm leading-snug text-foreground/90 pl-3.5 relative before:content-[''] before:absolute before:left-0 before:top-[0.55em] before:size-1.5 before:rounded-full before:bg-primary"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-semibold mb-1.5">
                  Recomandare
                </h4>
                <p className="text-sm leading-relaxed text-foreground/90 rounded-2xl bg-accent/15 border border-accent/30 px-3.5 py-2.5">
                  {result.recomandare}
                </p>
              </div>
              {result.redFlags.length > 0 && (
                <div>
                  <h4 className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-semibold mb-1.5">
                    Semne importante
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.redFlags.map((flag) => (
                      <span
                        key={flag}
                        className="rounded-full bg-destructive/10 border border-destructive/25 px-2.5 py-1 text-[11px] font-semibold text-destructive"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="rounded-2xl bg-destructive/8 border border-destructive/30 px-3.5 py-2.5 flex gap-2.5">
                <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-[11.5px] leading-snug text-destructive font-semibold">
                  Acesta este un triaj educațional, nu un diagnostic medical și nu înlocuiește consultul unui medic.
                </p>
              </div>
            </div>
          )}
        </div>
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

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 border border-primary/10 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-semibold mb-1">
        {label}
      </p>
      <p className="text-xs font-semibold leading-snug text-foreground/90">{value}</p>
    </div>
  );
}
