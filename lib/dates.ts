function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function datePartsFromIntl(d: Date, timeZone: string): { year: string; month: string; day: string } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      calendar: "gregory",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    if (!year || !month || !day) return null;
    return { year, month, day };
  } catch {
    return null;
  }
}

export function toDayString(d: Date): string {
  // YYYY-MM-DD en hora local usando zona horaria real del dispositivo.
  const parts = datePartsFromIntl(d, localTimeZone());
  if (parts) return `${parts.year}-${parts.month}-${parts.day}`;

  // fallback para runtimes con soporte Intl limitado
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dayStr: string, delta: number): string {
  const [y, m, d] = dayStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return toDayString(date);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function weekdayIndexMondayFirst(d: Date): number {
  // 0 = Monday ... 6 = Sunday
  const js = d.getDay(); // 0 Sunday ... 6 Saturday
  return (js + 6) % 7;
}

export function formatMonthYear(d: Date): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: localTimeZone(),
      calendar: "gregory",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
}
