// Tipos de domínio do painel. Espelham o contrato esperado da futura API admin.

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "declined"
  | "no_show";

export interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  bufferMin: number;
  active: boolean;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  active: boolean;
  serviceIds: string[];
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  visits: number;
  lastVisit?: string; // ISO
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  professionalId: string;
  professionalName: string;
  startsAt: string; // ISO com offset
  endsAt: string;
  priceCents: number;
  status: AppointmentStatus;
  notes?: string;
}

export interface BusinessDay {
  weekday: number; // 0 = domingo
  open: boolean;
  start: string; // HH:mm
  end: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface ShopSettings {
  name: string;
  slug: string;
  phone: string;
  address: string;
  timezone: string;
  currency: string;
  minAdvanceHours: number;
  cancellationHours: number;
  autoConfirm: boolean;
}

export interface AppointmentFilters {
  from?: string; // YYYY-MM-DD
  to?: string;
  status?: AppointmentStatus | "all";
  professionalId?: string | "all";
  serviceId?: string | "all";
  search?: string;
}

export interface AdminSession {
  token: string;
  user: { name: string; email: string; role: "owner" | "staff" };
  demo: boolean;
}

export type AppointmentAction = "confirm" | "decline" | "cancel" | "complete";

export interface AdminApi {
  readonly mode: "demo" | "live";
  login(email: string, password: string): Promise<AdminSession>;
  listAppointments(f?: AppointmentFilters): Promise<Appointment[]>;
  updateAppointmentStatus(id: string, action: AppointmentAction, reason?: string): Promise<Appointment>;
  listClients(search?: string): Promise<Client[]>;
  upsertClient(c: Omit<Client, "id" | "visits"> & { id?: string }): Promise<Client>;
  listServices(): Promise<Service[]>;
  upsertService(s: Omit<Service, "id"> & { id?: string }): Promise<Service>;
  deleteService(id: string): Promise<void>;
  listProfessionals(): Promise<Professional[]>;
  upsertProfessional(p: Omit<Professional, "id"> & { id?: string }): Promise<Professional>;
  deleteProfessional(id: string): Promise<void>;
  getBusinessHours(): Promise<BusinessDay[]>;
  saveBusinessHours(days: BusinessDay[]): Promise<BusinessDay[]>;
  getSettings(): Promise<ShopSettings>;
  saveSettings(s: ShopSettings): Promise<ShopSettings>;
}

export class NotIntegratedError extends Error {
  constructor(what: string) {
    super(`Integração indisponível: ${what} ainda não existe na API.`);
    this.name = "NotIntegratedError";
  }
}