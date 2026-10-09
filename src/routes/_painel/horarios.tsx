import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ErrorState, ListSkeleton, PageHeader } from "@/components/painel/ui-bits";
import { api, type BusinessDay } from "@/lib/admin-api";
import { WEEKDAYS } from "@/lib/format";
import { pageHead } from "@/lib/head";
import { hoursQuery } from "@/lib/queries";

export const Route = createFileRoute("/_painel/horarios")({
  head: pageHead("Horários", "Dias de funcionamento e expediente da barbearia."),
  component: HorariosPage,
});

function HorariosPage() {
  const qc = useQueryClient();
  const q = useQuery(hoursQuery);
  const [days, setDays] = useState<BusinessDay[]>([]);
  useEffect(() => { if (q.data) setDays(q.data); }, [q.data]);
  const save = useMutation({
    mutationFn: () => api.saveBusinessHours(days),
    onSuccess: () => { toast.success("Horários salvos"); qc.invalidateQueries({ queryKey: ["hours"] }); },
  });
  const set = (i: number, p: Partial<BusinessDay>) => setDays(days.map((d, j) => (j === i ? { ...d, ...p } : d)));
  const invalid = days.some((d) => d.open && d.start >= d.end);

  return (
    <>
      <PageHeader title="Horários" description="Fuso America/Sao_Paulo."
        actions={<Button disabled={save.isPending || invalid} onClick={() => save.mutate()}>Salvar horários</Button>} />
      {q.isLoading ? <ListSkeleton rows={7} /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (
        <div className="divide-y rounded-xl border bg-card">
          {days.map((d, i) => (
            <div key={d.weekday} className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex w-40 items-center gap-3">
                <Switch id={`o${i}`} checked={d.open} onCheckedChange={(v) => set(i, { open: v })} aria-label={`${WEEKDAYS[d.weekday]} aberto`} />
                <label htmlFor={`o${i}`} className="font-medium">{WEEKDAYS[d.weekday]}</label>
              </div>
              {d.open ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Input type="time" aria-label="Abertura" className="w-28" value={d.start} onChange={(e) => set(i, { start: e.target.value })} />
                  <span>às</span>
                  <Input type="time" aria-label="Fechamento" className="w-28" value={d.end} onChange={(e) => set(i, { end: e.target.value })} />
                  <span className="ml-2 text-muted-foreground">Intervalo</span>
                  <Input type="time" aria-label="Início do intervalo" className="w-28" value={d.breakStart ?? ""} onChange={(e) => set(i, { breakStart: e.target.value || undefined })} />
                  <Input type="time" aria-label="Fim do intervalo" className="w-28" value={d.breakEnd ?? ""} onChange={(e) => set(i, { breakEnd: e.target.value || undefined })} />
                  {d.start >= d.end && <span role="alert" className="text-destructive">Horário inválido</span>}
                </div>
              ) : <span className="text-sm text-muted-foreground">Fechado</span>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}