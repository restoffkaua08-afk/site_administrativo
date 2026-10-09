import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppointmentActions } from "@/components/painel/appointment-actions";
import { AppointmentCard } from "@/components/painel/appointment-card";
import { EmptyState, ErrorState, ListSkeleton, PageHeader, STATUS_LABEL, StatusBadge } from "@/components/painel/ui-bits";
import { pageHead } from "@/lib/head";
import { addDays, formatBRL, formatDate, formatTime, todayKey } from "@/lib/format";
import { appointmentsQuery, servicesQuery } from "@/lib/queries";
import type { AppointmentStatus } from "@/lib/admin-api";

const STATUSES = Object.keys(STATUS_LABEL) as AppointmentStatus[];

export const Route = createFileRoute("/_painel/agendamentos")({
  validateSearch: (s: Record<string, unknown>): { status?: AppointmentStatus } => ({
    status: STATUSES.includes(s.status as AppointmentStatus) ? (s.status as AppointmentStatus) : undefined,
  }),
  head: pageHead("Agendamentos", "Pesquise, filtre, confirme, recuse e conclua agendamentos."),
  component: AgendamentosPage,
});

function AgendamentosPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/agendamentos" });
  const [from, setFrom] = useState(addDays(todayKey(), -7));
  const [to, setTo] = useState(addDays(todayKey(), 7));
  const [term, setTerm] = useState("");
  const [service, setService] = useState("all");
  const status = search.status ?? "all";
  const q = useQuery(appointmentsQuery({ from, to, status, serviceId: service, search: term }));
  const svcs = useQuery(servicesQuery);

  const clear = () => {
    setFrom(addDays(todayKey(), -7));
    setTo(addDays(todayKey(), 7));
    setTerm("");
    setService("all");
    navigate({ search: {} });
  };

  return (
    <>
      <PageHeader title="Agendamentos" description="Gerencie pedidos e atendimentos." />

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mb-5 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="q">Cliente</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
            <Input id="q" className="pl-8" placeholder="Nome ou telefone" value={term} onChange={(e) => setTerm(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="from">De</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="to">Até</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => navigate({ search: v === "all" ? {} : { status: v as AppointmentStatus } })}>
            <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Serviço</Label>
          <Select value={service} onValueChange={setService}>
            <SelectTrigger aria-label="Serviço"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {svcs.data?.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </form>

      {q.isLoading ? (
        <ListSkeleton rows={6} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : q.data!.length === 0 ? (
        <EmptyState
          title="Nenhum agendamento encontrado"
          description="Ajuste os filtros para ver outros resultados."
          action={<Button variant="outline" onClick={clear}>Limpar filtros</Button>}
        />
      ) : (
        <>
          <p className="mb-2 text-sm text-muted-foreground" aria-live="polite">{q.data!.length} resultado(s)</p>
          <div className="hidden overflow-hidden rounded-xl border bg-card lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.data!.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="tabular-nums">
                      <div className="font-medium">{formatDate(a.startsAt)}</div>
                      <div className="text-xs text-muted-foreground">{formatTime(a.startsAt)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{a.clientName}</div>
                      <div className="text-xs text-muted-foreground">{a.clientPhone}</div>
                    </TableCell>
                    <TableCell>{a.serviceName}</TableCell>
                    <TableCell className="tabular-nums">{formatBRL(a.priceCents)}</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell><div className="flex justify-end"><AppointmentActions a={a} /></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="space-y-3 lg:hidden">
            {q.data!.map((a) => (
              <div key={a.id}>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{formatDate(a.startsAt)}</p>
                <AppointmentCard a={a} />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}