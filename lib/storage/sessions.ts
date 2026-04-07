import { Capacitor } from "@capacitor/core";
import { MeditCloudStore } from "@/lib/native/meditCloudStore";

export type MeditationSession = {
  id: string;
  minutes: number;
  createdAt: number;
  version: string;
};

type SessionTombstones = Record<string, string>;

export type DayRecord = {
  day: string;
  minutes: number;
  completed: boolean;
  updatedAt: number;
  sessions: MeditationSession[];
  tombstones: SessionTombstones;
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
const DEVICE_KEY = "medit_streak_device_id_v1";

function parseVersion(value: unknown) {
  if (typeof value !== "string") return null;

  const separator = value.indexOf(":");
  if (separator <= 0 || separator === value.length - 1) return null;

  const counter = Number(value.slice(0, separator));
  const actorId = value.slice(separator + 1);
  if (!Number.isInteger(counter) || counter < 0 || actorId.length === 0) {
    return null;
  }

  return { counter, actorId };
}

function compareVersions(left: string, right: string) {
  const leftParsed = parseVersion(left);
  const rightParsed = parseVersion(right);

  if (!leftParsed && !rightParsed) return 0;
  if (!leftParsed) return -1;
  if (!rightParsed) return 1;
  if (leftParsed.counter !== rightParsed.counter) return leftParsed.counter - rightParsed.counter;
  return leftParsed.actorId.localeCompare(rightParsed.actorId);
}

function getVersionCounter(version: string) {
  return parseVersion(version)?.counter ?? 0;
}

function makeVersion(counter: number, actorId: string) {
  return `${counter}:${actorId}`;
}

function fallbackId() {
  return `fallback-${Math.random().toString(36).slice(2, 10)}`;
}

function getDeviceId() {
  if (!hasWindow()) return "server";

  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;

    const next =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID().replaceAll("-", "")
        : fallbackId();
    localStorage.setItem(DEVICE_KEY, next);
    return next;
  } catch {
    return fallbackId();
  }
}

function getNextDayCounter(record?: DayRecord | null) {
  return Math.max(
    record?.updatedAt ?? 0,
    ...((record?.sessions ?? []).map((session) => getVersionCounter(session.version))),
    ...(Object.values(record?.tombstones ?? {}).map((version) => getVersionCounter(version))),
  ) + 1;
}

function normalizeTombstones(value: unknown): SessionTombstones {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value).reduce<SessionTombstones>((tombstones, [sessionId, version]) => {
    if (typeof version === "string" && parseVersion(version)) {
      tombstones[sessionId] = version;
    } else if (typeof version === "number" && Number.isFinite(version)) {
      tombstones[sessionId] = "0:legacy";
    }
    return tombstones;
  }, {});
}

function getSessionVersion(candidate: Partial<MeditationSession> & { updatedAt?: number; createdAt: number }) {
  if (typeof candidate.version === "string" && parseVersion(candidate.version)) {
    return candidate.version;
  }

  if (typeof candidate.updatedAt === "number" && Number.isFinite(candidate.updatedAt)) {
    return "0:legacy";
  }

  return "0:legacy";
}

function getLatestDayMutationCounter(sessions: MeditationSession[], tombstones: SessionTombstones, updatedAt: number) {
  return Math.max(
    updatedAt,
    ...sessions.map((session) => getVersionCounter(session.version)),
    ...Object.values(tombstones).map((version) => getVersionCounter(version)),
  );
}

function buildDayRecord(day: string, sessions: MeditationSession[], updatedAt = 0, tombstones: SessionTombstones = {}): DayRecord {
  const sorted = [...sessions].sort((a, b) => a.createdAt - b.createdAt);
  const filteredTombstones = Object.fromEntries(
    Object.entries(tombstones).filter(([sessionId, deletedVersion]) => {
      const session = sorted.find((candidate) => candidate.id === sessionId);
      return !session || compareVersions(deletedVersion, session.version) >= 0;
    }),
  );
  const latestMutation = getLatestDayMutationCounter(sorted, filteredTombstones, updatedAt);

  return {
    day,
    minutes: sorted.reduce((acc, session) => acc + session.minutes, 0),
    completed: sorted.length > 0,
    updatedAt: latestMutation,
    sessions: sorted,
    tombstones: filteredTombstones,
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
    version: getSessionVersion(candidate as Partial<MeditationSession> & { updatedAt?: number; createdAt: number }),
  };
}

