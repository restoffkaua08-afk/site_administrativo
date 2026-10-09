import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RotateCw } from "lucide-react";
import { cva } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppointmentStatus } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  declined: "Recusado",
  no_show: "Não compareceu",
};

const statusVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap before:size-1.5 before:rounded-full before:bg-current",
  {
    variants: {
      status: {
        pending: "bg-warning-soft text-warning",
        confirmed: "bg-info-soft text-info",
        completed: "bg-success-soft text-success",
        cancelled: "bg-muted text-muted-foreground",
        declined: "bg-danger-soft text-destructive",
        no_show: "bg-danger-soft text-destructive",
      },
    },
  },
);
export const statusBar: Record<AppointmentStatus, string> = {
  pending: "bg-warning",
  confirmed: "bg-info",
  completed: "bg-success",
  cancelled: "bg-muted-foreground/40",
  declined: "bg-destructive",
  no_show: "bg-destructive",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={statusVariants({ status })}>{STATUS_LABEL[status]}</span>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <div className="mb-3 grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-5" aria-hidden />
      </div>
      <p className="font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-xl border border-destructive/30 bg-danger-soft px-6 py-10 text-center">
      <AlertTriangle className="mb-2 size-6 text-destructive" aria-hidden />
      <p className="font-semibold">Não foi possível carregar</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "Erro inesperado."}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw className="size-4" /> Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function ListSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-label="Carregando">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}