import type { AdminSession } from "./admin-api/types";

const KEY = "painel-barbearia-session";

export function getStoredSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}
export function storeSession(s: AdminSession) {
  window.localStorage.setItem(KEY, JSON.stringify(s));
}
export function clearSession() {
  window.localStorage.removeItem(KEY);
}