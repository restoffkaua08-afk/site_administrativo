import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCheck, X, Ban } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api, isDemo, type Appointment, type AppointmentAction } from "@/lib/admin-api";
import { formatTime } from "@/lib/format";

const DONE: Record<AppointmentAction, string> = {
  confirm: "Agendamento confirmado",
  decline: "Agendamento recusado",
  cancel: "Agendamento cancelado",
  complete: "Atendimento concluído",
};

export function useAppointmentAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: AppointmentAction; reason?: string }) =>
      api.updateAppointmentStatus(id, action, reason),
    onSuccess: (_d, v) => {
      toast.success(DONE[v.action], { description: isDemo ? "Modo demonstração: alteração não persistida." : undefined });
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao atualizar"),
  });
}

export function AppointmentActions({ a, compact }: { a: Appointment; compact?: boolean }) {
  const m = useAppointmentAction();
  const [destructive, setDestructive] = useState<"decline" | "cancel" | null>(null);
  const [reason, setReason] = useState("");
  const size = compact ? "sm" : "sm";
  const busy = m.isPending;

  return (
    <div className="flex flex-wrap gap-2">
      {a.status === "pending" && (
        <>
          <Button size={size} disabled={busy} onClick={() => m.mutate({ id: a.id, action: "confirm" })}>
            <Check className="size-4" /> Confirmar
          </Button>
          <Button size={size} variant="outline" disabled={busy} onClick={() => setDestructive("decline")}>
            <X className="size-4" /> Recusar
          </Button>
        </>
      )}
      {a.status === "confirmed" && (
        <>
          <Button size={size} disabled={busy} onClick={() => m.mutate({ id: a.id, action: "complete" })}>
            <CheckCheck className="size-4" /> Concluir
          </Button>
          <Button size={size} variant="outline" disabled={busy} onClick={() => setDestructive("cancel")}>
            <Ban className="size-4" /> Cancelar
          </Button>
        </>
      )}

      <AlertDialog open={destructive !== null} onOpenChange={(o) => !o && setDestructive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {destructive === "decline" ? "Recusar agendamento?" : "Cancelar agendamento?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {a.clientName} · {a.serviceName} às {formatTime(a.startsAt)}. Esta ação não pode ser desfeita.
              {isDemo && " (Modo demonstração: nada será enviado ao cliente.)"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`reason-${a.id}`}>Motivo (opcional)</Label>
            <Textarea id={`reason-${a.id}`} value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                m.mutate({ id: a.id, action: destructive!, reason: reason || undefined });
                setReason("");
              }}
            >
              {destructive === "decline" ? "Recusar" : "Cancelar agendamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}