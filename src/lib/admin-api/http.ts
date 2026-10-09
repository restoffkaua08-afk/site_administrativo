// API administrativa autenticada. Recursos não disponíveis falham explicitamente, sem dados falsos.
import { getStoredSession } from "@/lib/session";
import type { AdminApi, Appointment, AppointmentFilters, BusinessDay, Client, Professional, Service, ShopSettings } from "./types";
import { NotIntegratedError } from "./types";

type ApiService = { id: string; name: string; description?: string; duration_minutes: number; buffer_minutes: number; price: number | string | null; active: boolean };
type ApiStaff = { id: string; name: string; active: boolean };
type ApiHours = { id: string; staff_id: string; weekday: number; starts_at: string; ends_at: string; active: boolean };
type ApiStaffService = { staff_id: string; service_id: string };
type ApiAppointment = { id: string; service_id: string; staff_id: string; starts_at: string; ends_at: string; customer_name: string; customer_email: string; customer_phone: string; status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"; created_at: string };

export function createHttpAdminApi(baseUrl: string, slug: string): AdminApi {
  const base = baseUrl.replace(/\/$/, "");
  const owner = `${base}/v1/owner/${encodeURIComponent(slug)}`;

  async function req<T>(url: string, init: RequestInit = {}, token?: string): Promise<T> {
    const activeToken = token ?? getStoredSession()?.token;
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}), ...init.headers },
      cache: "no-store",
    });
    const payload = await res.json().catch(() => null);
    if (res.status === 401) throw new Error("Sessão expirada. Entre novamente.");
    if (res.status === 403) throw new Error(payload?.message || "Esta conta não tem acesso administrativo à barbearia.");
    if (res.status === 404) throw new Error("Recurso administrativo não encontrado na API.");
    if (!res.ok) throw new Error(payload?.message || `Erro da API (${res.status}).`);
    return payload as T;
  }
  const unsupported = (what: string): never => { throw new NotIntegratedError(what); };
  async function catalog() {
    return req<{ services: ApiService[]; staff: ApiStaff[]; staffServices: ApiStaffService[]; workingHours: ApiHours[] }>(`${owner}/catalog`);
  }
  function mapService(s: ApiService): Service {
    return { id: s.id, name: s.name, durationMin: s.duration_minutes, priceCents: Math.round(Number(s.price ?? 0) * 100), bufferMin: s.buffer_minutes, active: s.active };
  }
  async function listServices() { return (await catalog()).services.map(mapService); }
  async function listProfessionals() {
    const c = await catalog();
    return c.staff.map((p) => ({
      id: p.id, name: p.name, role: "Barbeiro", active: p.active,
      serviceIds: c.staffServices.filter((link) => link.staff_id === p.id).map((link) => link.service_id),
    }));
  }
  return {
    mode: "live",
    async login(email, password) {
      const result = await req<{ token: string; user: { name: string; email: string; role: "owner" | "admin" | "staff" } }>(
        `${owner}/login`, { method: "POST", body: JSON.stringify({ email, password }) },
      );
      return { token: result.token, user: { name: result.user.name, email: result.user.email, role: result.user.role === "staff" ? "staff" : "owner" }, demo: false };
    },
    async listAppointments(f = {}) {
      // Keep the agenda usable even when a caller omits its date filters.
      // Default to the last 7 days through the next 30 days, using local calendar dates.
      const dateKey = (value: Date) =>
        `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
      const today = new Date();
      const fallbackFrom = new Date(today);
      fallbackFrom.setDate(fallbackFrom.getDate() - 7);
      const fallbackTo = new Date(today);
      fallbackTo.setDate(fallbackTo.getDate() + 30);
      const from = f.from || dateKey(fallbackFrom);
      const to = f.to || dateKey(fallbackTo);
      const start = new Date(`${from}T00:00:00-03:00`).toISOString();
      const end = new Date(`${to}T00:00:00-03:00`);
      end.setDate(end.getDate() + 1);
      const params = new URLSearchParams({ from: start, to: end.toISOString() });
      if (f.status && f.status !== "all" && f.status !== "declined") params.set("status", f.status);
      const [data, c] = await Promise.all([
        req<{ appointments: ApiAppointment[] }>(`${owner}/appointments?${params}`),
        catalog(),
      ]);
      const services = new Map(c.services.map((s) => [s.id, s]));
      const staff = new Map(c.staff.map((s) => [s.id, s]));
      const query = f.search?.trim().toLocaleLowerCase("pt-BR");
      return data.appointments.map((a): Appointment => {
        const service = services.get(a.service_id);
        const professional = staff.get(a.staff_id);
        const status = a.status === "cancelled" ? "cancelled" : a.status;
        return {
          id: a.id, clientId: a.customer_phone, clientName: a.customer_name, clientPhone: a.customer_phone,
          serviceId: a.service_id, serviceName: service?.name ?? "Serviço", professionalId: a.staff_id,
          professionalName: professional?.name ?? "Profissional", startsAt: a.starts_at, endsAt: a.ends_at,
          priceCents: Math.round(Number(service?.price ?? 0) * 100), status,
        };
      }).filter((a) =>
        (!f.serviceId || f.serviceId === "all" || a.serviceId === f.serviceId) &&
        (!f.professionalId || f.professionalId === "all" || a.professionalId === f.professionalId) &&
        (!f.status || f.status === "all" || a.status === f.status || (f.status === "declined" && a.status === "cancelled")) &&
        (!query || `${a.clientName} ${a.clientPhone}`.toLocaleLowerCase("pt-BR").includes(query)),
      );
    },
    async updateAppointmentStatus(id, action) {
      const status = action === "confirm" ? "confirmed" : action === "complete" ? "completed" : "cancelled";
      const result = await req<{ appointment: ApiAppointment }>(`${owner}/appointments/${encodeURIComponent(id)}`, {
        method: "PATCH", body: JSON.stringify({ status }),
      });
      const a = result.appointment;
      const c = await catalog();
      const service = c.services.find((s) => s.id === a.service_id);
      const professional = c.staff.find((s) => s.id === a.staff_id);
      return {
        id: a.id, clientId: a.customer_phone, clientName: a.customer_name, clientPhone: a.customer_phone,
        serviceId: a.service_id, serviceName: service?.name ?? "Serviço", professionalId: a.staff_id,
        professionalName: professional?.name ?? "Profissional", startsAt: a.starts_at, endsAt: a.ends_at,
        priceCents: Math.round(Number(service?.price ?? 0) * 100), status: a.status,
      };
    },
    async listClients(search = "") {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const data = await req<{ clients: Client[] }>(`${owner}/clients?${params.toString()}`);
      return data.clients;
    },
    upsertClient: async (_client) => unsupported("edição de clientes"),
    listServices,
    async upsertService(s) {
      const body = { name: s.name.trim(), durationMinutes: s.durationMin, price: s.priceCents / 100, bufferMinutes: s.bufferMin, active: s.active };
      const result = await req<{ service: ApiService }>(s.id
        ? `${owner}/services/${encodeURIComponent(s.id)}`
        : `${owner}/services`, { method: s.id ? "PATCH" : "POST", body: JSON.stringify(body) });
      return mapService(result.service);
    },
    async deleteService(id) {
      await req<{ service: ApiService }>(`${owner}/services/${encodeURIComponent(id)}`, {
        method: "PATCH", body: JSON.stringify({ active: false }),
      });
    },
    listProfessionals,
    async upsertProfessional(p) {
      const body = { name: p.name.trim(), active: p.active };
      const result = await req<{ staff: ApiStaff }>(p.id
        ? `${owner}/staff/${encodeURIComponent(p.id)}`
        : `${owner}/staff`, { method: p.id ? "PATCH" : "POST", body: JSON.stringify(body) });
      await req<{ staffId: string; serviceIds: string[] }>(`${owner}/staff/${encodeURIComponent(result.staff.id)}/services`, {
        method: "PUT", body: JSON.stringify({ serviceIds: p.serviceIds }),
      });
      return { id: result.staff.id, name: result.staff.name, role: p.role || "Barbeiro", active: result.staff.active, serviceIds: p.serviceIds };
    },
    async deleteProfessional(id) {
      await req<{ staff: ApiStaff }>(`${owner}/staff/${encodeURIComponent(id)}`, {
        method: "PATCH", body: JSON.stringify({ active: false }),
      });
    },
    async getBusinessHours() {
      const { workingHours } = await catalog();
      const grouped = new Map<number, ApiHours[]>();
      for (const h of workingHours) grouped.set(h.weekday, [...(grouped.get(h.weekday) ?? []), h]);
      return Array.from({ length: 7 }, (_, weekday): BusinessDay => {
        const rows = (grouped.get(weekday) ?? []).filter((h) => h.active).sort((a,b) => a.starts_at.localeCompare(b.starts_at));
        return { weekday, open: rows.length > 0, start: rows[0]?.starts_at.slice(0,5) ?? "09:00", end: rows.at(-1)?.ends_at.slice(0,5) ?? "18:00" };
      });
    },
    async saveBusinessHours(days) {
      const normalized = Array.from({ length: 7 }, (_, weekday) => {
        const day = days.find((entry) => entry.weekday === weekday);
        return {
          weekday,
          open: Boolean(day?.open),
          start: day?.start ?? "09:00",
          end: day?.end ?? "18:00",
        };
      });
      await req<{ result: unknown }>(`${owner}/working-hours`, {
        method: "PUT", body: JSON.stringify({ days: normalized }),
      });
      return days;
    },
    async getSettings() { return (await req<{ settings: ShopSettings }>(owner + "/settings")).settings; },
    async saveSettings(settings) { return (await req<{ settings: ShopSettings }>(owner + "/settings", { method: "PATCH", body: JSON.stringify(settings) })).settings; },
  };
}

/** Endpoint de saúde público, sem autenticação. */
export async function checkPublicApiHealth(baseUrl: string): Promise<boolean> {
  try { return (await fetch(`${baseUrl.replace(/\/$/, "")}/health`)).ok; } catch { return false; }
}
