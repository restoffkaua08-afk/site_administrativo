import { Phone } from "lucide-react";
import type { Appointment } from "@/lib/admin-api";
import { formatBRL, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AppointmentActions } from "./appointment-actions";
import { StatusBadge, statusBar } from "./ui-bits";

export function AppointmentCard({ a, showActions = true }: { a: Appointment; showActions?: boolean }) {
  return (
    <article className="relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-4 pl-5 sm:flex-row sm:items-center">
      <span className={cn("absolute inset-y-0 left-0 w-1", statusBar[a.status])} aria-hidden />
      <div className="w-20 shrink-0">
        <p className="font-display text-lg font-semibold tabular-nums">{formatTime(a.startsAt)}</p>
        <p className="text-xs text-muted-foreground tabular-nums">até {formatTime(a.endsAt)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{a.clientName}</p>
          <StatusBadge status={a.status} />
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {a.serviceName} · {formatBRL(a.priceCents)} · {a.professionalName}
        </p>
        <a href={`tel:${a.clientPhone.replace(/\D/g, "")}`} className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <Phone className="size-3" aria-hidden /> {a.clientPhone}
        </a>
      </div>
      {showActions && <AppointmentActions a={a} />}
    </article>
  );
}