import { demoApi } from "./demo";
import type { AdminApi } from "./types";

export * from "./types";

export const config = {
  // This branch is intentionally demo-only: do not connect to the real admin API.
  adminApiUrl: "",
  publicApiUrl:
    (import.meta.env.VITE_PUBLIC_API_URL as string | undefined) || "https://sistema-agendamento-api-lemon.vercel.app",
  shopSlug: (import.meta.env.VITE_SHOP_SLUG as string | undefined) || "barbearia-nilles",
  publicSiteUrl: (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || "https://site-barbearia-ashy-eta.vercel.app/agendamento",
};

/** Temporary no-login demo: all panel data is fictional and in-memory only. */
export const api: AdminApi = demoApi;
export const isDemo = true;
