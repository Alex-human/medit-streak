export function toDayString(d: Date): string {
  // YYYY-MM-DD en hora local
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
