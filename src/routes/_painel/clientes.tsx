import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from "@/components/painel/ui-bits";
import { api } from "@/lib/admin-api";
import { formatDate, initials } from "@/lib/format";
import { pageHead } from "@/lib/head";
import { clientsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_painel/clientes")({
  head: pageHead("Clientes", "Base de clientes da barbearia."),
  component: ClientesPage,
});

function ClientesPage() {
  const qc = useQueryClient();
  const [term, setTerm] = useState("");
  const q = useQuery(clientsQuery(term));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const save = useMutation({
    mutationFn: () => api.upsertClient(form),
    onSuccess: () => { toast.success("Cliente cadastrado"); setOpen(false); setForm({ name: "", phone: "", email: "" }); qc.invalidateQueries({ queryKey: ["clients"] }); },
  });

  return (
    <>
      <PageHeader title="Clientes" description="Histórico e contato de quem frequenta a barbearia."
        actions={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Novo cliente</Button>} />
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
        <Input aria-label="Buscar cliente" className="pl-8" placeholder="Buscar por nome ou telefone" value={term} onChange={(e) => setTerm(e.target.value)} />
      </div>
      {q.isLoading ? <ListSkeleton /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> :
        q.data!.length === 0 ? <EmptyState title="Nenhum cliente encontrado" /> : (
        <ul className="divide-y rounded-xl border bg-card">
          {q.data!.map((c) => (
            <li key={c.id} className="flex items-center gap-4 p-4">
              <div className="grid size-10 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{initials(c.name)}</div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-muted-foreground">{c.phone}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium">{c.visits} visitas</p>
                <p className="text-xs text-muted-foreground">{c.lastVisit ? `Última: ${formatDate(c.lastVisit)}` : "Sem visitas"}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader>
          <form id="cli" className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (!form.name || !form.phone) return toast.error("Nome e telefone são obrigatórios"); save.mutate(); }}>
            <div className="space-y-1.5"><Label htmlFor="cn">Nome</Label><Input id="cn" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="cp">Telefone</Label><Input id="cp" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="ce">E-mail</Label><Input id="ce" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </form>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" form="cli" disabled={save.isPending}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}