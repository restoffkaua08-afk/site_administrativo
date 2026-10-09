// Cliente HTTP para a FUTURA API administrativa autenticada.
// Nenhum destes endpoints existe hoje — veja README.md ("Endpoints que faltam").
// Só é usado quando VITE_ADMIN_API_URL estiver definido.
import { getStoredSession } from "@/lib/session";
import type { AdminApi, Appointment, AppointmentFilters, BusinessDay, Client, Professional, Service, ShopSettings } from "./types";

export function createHttpAdminApi(baseUrl: string, slug: string): AdminApi {
  const base = baseUrl.replace(/\/$/, "");
  const shop = `${base}/v1/admin/shops/${encodeURIComponent(slug)}`;

  async function req<T>(url: string, init: RequestInit = {}): Promise<T> {
    const token = getStoredSession()?.token;
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    if (res.status === 401) throw new Error("Sessão expirada. Entre novamente.");
    if (res.status === 404) throw new Error("Endpoint administrativo não encontrado na API.");
    if (!res.ok) throw new Error(`Erro da API (${res.status}).`);
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }
  const body = (b: unknown) => JSON.stringify(b);
  const qs = (f: AppointmentFilters = {}) =>
    new URLSearchParams(Object.entries(f).filter(([, v]) => v && v !== "all") as [string, string][]).toString();

  return {
    mode: "live",
    login: (email, password) => req(`${base}/v1/admin/auth/login`, { method: "POST", body: body({ email, password }) }),
    listAppointments: (f) => req<Appointment[]>(`${shop}/appointments?${qs(f)}`),
    updateAppointmentStatus: (id, action, reason) =>
      req<Appointment>(`${shop}/appointments/${id}/${action}`, { method: "POST", body: body({ reason }) }),
    listClients: (search) => req<Client[]>(`${shop}/clients?${new URLSearchParams(search ? { search } : {})}`),
    upsertClient: (c) =>
      req<Client>(c.id ? `${shop}/clients/${c.id}` : `${shop}/clients`, { method: c.id ? "PUT" : "POST", body: body(c) }),
    listServices: () => req<Service[]>(`${shop}/services`),
    upsertService: (s) =>
      req<Service>(s.id ? `${shop}/services/${s.id}` : `${shop}/services`, { method: s.id ? "PUT" : "POST", body: body(s) }),
    deleteService: (id) => req(`${shop}/services/${id}`, { method: "DELETE" }),
    listProfessionals: () => req<Professional[]>(`${shop}/professionals`),
    upsertProfessional: (p) =>
      req<Professional>(p.id ? `${shop}/professionals/${p.id}` : `${shop}/professionals`, {
        method: p.id ? "PUT" : "POST",
        body: body(p),
      }),
    deleteProfessional: (id) => req(`${shop}/professionals/${id}`, { method: "DELETE" }),
    getBusinessHours: () => req<BusinessDay[]>(`${shop}/business-hours`),
    saveBusinessHours: (days) => req<BusinessDay[]>(`${shop}/business-hours`, { method: "PUT", body: body(days) }),
    getSettings: () => req<ShopSettings>(`${shop}/settings`),
    saveSettings: (s) => req<ShopSettings>(`${shop}/settings`, { method: "PUT", body: body(s) }),
  };
}

/** Endpoints públicos que JÁ existem (somente leitura usada aqui). */
export async function checkPublicApiHealth(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/health`);
    return res.ok;
  } catch {
    return false;
  }
}