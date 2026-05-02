import { useEffect, useState } from "react";
import { type Bone, categoryLabels } from "@/data/bones";
import { X, BookMarked, Sparkles, Stethoscope, Loader2, AlertTriangle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeSymptoms, type SymptomAnalysis } from "@/server/symptoms.functions";

interface Props {
  bone: Bone | null;
  onClose: () => void;
}

export function BoneInfoPanel({ bone, onClose }: Props) {
  const analyzeFn = useServerFn(analyzeSymptoms);
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset assistant state whenever the selected bone changes
  useEffect(() => {
    setSymptoms("");
    setResult(null);
    setError(null);
    setLoading(false);
  }, [bone?.id]);

  if (!bone) return null;

  const canSubmit = symptoms.trim().length >= 3 && !loading;

  const handleAnalyze = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeFn({
        data: {
          boneName: bone.name,
          boneLatin: bone.latin,
          boneDescription: bone.description,
          symptoms: symptoms.trim(),
        },
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "A apărut o eroare necunoscută.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      key={bone.id}
      className="absolute right-6 top-6 bottom-24 w-[360px] glass-strong rounded-3xl p-6 flex flex-col fade-up overflow-hidden"
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
          className="size-8 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors"
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

      <div className="space-y-4 overflow-y-auto pr-1 flex-1 -mr-1">
        <Section title="Descriere">
          <p className="text-sm leading-relaxed text-foreground/90">{bone.description}</p>
        </Section>
        <Section title="Funcție">
          <p className="text-sm leading-relaxed text-foreground/90">{bone.funcție}</p>
        </Section>

        {/* AI Symptom Assistant */}
        <div className="pt-3 mt-1 border-t border-primary/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_4px_12px_-4px_oklch(0.62_0.20_255_/_0.45)]">
              <Stethoscope className="size-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Asistent Simptome AI</h3>
              <p className="text-[11px] text-muted-foreground">
                Specific pentru {bone.name.toLowerCase()}
              </p>
            </div>
          </div>

          <label className="block text-[11px] text-muted-foreground mb-1.5 font-medium">
            Ce te doare în această zonă?
          </label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            disabled={loading}
            maxLength={800}
            rows={3}
            placeholder="Ex: mă doare când urc scările, simt o înțepătură ascuțită…"
            className="w-full resize-none rounded-2xl bg-white border border-primary/15 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 transition-all disabled:opacity-60"
          />

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
              loading ? "ai-glow" : "",
              "flex items-center justify-center gap-2",
            ].join(" ")}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analizează…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Analizează Simptomele
              </>
            )}
          </button>

          {error && (
            <div className="mt-3 rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 space-y-3 fade-up">
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
              <div className="rounded-2xl bg-destructive/8 border border-destructive/30 px-3.5 py-2.5 flex gap-2.5">
                <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-[11.5px] leading-snug text-destructive font-semibold">
                  Acesta este un diagnostic generat de AI și nu înlocuiește sfatul unui medic real!
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
