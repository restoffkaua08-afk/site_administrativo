import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AppointmentCard } from "@/components/painel/appointment-card";
import { EmptyState, ErrorState, ListSkeleton, PageHeader, STATUS_LABEL, statusBar } from "@/components/painel/ui-bits";
import { pageHead } from "@/lib/head";
import { addDays, dayKey, formatDayLong, formatDayShort, formatTime, startOfWeek, todayKey } from "@/lib/format";
import { appointmentsQuery, hoursQuery, professionalsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/admin-api";

export const Route = createFileRoute("/_painel/agenda")({
  head: pageHead("Agenda", "Visão diária e semanal dos horários por profissional."),
  component: AgendaPage,
});

function AgendaPage() {
  const [view, setView] = useState<"day" | "week">("day");
  const [date, setDate] = useState(todayKey());
  const [pro, setPro] = useState("all");
  const from = view === "day" ? date : startOfWeek(date);
  const to = view === "day" ? date : addDays(from, 6);
  const q = useQuery(appointmentsQuery({ from, to, professionalId: pro }));
  const pros = useQuery(professionalsQuery);
  const hours = useQuery(hoursQuery);
  const step = view === "day" ? 1 : 7;

  return (
    <>
      <PageHeader title="Agenda" description={view === "day" ? formatDayLong(date) : `${formatDayShort(from)} – ${formatDayShort(to)}`} />

      <div className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Anterior" onClick={() => setDate(addDays(date, -step))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" onClick={() => setDate(todayKey())}>Hoje</Button>
          <Button variant="outline" size="icon" aria-label="Próximo" onClick={() => setDate(addDays(date, step))}>
            <ChevronRight className="size-4" />
          </Button>
          <input
            type="date"
            aria-label="Escolher data"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="ml-2 h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
          <Select value={pro} onValueChange={setPro}>
            <SelectTrigger className="w-full sm:w-56" aria-label="Filtrar por profissional">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os profissionais</SelectItem>
              {pros.data?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as "day" | "week")} variant="outline" aria-label="Visão">
            <ToggleGroupItem value="day">Dia</ToggleGroupItem>
            <ToggleGroupItem value="week">Semana</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <Legend />

      {q.isLoading ? (
        <ListSkeleton rows={5} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : view === "day" ? (
        (() => {
          const h = hours.data?.find((d) => d.weekday === new Date(`${date}T12:00:00-03:00`).getUTCDay());
          if (q.data!.length === 0)
            return (
              <EmptyState
                title={h && !h.open ? "Barbearia fechada neste dia" : "Nenhum horário agendado"}
                description={h?.open ? `Expediente ${h.start}–${h.end}.` : "Confira os horários de funcionamento."}
              />
            );
          return (
            <div className="space-y-3">
              {q.data!.map((a) => (
                <AppointmentCard key={a.id} a={a} />
              ))}
            </div>
          );
        })()
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => {
            const k = addDays(from, i);
            const items = q.data!.filter((a) => dayKey(a.startsAt) === k);
            const closed = hours.data?.[i] && !hours.data[i]!.open;
            return (
              <div key={k} className={cn("rounded-xl border bg-card p-2", k === todayKey() && "ring-2 ring-brass")}>
                <button
                  onClick={() => {
                    setDate(k);
                    setView("day");
                  }}
                  className="mb-2 w-full rounded-md px-1 py-1 text-left text-xs font-semibold capitalize hover:bg-muted"
                >
                  {formatDayShort(k)}
                </button>
                {closed ? (
                  <p className="px-1 text-xs text-muted-foreground">Fechado</p>
                ) : items.length === 0 ? (
                  <p className="px-1 text-xs text-muted-foreground">Livre</p>
                ) : (
                  <ul className="space-y-1.5">
                    {items.map((a) => (
                      <li key={a.id} className="flex gap-2 rounded-md bg-muted/60 p-1.5 text-xs">
                        <span className={cn("w-1 shrink-0 rounded-full", statusBar[a.status])} aria-hidden />
                        <span className="min-w-0">
                          <span className="block font-semibold tabular-nums">{formatTime(a.startsAt)}</span>
                          <span className="block truncate">{a.clientName}</span>
                          <span className="sr-only">{STATUS_LABEL[a.status]}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Legend() {
  const items: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];
  return (
    <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legenda de status">
      {items.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", statusBar[s])} aria-hidden /> {STATUS_LABEL[s]}
        </li>
      ))}
    </ul>
  );
}