import { Link, useLocation } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Explorator" },
  { to: "/glosar", label: "Glosar" },
  { to: "/quiz", label: "Quiz" },
] as const;

export function Header() {
  const location = useLocation();
  return (
    <header className="glass rounded-3xl mx-4 mt-4 px-5 py-3 flex items-center gap-2 fade-up">
      <nav className="flex items-center gap-1">
        {links.map(({ to, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 rounded-2xl text-sm font-medium tracking-tight transition-all duration-300 ${
                active
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2 rounded-full bg-success/15 border border-success/30 px-3 py-1.5">
        <span className="size-2 rounded-full bg-success pulse-live" />
        <span className="text-[11px] font-bold tracking-[0.18em] text-success">LIVE</span>
      </div>
    </header>
  );
}
