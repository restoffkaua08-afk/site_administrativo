import { demoApi } from "./demo";
import { createHttpAdminApi } from "./http";
import type { AdminApi } from "./types";

export * from "./types";

export const config = {
  adminApiUrl: (import.meta.env.VITE_ADMIN_API_URL as string | undefined) || "",
  publicApiUrl:
    (import.meta.env.VITE_PUBLIC_API_URL as string | undefined) || "https://sistema-agendamento-api-lemon.vercel.app",
  shopSlug: (import.meta.env.VITE_SHOP_SLUG as string | undefined) || "barbearia-nilles",
};

/** Sem VITE_ADMIN_API_URL o painel roda em modo demonstração (dados em memória). */
export const api: AdminApi = config.adminApiUrl ? createHttpAdminApi(config.adminApiUrl, config.shopSlug) : demoApi;
export const isDemo = api.mode === "demo";