export type DayRecord = {
  day: string;        // YYYY-MM-DD
  minutes: number;    // preset o custom
  completed: boolean; // meditado o no
  updatedAt: number;  // Date.now()
};

const KEY = "medit_streak_days_v1";

function loadAll(): Record<string, DayRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAll(map: Record<string, DayRecord>) {
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function getAllDays(): DayRecord[] {
  const map = loadAll();
  return Object.values(map).sort((a, b) => a.day.localeCompare(b.day));
}

export function getDay(day: string): DayRecord | null {
  const map = loadAll();
  return map[day] ?? null;
}

export function upsertDay(rec: DayRecord) {
  const map = loadAll();
  const existing = map[rec.day];

  // last-write-wins por updatedAt
  if (!existing || rec.updatedAt >= existing.updatedAt) {
    map[rec.day] = rec;
    saveAll(map);
  }
}

export function toggleComplete(day: string, minutesIfNew = 10): DayRecord {
  const now = Date.now();
  const existing = getDay(day);

  const next: DayRecord = existing
    ? { ...existing, completed: !existing.completed, updatedAt: now }
    : { day, minutes: minutesIfNew, completed: true, updatedAt: now };

  upsertDay(next);
  return next;
}

export function setMinutes(day: string, minutes: number) {
  const now = Date.now();
  const existing = getDay(day);
  const next: DayRecord = existing
    ? { ...existing, minutes, updatedAt: now }
    : { day, minutes, completed: false, updatedAt: now };
  upsertDay(next);
}
