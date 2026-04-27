import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { bones, categoryLabels, totalBoneCount, type BoneCategory } from "@/data/bones";
import { Search, BookMarked, Filter } from "lucide-react";

export const Route = createFileRoute("/glosar")({
  head: () => ({
    meta: [
      { title: "Glosar Medical — InfoMed 3D" },
      {
        name: "description",
        content: "Glosar complet al celor 206 oase ale corpului uman, cu denumire latină, descriere și funcție.",
      },
      { property: "og:title", content: "Glosar Medical — InfoMed 3D" },
      { property: "og:description", content: "Toate oasele corpului uman, organizate pe regiuni anatomice." },
    ],
  }),
  component: GlosarPage,
});

function GlosarPage() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<BoneCategory | "toate">("toate");

  const filtered = useMemo(() => {
    return bones.filter((b) => {
      const matchesQ =
        !query ||
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        b.latin.toLowerCase().includes(query.toLowerCase());
      const matchesCat = activeCat === "toate" || b.category === activeCat;
      return matchesQ && matchesCat;
    });
  }, [query, activeCat]);

  const categories = ["toate", ...Object.keys(categoryLabels)] as Array<BoneCategory | "toate">;

  return (
    <div className="absolute inset-0 m-4 mt-2 rounded-3xl glass overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-primary/10">
        <div className="flex items-center gap-3 mb-2">
          <BookMarked className="size-5 text-primary" />
          <span className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-semibold">
            Bibliotecă anatomică
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Glosar <span className="text-gradient-bone">Medical</span></h1>
        <p className="text-sm text-muted-foreground mt-2">
          {totalBoneCount} oase catalogate · {bones.length} categorii anatomice
        </p>

        {/* Search */}
        <div className="mt-5 flex items-center gap-3 glass rounded-2xl px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută os după nume sau denumire latină…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>

        {/* Filters */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <Filter className="size-3.5 text-muted-foreground mr-1" />
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all ${
                activeCat === c
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                  : "bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              }`}
            >
              {c === "toate" ? "Toate" : categoryLabels[c]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min">
        {filtered.map((b, i) => (
          <article
            key={b.id}
            className="glass rounded-3xl p-5 spring-hover fade-up"
            style={{ animationDelay: `${Math.min(i * 20, 300)}ms` }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg font-bold tracking-tight">{b.name}</h3>
                <p className="text-xs italic text-muted-foreground mt-0.5">{b.latin}</p>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-primary bg-primary/15 border border-primary/25 rounded-full px-2 py-1">
                ×{b.count}
              </span>
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
              {categoryLabels[b.category]}
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">{b.description}</p>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-16">
            Niciun rezultat pentru căutarea ta.
          </div>
        )}
      </div>
    </div>
  );
}
