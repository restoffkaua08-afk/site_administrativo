import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/painel/app-shell";
import { getStoredSession } from "@/lib/session";

export const Route = createFileRoute("/_painel")({
  ssr: false,
  beforeLoad: ({ location }) => {
    if (!getStoredSession()) throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});