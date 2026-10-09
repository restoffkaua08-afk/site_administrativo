import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ClipboardList,
  Clock,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Settings,
  Users,
  UserSquare2,
  FlaskConical,
  ExternalLink,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { config, isDemo } from "@/lib/admin-api";
import { clearSession, getStoredSession } from "@/lib/session";
import { initials } from "@/lib/format";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/agendamentos", label: "Agendamentos", icon: ClipboardList },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/servicos", label: "Serviços", icon: Scissors },
  { to: "/equipe", label: "Equipe", icon: UserSquare2 },
  { to: "/horarios", label: "Horários", icon: Clock },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const session = getStoredSession();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    clearSession();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="grid size-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Scissors className="size-5" aria-hidden />
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold">Barbearia Nilles</p>
          <p className="text-xs text-sidebar-muted">Painel da Barbearia</p>
        </div>
      </div>
      <nav aria-label="Principal" className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            activeProps={{ className: "bg-sidebar-accent !text-sidebar-accent-foreground [&>svg]:text-sidebar-primary" }}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-3 pb-3">
        <a href={config.publicSiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          <ExternalLink className="size-4" aria-hidden />
          Abrir site oficial
        </a>
      </div>
      {isDemo && (
        <div className="mx-3 mb-3 rounded-lg border border-sidebar-border p-3 text-xs text-sidebar-muted">
          <p className="mb-1 flex items-center gap-1.5 font-semibold text-sidebar-primary">
            <FlaskConical className="size-3.5" aria-hidden /> Modo demonstração
          </p>
          API admin ainda não integrada. Dados fictícios, não persistidos.
        </div>
      )}
      <div className="flex items-center gap-3 border-t border-sidebar-border px-4 py-4">
        <div className="grid size-9 place-items-center rounded-full bg-sidebar-accent text-xs font-semibold">
          {initials(session?.user.name ?? "U")}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">{session?.user.name}</p>
          <p className="truncate text-xs text-sidebar-muted">{session?.user.email}</p>
        </div>
        <button
          onClick={signOut}
          aria-label="Sair"
          className="rounded-md p-2 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <SidebarContent />
      </aside>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-sidebar px-4 py-3 text-sidebar-foreground lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Abrir menu"
          onClick={() => setOpen(true)}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Menu className="size-5" />
        </Button>
        <p className="font-display text-sm font-semibold">Barbearia Nilles</p>
        {isDemo && (
          <span className="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-[10px] font-bold uppercase text-sidebar-primary-foreground">
            Demo
          </span>
        )}
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-none p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      {isDemo && (
        <div role="status" className="border-b border-brass/30 bg-accent px-4 py-2 text-center text-xs text-accent-foreground sm:text-sm">
          <strong>Demonstração:</strong> a API administrativa ainda não existe. Os dados exibidos são fictícios e nenhuma
          alteração é salva ou enviada a clientes.
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}