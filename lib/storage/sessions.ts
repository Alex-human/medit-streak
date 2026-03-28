import { Capacitor } from "@capacitor/core";
import { MeditCloudStore } from "@/lib/native/meditCloudStore";

export type DayRecord = {
  day: string;        // YYYY-MM-DD
  minutes: number;    // preset o custom
  completed: boolean; // meditado o no
  updatedAt: number;  // Date.now()
};

type DayMap = Record<string, DayRecord>;

const KEY = "medit_streak_days_v1";

function parseMap(raw: string | null): DayMap {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, DayRecord>;
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, DayRecord] => {
        const [, value] = entry;
        return Boolean(
          value &&
            typeof value.day === "string" &&
            typeof value.minutes === "number" &&
            typeof value.completed === "boolean" &&
            typeof value.updatedAt === "number",
        );
      }),
    );
  } catch {
    return {};
  }
}

function stringifyMap(map: DayMap): string {
  return JSON.stringify(map);
}

function hasWindow() {
  return typeof window !== "undefined";
}

function isNativeStoreAvailable() {
  return hasWindow() && Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("MeditCloudStore");
}

function mergeMaps(...maps: DayMap[]): DayMap {
  const merged: DayMap = {};

  for (const map of maps) {
    for (const [day, record] of Object.entries(map)) {
      const existing = merged[day];
      if (!existing || record.updatedAt >= existing.updatedAt) {
        merged[day] = record;
      }
    }
  }

  return merged;
}

function readLocalRaw(): string | null {
  if (!hasWindow()) return null;

  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function writeLocalRaw(raw: string) {
  if (!hasWindow()) return;

  try {
    localStorage.setItem(KEY, raw);
  } catch {
    // noop
  }
}

async function readRemoteRaw(): Promise<string | null> {
  if (!isNativeStoreAvailable()) return null;

  try {
    const { value } = await MeditCloudStore.get({ key: KEY });
    return value ?? null;
  } catch {
    return null;
  }
}

async function writeRemoteRaw(raw: string) {
  if (!isNativeStoreAvailable()) return;

  try {
    await MeditCloudStore.set({ key: KEY, value: raw });
  } catch {
    // noop
  }
}

async function loadAllMap(): Promise<DayMap> {
  const localRaw = readLocalRaw();
  const localMap = parseMap(localRaw);

  if (!isNativeStoreAvailable()) return localMap;

  const remoteRaw = await readRemoteRaw();
  const remoteMap = parseMap(remoteRaw);
  const merged = mergeMaps(localMap, remoteMap);
  const mergedRaw = stringifyMap(merged);

  if (localRaw !== mergedRaw) {
    writeLocalRaw(mergedRaw);
  }

  if (remoteRaw !== mergedRaw) {
    await writeRemoteRaw(mergedRaw);
  }

  return merged;
}

async function saveAllMap(map: DayMap) {
  const raw = stringifyMap(map);
  writeLocalRaw(raw);
  await writeRemoteRaw(raw);
}

export async function getAllDays(): Promise<DayRecord[]> {
  const map = await loadAllMap();
  return Object.values(map).sort((a, b) => a.day.localeCompare(b.day));
}

export async function getDay(day: string): Promise<DayRecord | null> {
  const map = await loadAllMap();
  return map[day] ?? null;
}

export async function upsertDay(rec: DayRecord) {
  const map = await loadAllMap();
  const existing = map[rec.day];

  if (!existing || rec.updatedAt >= existing.updatedAt) {
    map[rec.day] = rec;
    await saveAllMap(map);
  }
}

export async function toggleComplete(day: string, minutesIfNew = 10): Promise<DayRecord> {
  const now = Date.now();
  const existing = await getDay(day);

  const next: DayRecord = existing
    ? { ...existing, completed: !existing.completed, updatedAt: now }
    : { day, minutes: minutesIfNew, completed: true, updatedAt: now };

  await upsertDay(next);
  return next;
}

export async function setMinutes(day: string, minutes: number) {
  const now = Date.now();
  const existing = await getDay(day);
  const next: DayRecord = existing
    ? { ...existing, minutes, updatedAt: now }
    : { day, minutes, completed: false, updatedAt: now };

  await upsertDay(next);
}
