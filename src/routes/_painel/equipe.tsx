import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil } from "lucide-react";
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
import { api, type Professional } from "@/lib/admin-api";
import { initials } from "@/lib/format";
import { pageHead } from "@/lib/head";
import { professionalsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_painel/equipe")({
  head: pageHead("Equipe", "Profissionais da barbearia e seus serviços."),
  component: EquipePage,
});

type Draft = Omit<Professional, "id"> & { id?: string };

function EquipePage() {
  const qc = useQueryClient();
  const q = useQuery(professionalsQuery);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [del, setDel] = useState<Professional | null>(null);
  const save = useMutation({
    mutationFn: (d: Draft) => api.upsertProfessional(d),
    onSuccess: () => { toast.success("Profissional salvo"); setDraft(null); qc.invalidateQueries({ queryKey: ["professionals"] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteProfessional(id),
    onSuccess: () => { toast.success("Profissional removido"); qc.invalidateQueries({ queryKey: ["professionals"] }); },
  });

  return (
    <>
      <PageHeader title="Equipe" description="Quem atende na barbearia."
        actions={<Button onClick={() => setDraft({ name: "", role: "Barbeiro", email: "", active: true, serviceIds: [] })}><Plus className="size-4" /> Novo profissional</Button>} />
      {q.isLoading ? <ListSkeleton /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> :
        q.data!.length === 0 ? <EmptyState title="Nenhum profissional" /> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {q.data!.map((p) => (
            <div key={p.id} className="flex items-center gap-4 rounded-xl border bg-card p-5">
              <div className="grid size-12 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">{initials(p.name)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.role} · {p.active ? "Ativo" : "Inativo"}</p>
              </div>
              <Button size="icon" variant="ghost" aria-label={`Editar ${p.name}`} onClick={() => setDraft(p)}><Pencil className="size-4" /></Button>
              <Button size="icon" variant="ghost" aria-label={`Remover ${p.name}`} onClick={() => setDel(p)}><Trash2 className="size-4" /></Button>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft?.id ? "Editar profissional" : "Novo profissional"}</DialogTitle></DialogHeader>
          {draft && (
            <form id="pro" className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (!draft.name.trim()) return toast.error("Informe o nome"); save.mutate(draft); }}>
              <div className="space-y-1.5"><Label htmlFor="pn">Nome</Label><Input id="pn" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="pr">Função</Label><Input id="pr" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="pe">E-mail</Label><Input id="pe" type="email" value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch id="pa" checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} /><Label htmlFor="pa">Ativo</Label></div>
            </form>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setDraft(null)}>Cancelar</Button><Button type="submit" form="pro" disabled={save.isPending}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remover {del?.name}?</AlertDialogTitle>
            <AlertDialogDescription>O profissional não receberá novos agendamentos.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => del && remove.mutate(del.id)}>Remover</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}