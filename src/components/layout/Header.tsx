import { Link, useLocation } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Explorator" },
  { to: "/glosar", label: "Bibliotecă" },
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
    </header>
  );
}
