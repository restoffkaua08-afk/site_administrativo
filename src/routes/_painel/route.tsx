import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/painel/app-shell";

export const Route = createFileRoute("/_painel")({
  ssr: false,
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
