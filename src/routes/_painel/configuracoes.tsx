import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ErrorState, ListSkeleton, PageHeader } from "@/components/painel/ui-bits";
import { api, config, isDemo, type ShopSettings } from "@/lib/admin-api";
import { checkPublicApiHealth } from "@/lib/admin-api/http";
import { pageHead } from "@/lib/head";
import { settingsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_painel/configuracoes")({
  head: pageHead("Configurações", "Dados da barbearia, regras de agendamento e integração."),
  component: ConfigPage,
});

function ConfigPage() {
  const qc = useQueryClient();
  const q = useQuery(settingsQuery);
  const health = useQuery({ queryKey: ["health"], queryFn: () => checkPublicApiHealth(config.publicApiUrl) });
  const [s, setS] = useState<ShopSettings | null>(null);
  useEffect(() => { if (q.data) setS(q.data); }, [q.data]);
  const save = useMutation({
    mutationFn: () => api.saveSettings(s!),
    onSuccess: () => { toast.success("Configurações salvas"); qc.invalidateQueries({ queryKey: ["settings"] }); },
  });

  return (
    <>
      <PageHeader title="Configurações" actions={<Button disabled={!s || save.isPending} onClick={() => save.mutate()}>Salvar</Button>} />

      <section className="mb-6 rounded-xl border bg-card p-5" aria-labelledby="aparencia">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-foreground"><Sun className="size-5" aria-hidden /></div>
          <div className="min-w-0 flex-1">
            <h2 id="aparencia" className="font-semibold">Aparência</h2>
            <p className="mt-1 text-sm text-muted-foreground">Escolha como o painel aparece neste dispositivo. A preferência fica salva localmente.</p>
            <ThemePicker />
          </div>
        </div>
      </section>
      <section className="mb-6 rounded-xl border bg-card p-5" aria-labelledby="integ">
        <h2 id="integ" className="font-semibold">Integração</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">API pública</dt><dd className="break-all">{config.publicApiUrl} — {health.isLoading ? "verificando…" : health.data ? "online" : "indisponível"}</dd></div>
          <div><dt className="text-muted-foreground">API administrativa</dt><dd>{isDemo ? "Não integrada (modo demonstração)" : config.adminApiUrl}</dd></div>
        </dl>
      </section>
      {q.isLoading || !s ? (q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : <ListSkeleton rows={3} />) : (
        <form className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <div className="space-y-1.5"><Label htmlFor="sn">Nome</Label><Input id="sn" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="ss">Slug público</Label><Input id="ss" value={s.slug} onChange={(e) => setS({ ...s, slug: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="sp">Telefone</Label><Input id="sp" value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="sa">Endereço</Label><Input id="sa" value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="sm">Antecedência mínima (h)</Label><Input id="sm" type="number" min={0} value={s.minAdvanceHours} onChange={(e) => setS({ ...s, minAdvanceHours: Number(e.target.value) })} /></div>
          <div className="space-y-1.5"><Label htmlFor="sc">Cancelamento até (h antes)</Label><Input id="sc" type="number" min={0} value={s.cancellationHours} onChange={(e) => setS({ ...s, cancellationHours: Number(e.target.value) })} /></div>
          <div className="flex items-center gap-2 sm:col-span-2"><Switch id="sac" checked={s.autoConfirm} onCheckedChange={(v) => setS({ ...s, autoConfirm: v })} /><Label htmlFor="sac">Confirmar agendamentos automaticamente</Label></div>
          <p className="text-xs text-muted-foreground sm:col-span-2">Fuso {s.timezone} · Moeda {s.currency}</p>
        </form>
      )}
    </>
  );
}

function ThemePicker() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  useEffect(() => {
    const saved = window.localStorage.getItem("barbearia-admin-theme");
    const next = saved === "dark" || saved === "system" ? saved : "light";
    setTheme(next);
    const apply = () => {
      const dark = next === "dark" || (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    if (next === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
  }, []);
  function choose(next: "light" | "dark" | "system") {
    setTheme(next);
    window.localStorage.setItem("barbearia-admin-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark" || (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches));
  }
  const options = [
    { value: "light" as const, label: "Claro", icon: Sun },
    { value: "dark" as const, label: "Escuro", icon: Moon },
    { value: "system" as const, label: "Do dispositivo", icon: Monitor },
  ];
  return <div className="mt-4 grid gap-2 sm:grid-cols-3" role="group" aria-label="Tema do painel">{options.map(({value,label,icon:Icon}) => <button key={value} type="button" aria-pressed={theme === value} onClick={() => choose(value)} className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${theme === value ? "border-primary bg-accent text-accent-foreground" : "border-border bg-background text-foreground"}`}><Icon className="size-4" aria-hidden />{label}</button>)}</div>;
}
