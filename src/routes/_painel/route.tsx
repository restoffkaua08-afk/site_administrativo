import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/painel/app-shell";
import { getStoredSession, storeSession } from "@/lib/session";
import { api, isDemo } from "@/lib/admin-api";

export const Route = createFileRoute("/_painel")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (getStoredSession()) return;

    // Temporary demo-only bypass: never bypass auth when the real API is configured.
    // The demo API uses local in-memory sample data and makes no network requests.
    if (isDemo) {
      const demoSession = await api.login("demo@barbearianilles.com.br", "");
      storeSession(demoSession);
      return;
    }

    throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
