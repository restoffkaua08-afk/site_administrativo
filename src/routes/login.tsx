import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { FlaskConical, Loader2, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, isDemo } from "@/lib/admin-api";
import { getStoredSession, storeSession } from "@/lib/session";

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  beforeLoad: () => {
    if (getStoredSession()) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Entrar — Painel da Barbearia" },
      { name: "description", content: "Acesso do dono e da equipe ao painel da Barbearia Nilles." },
      { property: "og:title", content: "Entrar — Painel da Barbearia" },
      { property: "og:description", content: "Acesso restrito ao painel administrativo." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isDemo && (!email || password.length < 6)) {
      setError("Informe e-mail e senha (mín. 6 caracteres).");
      return;
    }
    setLoading(true);
    try {
      const s = await api.login(email, password);
      storeSession(s);
      if (search.redirect?.startsWith("/")) navigate({ to: search.redirect, replace: true });
      else navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Scissors className="size-5" aria-hidden />
          </div>
          <span className="font-display font-semibold">Painel da Barbearia</span>
        </div>
        <div>
          <p className="font-display text-4xl font-semibold leading-tight">
            A cadeira cheia,
            <br />
            <span className="text-sidebar-primary">a agenda em ordem.</span>
          </p>
          <p className="mt-4 max-w-md text-sidebar-muted">
            Confirme horários, acompanhe a equipe e organize os serviços da Barbearia Nilles em um só lugar.
          </p>
        </div>
        <p className="text-xs text-sidebar-muted">Uso exclusivo do dono e da equipe.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5" noValidate>
          <div>
            <h1 className="text-2xl font-semibold">Entrar no painel</h1>
            <p className="mt-1 text-sm text-muted-foreground">Barbearia Nilles</p>
          </div>
          {isDemo && (
            <div className="flex gap-2 rounded-lg border border-brass/40 bg-accent p-3 text-sm text-accent-foreground">
              <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>
                O login administrativo ainda não está integrado à API. Entre em <strong>modo demonstração</strong> com
                qualquer e-mail.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@barbearia.com.br" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {isDemo ? "Entrar em modo demonstração" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}