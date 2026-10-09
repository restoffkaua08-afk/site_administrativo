import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Clock3, Hourglass, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentCard } from "@/components/painel/appointment-card";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/painel/ui-bits";
import { pageHead } from "@/lib/head";
import { addDays, formatBRL, formatDayLong, todayKey } from "@/lib/format";
import { appointmentsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_painel/dashboard")({
  head: pageHead("Dashboard", "Resumo do dia, próximos atendimentos e métricas da barbearia."),
  component: Dashboard,
});

function Stat({ label, value, hint, icon: Icon }: { label: string; value: string; hint?: string; icon: typeof Wallet }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="size-4 text-brass" aria-hidden />
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const today = todayKey();
  const todayQ = useQuery(appointmentsQuery({ from: today, to: today }));
  const weekQ = useQuery(appointmentsQuery({ from: addDays(today, -6), to: today }));
  const pendingQ = useQuery(appointmentsQuery({ from: today, status: "pending" }));

  const list = todayQ.data ?? [];
  const now = new Date().toISOString();
  const active = list.filter((a) => !["cancelled", "declined"].includes(a.status));
  const upcoming = list.filter((a) => a.endsAt >= now && (a.status === "confirmed" || a.status === "pending"));
  const revenueToday = list.filter((a) => a.status === "completed").reduce((s, a) => s + a.priceCents, 0);
  const forecast = active.filter((a) => a.status !== "no_show").reduce((s, a) => s + a.priceCents, 0);
  const week = weekQ.data ?? [];
  const weekDone = week.filter((a) => a.status === "completed");
  const weekCancel = week.filter((a) => ["cancelled", "no_show", "declined"].includes(a.status)).length;
  const weekRevenue = weekDone.reduce((s, a) => s + a.priceCents, 0);

  return (
    <>
      <PageHeader
        title="Bom dia, Barbearia Nilles"
        description={formatDayLong(today)}
        actions={
          <Button asChild>
            <Link to="/agenda">Abrir agenda</Link>
          </Button>
        }
      />

      <section aria-label="Métricas do dia" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {todayQ.isLoading ? (
          <ListSkeleton rows={1} className="col-span-full" />
        ) : (
          <>
            <Stat label="Atendimentos hoje" value={String(active.length)} hint={`${upcoming.length} ainda por vir`} icon={CalendarCheck} />
            <Stat label="Faturado hoje" value={formatBRL(revenueToday)} hint={`Previsto ${formatBRL(forecast)}`} icon={Wallet} />
            <Stat label="Pendentes" value={String(pendingQ.data?.length ?? "–")} hint="aguardando confirmação" icon={Hourglass} />
            <Stat
              label="Últimos 7 dias"
              value={formatBRL(weekRevenue)}
              hint={`${weekDone.length} concluídos · ${weekCancel} faltas/cancel.`}
              icon={Clock3}
            />
          </>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3" aria-labelledby="prox">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="prox" className="text-lg font-semibold">Próximos atendimentos</h2>
            <Link to="/agenda" className="text-sm text-muted-foreground hover:text-foreground">Ver agenda →</Link>
          </div>
          {todayQ.isLoading ? (
            <ListSkeleton />
          ) : todayQ.isError ? (
            <ErrorState error={todayQ.error} onRetry={() => todayQ.refetch()} />
          ) : upcoming.length === 0 ? (
            <EmptyState title="Nada mais por hoje" description="Não há atendimentos restantes na agenda de hoje." />
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 5).map((a) => (
                <AppointmentCard key={a.id} a={a} />
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-2" aria-labelledby="pend">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="pend" className="text-lg font-semibold">Pendentes de confirmação</h2>
            <Link to="/agendamentos" search={{ status: "pending" }} className="text-sm text-muted-foreground hover:text-foreground">
              Todos →
            </Link>
          </div>
          {pendingQ.isLoading ? (
            <ListSkeleton rows={3} />
          ) : pendingQ.isError ? (
            <ErrorState error={pendingQ.error} onRetry={() => pendingQ.refetch()} />
          ) : (pendingQ.data ?? []).length === 0 ? (
            <EmptyState title="Tudo confirmado" description="Nenhum pedido aguardando resposta." />
          ) : (
            <div className="space-y-3">
              {pendingQ.data!.slice(0, 4).map((a) => (
                <AppointmentCard key={a.id} a={a} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}