function normalizeRecord(value: unknown): DayRecord | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<DayRecord> & Partial<LegacyDayRecord>;
  if (typeof candidate.day !== "string" || typeof candidate.updatedAt !== "number") {
    return null;
  }

  const tombstones = normalizeTombstones(candidate.tombstones);

  if (Array.isArray(candidate.sessions)) {
    const sessions = candidate.sessions.map(normalizeSession).filter((session): session is MeditationSession => session !== null);
    return buildDayRecord(candidate.day, sessions, candidate.updatedAt, tombstones);
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
              version: "0:legacy",
            },
          ]
        : [];

    return buildDayRecord(candidate.day, sessions, candidate.updatedAt, tombstones);
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
  const tombstonesByDay = new Map<string, Map<string, string>>();
  const updatedAtByDay = new Map<string, number>();

  for (const map of maps) {
    for (const [day, record] of Object.entries(map)) {
      const daySessions = sessionsByDay.get(day) ?? new Map<string, MeditationSession>();
      const dayTombstones = tombstonesByDay.get(day) ?? new Map<string, string>();

      for (const [sessionId, deletedVersion] of Object.entries(record.tombstones ?? {})) {
        const tombstoneVersion = typeof deletedVersion === "string" ? deletedVersion : "0:legacy";
        const existingTombstone = dayTombstones.get(sessionId);
        if (existingTombstone && compareVersions(tombstoneVersion, existingTombstone) < 0) continue;
        dayTombstones.set(sessionId, tombstoneVersion);

        const existingSession = daySessions.get(sessionId);
        if (existingSession && compareVersions(tombstoneVersion, existingSession.version) >= 0) {
          daySessions.delete(sessionId);
        }
      }

      for (const session of record.sessions) {
        const deletedVersion = dayTombstones.get(session.id);
        if (deletedVersion && compareVersions(deletedVersion, session.version) >= 0) {
          continue;
        }

        const existing = daySessions.get(session.id);
        if (!existing || compareVersions(session.version, existing.version) >= 0) {
          daySessions.set(session.id, session);
          if (deletedVersion && compareVersions(session.version, deletedVersion) > 0) {
            dayTombstones.delete(session.id);
          }
        }
      }

      sessionsByDay.set(day, daySessions);
      tombstonesByDay.set(day, dayTombstones);
      updatedAtByDay.set(day, Math.max(updatedAtByDay.get(day) ?? 0, record.updatedAt));
    }
  }

  const merged: DayMap = {};
  for (const [day, sessionMap] of sessionsByDay.entries()) {
    merged[day] = buildDayRecord(
      day,
      [...sessionMap.values()],
      updatedAtByDay.get(day) ?? 0,
      Object.fromEntries(tombstonesByDay.get(day)?.entries() ?? []),
    );
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
  const latest = await loadAllMap();
  const merged = mergeMaps(latest, map);
  const raw = stringifyMap(merged);
  writeLocalRaw(raw);
  await writeRemoteRaw(raw);
}

function mergeSessions(...groups: MeditationSession[][]): MeditationSession[] {
  return Array.from(
    groups
      .flat()
      .reduce((merged, session) => {
        const existing = merged.get(session.id);
        if (!existing || compareVersions(session.version, existing.version) >= 0) {
          merged.set(session.id, session);
        }
        return merged;
      }, new Map<string, MeditationSession>())
      .values(),
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
  const normalized = buildDayRecord(rec.day, rec.sessions ?? [], rec.updatedAt, rec.tombstones ?? {});
  const existing = map[normalized.day];

  if (!existing || normalized.updatedAt >= existing.updatedAt) {
    map[normalized.day] = normalized;
    await saveAllMap(map);
  }
}

export async function addSession(day: string, minutes: number, createdAt = Date.now()): Promise<DayRecord> {
  const sessionId = `${createdAt}-${Math.random().toString(36).slice(2, 8)}`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const latestMap = await loadAllMap();
    const latestDay = latestMap[day];
    const version = makeVersion(getNextDayCounter(latestDay), getDeviceId());
    const session: MeditationSession = {
      id: sessionId,
      minutes: Math.max(1, Math.round(minutes)),
      createdAt,
      version,
    };
    const next = buildDayRecord(
      day,
      mergeSessions(latestDay?.sessions ?? [], [session]),
      Math.max(latestDay?.updatedAt ?? 0, getVersionCounter(version)),
      latestDay?.tombstones ?? {},
    );
    latestMap[day] = next;
    await saveAllMap(latestMap);

    const verified = await getDay(day);
    if (verified?.sessions.some((existing) => existing.id === session.id && existing.version === version)) {
      return verified;
    }
  }

  const fallback = await getDay(day);
  return (
    fallback ??
    buildDayRecord(day, [
      {
        id: sessionId,
        minutes: Math.max(1, Math.round(minutes)),
        createdAt,
        version: makeVersion(1, getDeviceId()),
      },
    ])
  );
}

export async function updateSession(day: string, sessionId: string, minutes: number): Promise<DayRecord | null> {
  const nextMinutes = Math.max(1, Math.round(minutes));

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const latestMap = await loadAllMap();
    const latestDay = latestMap[day];
    if (!latestDay) return null;
    const version = makeVersion(getNextDayCounter(latestDay), getDeviceId());

    let found = false;
    const nextSessions = latestDay.sessions.map((session) => {
      if (session.id !== sessionId) return session;
      found = true;
      return {
        ...session,
        minutes: nextMinutes,
        version,
      };
    });

    if (!found) {
      return latestDay;
    }

    latestMap[day] = buildDayRecord(day, nextSessions, Math.max(latestDay.updatedAt, getVersionCounter(version)), latestDay.tombstones ?? {});
    await saveAllMap(latestMap);

    const verified = await getDay(day);
    const verifiedSession = verified?.sessions.find((session) => session.id === sessionId);
    if (verifiedSession?.minutes === nextMinutes && verifiedSession.version === version) {
      return verified;
    }
  }

  return getDay(day);
}

export async function deleteSession(day: string, sessionId: string): Promise<DayRecord | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const latestMap = await loadAllMap();
    const latestDay = latestMap[day];
    if (!latestDay) return null;
    const version = makeVersion(getNextDayCounter(latestDay), getDeviceId());

    const nextSessions = latestDay.sessions.filter((session) => session.id !== sessionId);
    if (nextSessions.length === latestDay.sessions.length) {
      return latestDay;
    }

    latestMap[day] = buildDayRecord(day, nextSessions, Math.max(latestDay.updatedAt, getVersionCounter(version)), {
      ...(latestDay.tombstones ?? {}),
      [sessionId]: version,
    });

    await saveAllMap(latestMap);

    const verified = await getDay(day);
    if (!verified?.sessions.some((session) => session.id === sessionId) && verified?.tombstones[sessionId] === version) {
      return verified;
    }
  }

  return getDay(day);
}
