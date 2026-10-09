import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCheck, X, Ban, MessageCircle } from "lucide-react";
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

const SHOP_WHATSAPP = "5531971051343";

const DONE: Record<AppointmentAction, string> = {
  confirm: "Agendamento confirmado",
  decline: "Agendamento recusado",
  cancel: "Agendamento cancelado",
  complete: "Atendimento concluído",
};

function normalizeBrazilianPhone(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("55")) {
    if (digits.length === 12 || digits.length === 13) return digits;
    return null;
  }
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return null;
}

function openWhatsAppMessage(a: Appointment, action: "confirm" | "decline", reason?: string) {
  const phone = normalizeBrazilianPhone(a.clientPhone);
  if (!phone) {
    toast.error("O telefone deste cliente está inválido. Confira o DDD e o número no cadastro.");
    return false;
  }
  const when = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(a.startsAt));
  const message = action === "confirm"
    ? `Olá, ${a.clientName}! 💈 Seu horário na Barbearia Nilles foi CONFIRMADO.\n\n✂️ Serviço: ${a.serviceName}\n📅 Data e hora: ${when}\n\nSe precisar alterar o horário, fale conosco por aqui. Até lá!`
    : `Olá, ${a.clientName}. Aqui é da Barbearia Nilles. Infelizmente, não poderemos atender seu agendamento de ${a.serviceName} em ${when}.\n${reason?.trim() ? `Motivo: ${reason.trim()}\n` : ""}\nPor favor, responda a esta mensagem para combinarmos outro horário. Desculpe pelo transtorno.`;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  // Open synchronously from the click to avoid popup blockers; the owner still presses Send in WhatsApp.
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

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
          <Button size={size} disabled={busy} onClick={() => {
            openWhatsAppMessage(a, "confirm");
            m.mutate({ id: a.id, action: "confirm" });
          }}>
            <Check className="size-4" /> Confirmar e abrir WhatsApp
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
          <Button size={size} variant="outline" disabled={busy} onClick={() => openWhatsAppMessage(a, "confirm")}>
            <MessageCircle className="size-4" /> Reabrir mensagem
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
                if (destructive === "decline") openWhatsAppMessage(a, "decline", reason);
                m.mutate({ id: a.id, action: destructive!, reason: reason || undefined });
                setReason("");
              }}
            >
              {destructive === "decline" ? "Recusar e abrir WhatsApp" : "Cancelar agendamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
