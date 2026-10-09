export const TZ = "America/Sao_Paulo";
// Brasil não adota horário de verão desde 2019: offset fixo -03:00.
export const TZ_OFFSET = "-03:00";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (cents: number) => brl.format(cents / 100);

const timeFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
/** YYYY-MM-DD no fuso de São Paulo */
export const dayKey = (d: Date | string) => keyFmt.format(typeof d === "string" ? new Date(d) : d);
export const todayKey = () => dayKey(new Date());

export function addDays(key: string, n: number) {
  const d = new Date(`${key}T12:00:00${TZ_OFFSET}`);
  d.setUTCDate(d.getUTCDate() + n);
  return dayKey(d);
}
export const weekdayOf = (key: string) => new Date(`${key}T12:00:00${TZ_OFFSET}`).getUTCDay();
export function startOfWeek(key: string) {
  return addDays(key, -weekdayOf(key));
}

export function formatDayLong(key: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long", day: "2-digit", month: "long" }).format(
    new Date(`${key}T12:00:00${TZ_OFFSET}`),
  );
}
export function formatDayShort(key: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "short", day: "2-digit", month: "2-digit" }).format(
    new Date(`${key}T12:00:00${TZ_OFFSET}`),
  );
}
export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(iso),
  );
}

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");