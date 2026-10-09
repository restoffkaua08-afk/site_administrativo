import { demoApi } from "./demo";
import { createHttpAdminApi } from "./http";
import type { AdminApi } from "./types";

export * from "./types";

export const config = {
  adminApiUrl:
    (import.meta.env.VITE_ADMIN_API_URL as string | undefined) ||
    "https://sistema-agendamento-api-lemon.vercel.app",
  publicApiUrl:
    (import.meta.env.VITE_PUBLIC_API_URL as string | undefined) || "https://sistema-agendamento-api-lemon.vercel.app",
  shopSlug: (import.meta.env.VITE_SHOP_SLUG as string | undefined) || "barbearia-nilles",
  publicSiteUrl: (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || "https://site-barbearia-ashy-eta.vercel.app/agendamento",
};

/** Uses the live administrative API whenever its URL is configured. */
export const api: AdminApi = config.adminApiUrl
  ? createHttpAdminApi(config.adminApiUrl, config.shopSlug)
  : demoApi;
export const isDemo = api.mode === "demo";
