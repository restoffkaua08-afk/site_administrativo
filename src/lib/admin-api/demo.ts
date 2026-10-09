// Implementação de DEMONSTRAÇÃO. Dados ficam apenas na memória do navegador
// e são descartados ao recarregar. Nenhuma chamada de rede é feita aqui.
import { addDays, dayKey, todayKey, TZ_OFFSET, weekdayOf } from "@/lib/format";
import type {
  AdminApi,
  Appointment,
  AppointmentStatus,
  BusinessDay,
  Client,
  Professional,
  Service,
  ShopSettings,
} from "./types";

const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10);
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

const services: Service[] = [
  { id: "svc-degrade", name: "Degradê clássico", durationMin: 45, priceCents: 4500, bufferMin: 10, active: true },
  { id: "svc-social", name: "Corte social", durationMin: 40, priceCents: 4000, bufferMin: 10, active: true },
  { id: "svc-barba", name: "Barba esculpida", durationMin: 30, priceCents: 3000, bufferMin: 5, active: true },
  { id: "svc-textura", name: "Corte + textura", durationMin: 50, priceCents: 5500, bufferMin: 10, active: true },
];

const professionals: Professional[] = [
  {
    id: "pro-teste",
    name: "Profissional de teste",
    role: "Barbeiro",
    email: "profissional@barbearianilles.com.br",
    active: true,
    serviceIds: services.map((s) => s.id),
  },
];

const clientNames = [
  ["Rafael Souza", "(11) 98765-4321"],
  ["Lucas Andrade", "(11) 97654-3210"],
  ["Bruno Carvalho", "(11) 96543-2109"],
  ["Thiago Lima", "(11) 95432-1098"],
  ["Gabriel Rocha", "(11) 94321-0987"],
  ["Mateus Ferreira", "(11) 93210-9876"],
  ["Pedro Almeida", "(11) 92109-8765"],
  ["Diego Martins", "(11) 91098-7654"],
];
const clients: Client[] = clientNames.map(([name, phone], i) => ({
  id: `cli-${i}`,
  name: name!,
  phone: phone!,
  visits: 2 + ((i * 3) % 9),
}));

const hours: BusinessDay[] = [0, 1, 2, 3, 4, 5, 6].map((w) => ({
  weekday: w,
  open: w >= 2 && w <= 6,
  start: "09:00",
  end: "20:00",
  breakStart: w >= 2 && w <= 6 ? "12:00" : undefined,
  breakEnd: w >= 2 && w <= 6 ? "13:00" : undefined,
}));

let settings: ShopSettings = {
  name: "Barbearia Nilles",
  slug: "barbearia-nilles",
  phone: "(11) 90000-0000",
  address: "Endereço de demonstração",
  timezone: "America/Sao_Paulo",
  currency: "BRL",
  minAdvanceHours: 2,
  cancellationHours: 3,
  autoConfirm: false,
};

