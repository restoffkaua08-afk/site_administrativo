import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/painel/ui-bits";
import { api, type Service } from "@/lib/admin-api";
import { formatBRL } from "@/lib/format";
import { pageHead } from "@/lib/head";
import { servicesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_painel/servicos")({
  head: pageHead("Serviços", "Serviços com duração, preço e intervalo entre atendimentos."),
  component: ServicosPage,
});

type Draft = Omit<Service, "id"> & { id?: string };
const empty: Draft = { name: "", durationMin: 30, priceCents: 0, bufferMin: 10, active: true };

function ServicosPage() {
  const qc = useQueryClient();
  const q = useQuery(servicesQuery);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [del, setDel] = useState<Service | null>(null);
  const save = useMutation({
    mutationFn: (d: Draft) => api.upsertService(d),
    onSuccess: () => { toast.success("Serviço salvo"); setDraft(null); qc.invalidateQueries({ queryKey: ["services"] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteService(id),
    onSuccess: () => { toast.success("Serviço removido"); qc.invalidateQueries({ queryKey: ["services"] }); },
  });

  return (
    <>
      <PageHeader title="Serviços" description="Duração, preço e intervalo (buffer) de cada serviço."
        actions={<Button onClick={() => setDraft({ ...empty })}><Plus className="size-4" /> Novo serviço</Button>} />
      {q.isLoading ? <ListSkeleton /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> :
        q.data!.length === 0 ? <EmptyState title="Nenhum serviço" description="Cadastre o primeiro serviço." /> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {q.data!.map((s) => (
            <div key={s.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{s.name}</h2>
                {!s.active && <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Inativo</span>}
              </div>
              <p className="mt-2 font-display text-2xl font-semibold">{formatBRL(s.priceCents)}</p>
              <p className="text-sm text-muted-foreground">{s.durationMin} min · buffer {s.bufferMin} min</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setDraft(s)}><Pencil className="size-4" /> Editar</Button>
                <Button size="sm" variant="ghost" aria-label={`Excluir ${s.name}`} onClick={() => setDel(s)}><Trash2 className="size-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft?.id ? "Editar serviço" : "Novo serviço"}</DialogTitle></DialogHeader>
          {draft && (
            <form id="svc" className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (!draft.name.trim()) return toast.error("Informe o nome"); save.mutate(draft); }}>
              <div className="space-y-1.5"><Label htmlFor="n">Nome</Label><Input id="n" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label htmlFor="p">Preço (R$)</Label><Input id="p" type="number" min={0} step="0.01" value={draft.priceCents / 100} onChange={(e) => setDraft({ ...draft, priceCents: Math.round(Number(e.target.value) * 100) })} /></div>
                <div className="space-y-1.5"><Label htmlFor="d">Duração (min)</Label><Input id="d" type="number" min={5} step={5} value={draft.durationMin} onChange={(e) => setDraft({ ...draft, durationMin: Number(e.target.value) })} /></div>
                <div className="space-y-1.5"><Label htmlFor="b">Buffer (min)</Label><Input id="b" type="number" min={0} step={5} value={draft.bufferMin} onChange={(e) => setDraft({ ...draft, bufferMin: Number(e.target.value) })} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch id="a" checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} /><Label htmlFor="a">Ativo para agendamento</Label></div>
            </form>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDraft(null)}>Cancelar</Button><Button type="submit" form="svc" disabled={save.isPending}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir “{del?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>O serviço deixará de aparecer para novos agendamentos.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => del && remove.mutate(del.id)}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}