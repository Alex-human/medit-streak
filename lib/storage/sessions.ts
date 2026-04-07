import { Capacitor } from "@capacitor/core";
import { MeditCloudStore } from "@/lib/native/meditCloudStore";

export type MeditationSession = {
  id: string;
  minutes: number;
  createdAt: number;
};

export type DayRecord = {
  day: string;
  minutes: number;
  completed: boolean;
  updatedAt: number;
  sessions: MeditationSession[];
};

type DayMap = Record<string, DayRecord>;

type LegacyDayRecord = {
  day: string;
  minutes: number;
  completed: boolean;
  updatedAt: number;
};

const KEY = "medit_streak_days_v2";
const LEGACY_KEY = "medit_streak_days_v1";

function buildDayRecord(day: string, sessions: MeditationSession[], updatedAt = 0): DayRecord {
  const sorted = [...sessions].sort((a, b) => a.createdAt - b.createdAt);
  return {
    day,
    minutes: sorted.reduce((acc, session) => acc + session.minutes, 0),
    completed: sorted.length > 0,
    updatedAt: sorted.reduce((latest, session) => Math.max(latest, session.createdAt), updatedAt),
    sessions: sorted,
  };
}

function normalizeSession(value: unknown): MeditationSession | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<MeditationSession>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.minutes !== "number" ||
    !Number.isFinite(candidate.minutes) ||
    typeof candidate.createdAt !== "number"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    minutes: Math.max(1, Math.round(candidate.minutes)),
    createdAt: candidate.createdAt,
  };
}

function normalizeRecord(value: unknown): DayRecord | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<DayRecord> & Partial<LegacyDayRecord>;
  if (typeof candidate.day !== "string" || typeof candidate.updatedAt !== "number") {
    return null;
  }

  if (Array.isArray(candidate.sessions)) {
    const sessions = candidate.sessions.map(normalizeSession).filter((session): session is MeditationSession => session !== null);
    return buildDayRecord(candidate.day, sessions, candidate.updatedAt);
  }

  if (
    typeof candidate.minutes === "number" &&
    Number.isFinite(candidate.minutes) &&
    typeof candidate.completed === "boolean"
  ) {
    const sessions =
      candidate.completed && candidate.minutes > 0
        ? [
            {
              id: `legacy-${candidate.updatedAt}`,
              minutes: Math.max(1, Math.round(candidate.minutes)),
              createdAt: candidate.updatedAt,
            },
          ]
        : [];

    return buildDayRecord(candidate.day, sessions, candidate.updatedAt);
  }

  return null;
}

function parseMap(raw: string | null): DayMap {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([key, value]) => [key, normalizeRecord(value)] as const)
        .filter((entry): entry is [string, DayRecord] => entry[1] !== null),
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
  const sessionsByDay = new Map<string, Map<string, MeditationSession>>();
  const updatedAtByDay = new Map<string, number>();

  for (const map of maps) {
    for (const [day, record] of Object.entries(map)) {
      const daySessions = sessionsByDay.get(day) ?? new Map<string, MeditationSession>();

      for (const session of record.sessions) {
        const existing = daySessions.get(session.id);
        if (!existing || session.createdAt >= existing.createdAt) {
          daySessions.set(session.id, session);
        }
      }

      sessionsByDay.set(day, daySessions);
      updatedAtByDay.set(day, Math.max(updatedAtByDay.get(day) ?? 0, record.updatedAt));
    }
  }

  const merged: DayMap = {};
  for (const [day, sessionMap] of sessionsByDay.entries()) {
    merged[day] = buildDayRecord(day, [...sessionMap.values()], updatedAtByDay.get(day) ?? 0);
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

function readLegacyLocalRaw(): string | null {
  if (!hasWindow()) return null;

  try {
    return localStorage.getItem(LEGACY_KEY);
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

function removeLegacyLocalRaw() {
  if (!hasWindow()) return;

  try {
    localStorage.removeItem(LEGACY_KEY);
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

async function readLegacyRemoteRaw(): Promise<string | null> {
  if (!isNativeStoreAvailable()) return null;

  try {
    const { value } = await MeditCloudStore.get({ key: LEGACY_KEY });
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

async function removeLegacyRemoteRaw() {
  if (!isNativeStoreAvailable()) return;

  try {
    await MeditCloudStore.remove({ key: LEGACY_KEY });
  } catch {
    // noop
  }
}

async function loadAllMap(): Promise<DayMap> {
  const localRaw = readLocalRaw();
  const localMap = parseMap(localRaw);
  const legacyLocalRaw = readLegacyLocalRaw();
  const legacyLocalMap = parseMap(legacyLocalRaw);

  if (!isNativeStoreAvailable()) {
    const merged = mergeMaps(legacyLocalMap, localMap);
    const mergedRaw = stringifyMap(merged);

    if (localRaw !== mergedRaw) {
      writeLocalRaw(mergedRaw);
    }
    if (legacyLocalRaw) {
      removeLegacyLocalRaw();
    }

    return merged;
  }

  const remoteRaw = await readRemoteRaw();
  const remoteMap = parseMap(remoteRaw);
  const legacyRemoteRaw = await readLegacyRemoteRaw();
  const legacyRemoteMap = parseMap(legacyRemoteRaw);
  const merged = mergeMaps(legacyLocalMap, legacyRemoteMap, localMap, remoteMap);
  const mergedRaw = stringifyMap(merged);

  if (localRaw !== mergedRaw) {
    writeLocalRaw(mergedRaw);
  }

  if (remoteRaw !== mergedRaw) {
    await writeRemoteRaw(mergedRaw);
  }

  if (legacyLocalRaw) {
    removeLegacyLocalRaw();
  }
  if (legacyRemoteRaw) {
    await removeLegacyRemoteRaw();
  }

  return merged;
}

async function saveAllMap(map: DayMap) {
  const raw = stringifyMap(map);
  writeLocalRaw(raw);
  await writeRemoteRaw(raw);
}

function mergeSessions(...groups: MeditationSession[][]): MeditationSession[] {
  return Array.from(
    new Map(groups.flat().map((session) => [session.id, session] as const)).values(),
  ).sort((a, b) => a.createdAt - b.createdAt);
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
  const normalized = buildDayRecord(rec.day, rec.sessions ?? [], rec.updatedAt);
  const existing = map[normalized.day];

  if (!existing || normalized.updatedAt >= existing.updatedAt) {
    map[normalized.day] = normalized;
    await saveAllMap(map);
  }
}

export async function addSession(day: string, minutes: number, createdAt = Date.now()): Promise<DayRecord> {
  const session: MeditationSession = {
    id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    minutes: Math.max(1, Math.round(minutes)),
    createdAt,
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const latestMap = await loadAllMap();
    const latestDay = latestMap[day];
    const next = buildDayRecord(day, mergeSessions(latestDay?.sessions ?? [], [session]), Math.max(latestDay?.updatedAt ?? 0, createdAt));
    latestMap[day] = next;
    await saveAllMap(latestMap);

    const verified = await getDay(day);
    if (verified?.sessions.some((existing) => existing.id === session.id)) {
      return verified;
    }
  }

  const fallback = await getDay(day);
  return fallback ?? buildDayRecord(day, [session], createdAt);
}
