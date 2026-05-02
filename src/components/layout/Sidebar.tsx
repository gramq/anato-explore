import { Link, useLocation } from "@tanstack/react-router";
import { Boxes, BookOpen, Brain, Activity, Bone as BoneIcon, Layers } from "lucide-react";

const nav = [
  { to: "/", label: "Explorator Schelet", icon: Boxes },
  { to: "/glosar", label: "Bibliotecă anatomică", icon: BookOpen },
  { to: "/quiz", label: "Test Rapid", icon: Brain },
] as const;

export function Sidebar() {
  const location = useLocation();
  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col p-4 gap-4">
      {/* Brand */}
      <div className="glass rounded-3xl p-5 fade-up">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-gradient-to-br from-primary to-bone-glow flex items-center justify-center shadow-[var(--shadow-glow)]">
            <BoneIcon className="size-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none">Santix</h1>
            <p className="text-[11px] text-muted-foreground mt-1 tracking-wider uppercase">Anatomie Umană</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="glass rounded-3xl p-3 fade-up flex flex-col gap-1" style={{ animationDelay: "60ms" }}>
        {nav.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium spring-hover ${
                active
                  ? "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_oklch(0.62_0.20_255_/_0.25)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
              }`}
            >
              <Icon className={`size-[18px] ${active ? "text-primary" : ""}`} strokeWidth={2} />
              <span className="tracking-tight">{label}</span>
              {active && <span className="ml-auto size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--bone-glow)]" />}
            </Link>
          );
        })}
      </nav>

      {/* Stats */}
      <div className="mt-auto glass rounded-3xl p-5 fade-up" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="size-4 text-medical" />
          <span className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-semibold">Statistici corp</span>
        </div>
        <div className="space-y-3">
          <Stat value="206" label="Oase" accent="primary" />
          <Stat value="360" label="Articulații" accent="medical" />
          <Stat value="640" label="Mușchi" accent="accent" />
        </div>
      </div>
    </aside>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent: "primary" | "medical" | "accent" }) {
  const accentMap = {
    primary: "text-primary",
    medical: "text-medical",
    accent: "text-accent",
  };
  return (
    <div className="flex items-baseline justify-between rounded-2xl bg-primary/[0.04] border border-primary/10 px-4 py-3 spring-hover">
      <div className="flex items-center gap-2">
        <Layers className={`size-3.5 ${accentMap[accent]}`} />
        <span className="text-xs text-muted-foreground tracking-wide">{label}</span>
      </div>
      <span className={`text-2xl font-bold tracking-tight ${accentMap[accent]}`}>{value}</span>
    </div>
  );
}
