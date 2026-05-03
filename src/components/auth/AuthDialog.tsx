import { useState } from "react";
import { LogIn, Mail, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

type AuthMode = "login" | "register";

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const title = mode === "login" ? "Intră în cont" : "Creează cont";
  const submitLabel = mode === "login" ? "Logare cu email" : "Creează cont";

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (googleError) {
      setError(googleError.message);
      setLoading(false);
    }
  };

  const handleEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const credentials = { email: email.trim(), password };
    const response =
      mode === "login"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp({
            ...credentials,
            options: {
              emailRedirectTo: window.location.origin,
            },
          });

    setLoading(false);

    if (response.error) {
      setError(response.error.message);
      return;
    }

    if (mode === "register" && !response.data.session) {
      setMessage("Cont creat. Verifică emailul pentru confirmare, dacă Supabase o cere.");
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[oklch(0.12_0.04_285_/_0.42)] px-4 backdrop-blur-sm">
      <div className="glass-strong w-full max-w-[420px] rounded-3xl p-5 shadow-[var(--shadow-float)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Folosește contul pentru consultații AI și istoricul triajelor.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Închide"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/75 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-primary/15 bg-white/80 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-white disabled:opacity-60"
        >
          <LogIn className="size-4 text-primary" />
          Continuă cu Google
        </button>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-primary/10" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">sau</span>
          <span className="h-px flex-1 bg-primary/10" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="h-11 w-full rounded-2xl border border-primary/15 bg-white/80 px-3.5 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Parolă</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="h-11 w-full rounded-2xl border border-primary/15 bg-white/80 px-3.5 text-sm outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </label>

          {error && (
            <p className="rounded-2xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
              {error}
            </p>
          )}

          {message && (
            <p className="rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-accent text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_-14px_oklch(0.45_0.21_287_/_0.8)] transition-all hover:-translate-y-[1px] disabled:translate-y-0 disabled:opacity-60"
          >
            <Mail className="size-4" />
            {loading ? "Se procesează..." : submitLabel}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
            setMessage(null);
          }}
          className="mt-4 w-full text-center text-xs font-semibold text-primary hover:underline"
        >
          {mode === "login" ? "Nu ai cont? Creează unul" : "Ai deja cont? Intră în cont"}
        </button>
      </div>
    </div>
  );
}
