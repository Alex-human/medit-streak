import { getSignedInUserId } from "@/lib/cloud/client";
import {
  addCloudSession,
  deleteCloudSession,
  getCloudDays,
  updateCloudSession,
} from "@/lib/cloud/sessions";
import * as local from "./sessions";

export type { DayRecord, MeditationSession } from "./sessions";

async function usesCloud() {
  return Boolean(await getSignedInUserId());
}

export async function getAllDays() {
  return (await usesCloud()) ? getCloudDays() : local.getAllDays();
}

export async function getDay(day: string) {
  if (await usesCloud()) {
    return (await getCloudDays()).find((record) => record.day === day) ?? null;
  }
  return local.getDay(day);
}

export async function addSession(
  day: string,
  minutes: number,
  createdAt = Date.now(),
  sessionId = `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
) {
  if (await usesCloud()) return addCloudSession(day, minutes, createdAt, sessionId, "manual");
  return local.addSession(day, minutes, createdAt, sessionId);
}

/** En la nube los días recuperados se deducen al leer; en local se escriben junto a la sesión. */
export async function addTimerSessionWithRecovery(day: string, minutes: number, createdAt: number, sessionId: string) {
  if (await usesCloud()) {
    const saved = await addCloudSession(day, minutes, createdAt, sessionId, "timer");
    if (!saved) throw new Error(`No se pudo guardar la sesión de meditación para ${day}.`);
    return saved;
  }
  return local.addTimerSessionWithRecovery(day, minutes, createdAt, sessionId);
}

export async function updateSession(day: string, sessionId: string, minutes: number) {
  if (await usesCloud()) return updateCloudSession(day, sessionId, minutes);
  return local.updateSession(day, sessionId, minutes);
}

export async function deleteSession(day: string, sessionId: string) {
  if (await usesCloud()) return deleteCloudSession(day, sessionId);
  return local.deleteSession(day, sessionId);
}
