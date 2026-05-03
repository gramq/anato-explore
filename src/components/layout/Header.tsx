import { Link, useLocation } from "@tanstack/react-router";
import { LogOut, UserCircle } from "lucide-react";
import { useState } from "react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

const links = [
  { to: "/", label: "Explorator" },
  { to: "/glosar", label: "Bibliotecă" },
  { to: "/quiz", label: "Quiz" },
] as const;

export function Header() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <header className="glass rounded-3xl mx-4 mt-4 px-5 py-3 flex items-center gap-4 fade-up">
        <Link to="/" aria-label="Santix" className="shrink-0">
          <img
            src="/brand/santix-logo.png"
            alt="Santix"
            className="h-10 w-28 rounded-2xl object-cover object-center brightness-75 contrast-150 saturate-150 shadow-[0_8px_24px_-12px_oklch(0.45_0.21_287_/_0.45)]"
          />
        </Link>
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

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden max-w-[220px] items-center gap-2 rounded-2xl bg-white/65 px-3 py-2 text-xs font-semibold text-foreground/85 md:flex">
                <UserCircle className="size-4 text-primary" />
                <span className="truncate">{user.email}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-9 items-center gap-2 rounded-2xl bg-primary/10 px-3 text-xs font-semibold text-primary transition-all hover:bg-primary/15"
              >
                <LogOut className="size-4" />
                Ieși
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              disabled={loading}
              className="flex h-9 items-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-accent px-4 text-xs font-semibold text-primary-foreground shadow-[0_8px_18px_-12px_oklch(0.45_0.21_287_/_0.85)] transition-all hover:-translate-y-[1px] disabled:translate-y-0 disabled:opacity-60"
            >
              <UserCircle className="size-4" />
              Login
            </button>
          )}
        </div>
      </header>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