function seedAppointments(): Appointment[] {
  const out: Appointment[] = [];
  const today = todayKey();
  const slots = ["09:00", "10:00", "11:00", "13:30", "14:30", "15:30", "17:00", "18:30"];
  let n = 0;
  for (let d = -6; d <= 7; d++) {
    const key = addDays(today, d);
    if (!hours[weekdayOf(key)]!.open) continue;
    slots.forEach((t, i) => {
      if ((i + d + 14) % 3 === 2) return; // deixa lacunas
      const svc = services[(i + d + 20) % services.length]!;
      const cli = clients[(n++ * 5 + d + 40) % clients.length]!;
      const start = new Date(`${key}T${t}:00${TZ_OFFSET}`);
      const end = new Date(start.getTime() + svc.durationMin * 60000);
      let status: AppointmentStatus;
      if (d < 0) status = i % 5 === 0 ? "cancelled" : i % 7 === 3 ? "no_show" : "completed";
      else if (d === 0) status = i < 2 ? "completed" : i % 3 === 0 ? "pending" : "confirmed";
      else status = i % 2 === 0 ? "pending" : "confirmed";
      out.push({
        id: `apt-${uid()}`,
        clientId: cli.id,
        clientName: cli.name,
        clientPhone: cli.phone,
        serviceId: svc.id,
        serviceName: svc.name,
        professionalId: professionals[0]!.id,
        professionalName: professionals[0]!.name,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        priceCents: svc.priceCents,
        status,
      });
    });
  }
  return out.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
let appointments = seedAppointments();
clients.forEach((c) => {
  const past = appointments.filter((a) => a.clientId === c.id && a.status === "completed");
  c.lastVisit = past.at(-1)?.startsAt;
});

const transitions: Record<string, { from: AppointmentStatus[]; to: AppointmentStatus }> = {
  confirm: { from: ["pending"], to: "confirmed" },
  decline: { from: ["pending"], to: "declined" },
  cancel: { from: ["pending", "confirmed"], to: "cancelled" },
  complete: { from: ["confirmed"], to: "completed" },
};

export const demoApi: AdminApi = {
  mode: "demo",
  async login(email) {
    await wait(500);
    return {
      token: "demo-token",
      user: { name: "Dono (demonstração)", email: email || "demo@barbearianilles.com.br", role: "owner" },
      demo: true,
    };
  },
  async listAppointments(f = {}) {
    await wait();
    const q = f.search?.trim().toLowerCase();
    return clone(
      appointments.filter((a) => {
        const k = dayKey(a.startsAt);
        if (f.from && k < f.from) return false;
        if (f.to && k > f.to) return false;
        if (f.status && f.status !== "all" && a.status !== f.status) return false;
        if (f.professionalId && f.professionalId !== "all" && a.professionalId !== f.professionalId) return false;
        if (f.serviceId && f.serviceId !== "all" && a.serviceId !== f.serviceId) return false;
        if (q && !`${a.clientName} ${a.clientPhone}`.toLowerCase().includes(q)) return false;
        return true;
      }),
    );
  },
  async updateAppointmentStatus(id, action) {
    await wait();
    const a = appointments.find((x) => x.id === id);
    if (!a) throw new Error("Agendamento não encontrado.");
    const t = transitions[action]!;
    if (!t.from.includes(a.status)) throw new Error("Ação não permitida para o status atual.");
    a.status = t.to;
    return clone(a);
  },
  async listClients(search) {
    await wait();
    const q = search?.trim().toLowerCase();
    return clone(clients.filter((c) => !q || `${c.name} ${c.phone} ${c.email ?? ""}`.toLowerCase().includes(q)));
  },
  async upsertClient(c) {
    await wait();
    if (c.id) {
      const i = clients.findIndex((x) => x.id === c.id);
      clients[i] = { ...clients[i]!, ...c, id: c.id };
      return clone(clients[i]!);
    }
    const nc: Client = { ...c, id: `cli-${uid()}`, visits: 0 };
    clients.unshift(nc);
    return clone(nc);
  },
  async listServices() {
    await wait();
    return clone(services);
  },
  async upsertService(s) {
    await wait();
    if (s.id) {
      const i = services.findIndex((x) => x.id === s.id);
      services[i] = { ...s, id: s.id };
      return clone(services[i]!);
    }
    const ns = { ...s, id: `svc-${uid()}` };
    services.push(ns);
    return clone(ns);
  },
  async deleteService(id) {
    await wait();
    services.splice(services.findIndex((s) => s.id === id), 1);
  },
  async listProfessionals() {
    await wait();
    return clone(professionals);
  },
  async upsertProfessional(p) {
    await wait();
    if (p.id) {
      const i = professionals.findIndex((x) => x.id === p.id);
      professionals[i] = { ...p, id: p.id };
      return clone(professionals[i]!);
    }
    const np = { ...p, id: `pro-${uid()}` };
    professionals.push(np);
    return clone(np);
  },
  async deleteProfessional(id) {
    await wait();
    professionals.splice(professionals.findIndex((p) => p.id === id), 1);
  },
  async getBusinessHours() {
    await wait();
    return clone(hours);
  },
  async saveBusinessHours(days) {
    await wait();
    days.forEach((d) => (hours[d.weekday] = { ...d }));
    return clone(hours);
  },
  async getSettings() {
    await wait();
    return clone(settings);
  },
  async saveSettings(s) {
    await wait();
    settings = { ...s };
    return clone(settings);
  },
};