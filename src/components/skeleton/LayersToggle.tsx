import { Bone, Activity, Layers as LayersIcon } from "lucide-react";

export type LayerKey = "skeleton" | "muscles" | "tendons";

export interface LayersState {
  skeleton: boolean;
  muscles: boolean;
  tendons: boolean;
}

interface Props {
  layers: LayersState;
  onChange: (next: LayersState) => void;
}

const ITEMS: Array<{
  key: LayerKey;
  label: string;
  hint: string;
  Icon: typeof Bone;
}> = [
  { key: "skeleton", label: "Doar Schelet", hint: "Oase vizibile", Icon: Bone },
  { key: "muscles", label: "Sistem Muscular", hint: "Mușchi semi-transparenți", Icon: Activity },
  { key: "tendons", label: "Anatomie Completă", hint: "Tendoane și țesuturi", Icon: LayersIcon },
];

export function LayersToggle({ layers, onChange }: Props) {
  return (
    <div className="absolute left-6 bottom-6 glass-strong rounded-3xl p-3.5 w-[260px] fade-up">
      <div className="flex items-center gap-2 px-1.5 pb-2.5 mb-2 border-b border-primary/10">
        <LayersIcon className="size-3.5 text-primary" />
        <span className="text-[10px] tracking-[0.22em] uppercase font-bold text-primary">
          Vizualizare Straturi
        </span>
      </div>
      <div className="space-y-1">
        {ITEMS.map(({ key, label, hint, Icon }) => {
          const active = layers[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ ...layers, [key]: !active })}
              className={[
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-2xl transition-all text-left",
                active
                  ? "bg-primary/10 border border-primary/25"
                  : "bg-transparent border border-transparent hover:bg-muted/60",
              ].join(" ")}
            >
              <div
                className={[
                  "size-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold tracking-tight leading-tight">
                  {label}
                </div>
                <div className="text-[10.5px] text-muted-foreground leading-tight">{hint}</div>
              </div>
              <span
                className={[
                  "relative inline-flex h-[18px] w-[30px] items-center rounded-full transition-colors",
                  active ? "bg-primary" : "bg-muted-foreground/25",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                    active ? "translate-x-[14px]" : "translate-x-[2px]",
                  ].join(" ")}
                />
              </span>
              <span
                className={[
                  "size-2 rounded-full border transition-all",
                  active
                    ? "border-blue-400 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.75)]"
                    : "border-slate-300/60 bg-slate-300/25 shadow-none",
                ].join(" ")}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
