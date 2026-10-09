import { queryOptions } from "@tanstack/react-query";
import { api, type AppointmentFilters } from "./admin-api";

export const qk = {
  appointments: ["appointments"] as const,
};

export const appointmentsQuery = (f: AppointmentFilters) =>
  queryOptions({ queryKey: ["appointments", f], queryFn: () => api.listAppointments(f) });
export const servicesQuery = queryOptions({ queryKey: ["services"], queryFn: () => api.listServices() });
export const professionalsQuery = queryOptions({ queryKey: ["professionals"], queryFn: () => api.listProfessionals() });
export const clientsQuery = (search: string) =>
  queryOptions({ queryKey: ["clients", search], queryFn: () => api.listClients(search) });
export const hoursQuery = queryOptions({ queryKey: ["hours"], queryFn: () => api.getBusinessHours() });
export const settingsQuery = queryOptions({ queryKey: ["settings"], queryFn: () => api.getSettings() });