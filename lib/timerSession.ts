export type ActiveTimerSession = {
  id: string;
  minutes: number;
  startedAt: number;
  endAt: number;
  completedAt: number | null;
};

const KEY = "medit_streak_active_timer_v1";

function hasWindow() {
  return typeof window !== "undefined";
}

function readRaw() {
  if (!hasWindow()) return null;

  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function writeRaw(value: string) {
  if (!hasWindow()) return;

  try {
    localStorage.setItem(KEY, value);
  } catch {
    // noop
  }
}

function removeRaw() {
  if (!hasWindow()) return false;

  try {
    localStorage.removeItem(KEY);
    return localStorage.getItem(KEY) === null;
  } catch {
    return false;
  }
}

function normalize(value: unknown): ActiveTimerSession | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Partial<ActiveTimerSession>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.minutes !== "number" ||
    !Number.isFinite(candidate.minutes) ||
    typeof candidate.startedAt !== "number" ||
    !Number.isFinite(candidate.startedAt) ||
    typeof candidate.endAt !== "number" ||
    !Number.isFinite(candidate.endAt)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    minutes: Math.max(1, Math.round(candidate.minutes)),
    startedAt: candidate.startedAt,
    endAt: candidate.endAt,
    completedAt:
      typeof candidate.completedAt === "number" && Number.isFinite(candidate.completedAt) ? candidate.completedAt : null,
  };
}

export function getActiveTimer(): ActiveTimerSession | null {
  const raw = readRaw();
  if (!raw) return null;

  try {
    return normalize(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function startActiveTimer(minutes: number, durationSeconds: number): ActiveTimerSession {
  const startedAt = Date.now();
  const next: ActiveTimerSession = {
    id: `${startedAt}-${Math.random().toString(36).slice(2, 8)}`,
    minutes: Math.max(1, Math.round(minutes)),
    startedAt,
    endAt: startedAt + durationSeconds * 1000,
    completedAt: null,
  };

  writeRaw(JSON.stringify(next));
  return next;
}

export function markActiveTimerCompleted(timerId: string, completedAt: number): ActiveTimerSession | null {
  const current = getActiveTimer();
  if (!current || current.id !== timerId) return null;

  const next: ActiveTimerSession = {
    ...current,
    completedAt,
  };

  writeRaw(JSON.stringify(next));
  return next;
}

export function clearActiveTimer(timerId?: string) {
  if (!timerId) {
    return removeRaw();
  }

  const current = getActiveTimer();
  if (!current || current.id !== timerId) return true;
  return removeRaw();
}
