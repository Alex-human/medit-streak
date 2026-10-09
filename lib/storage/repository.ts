import { cloudConfigured } from "@/lib/cloud/client";
import {
  addCloudSession,
  deleteCloudSession,
  getCloudDays,
  updateCloudSession,
} from "@/lib/cloud/sessions";
import * as local from "./sessions";

export type { DayRecord, MeditationSession } from "./sessions";

// Con la nube configurada todo exige sesión, así que el almacén lo decide la configuración y no si la
// sesión responde en este instante: si no se puede cargar, la operación falla (y quien llama reintenta)
// en vez de leer o escribir a escondidas en el almacén local, que en un dispositivo ya migrado está vacío.

export async function getAllDays() {
  return cloudConfigured ? getCloudDays() : local.getAllDays();
}

export async function getDay(day: string) {
  if (cloudConfigured) {
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
  if (cloudConfigured) return addCloudSession(day, minutes, createdAt, sessionId, "manual");
  return local.addSession(day, minutes, createdAt, sessionId);
}

/** En la nube los días recuperados se deducen al leer; en local se escriben junto a la sesión. */
export async function addTimerSessionWithRecovery(day: string, minutes: number, createdAt: number, sessionId: string) {
  if (cloudConfigured) {
    const saved = await addCloudSession(day, minutes, createdAt, sessionId, "timer");
    if (!saved) throw new Error(`No se pudo guardar la sesión de meditación para ${day}.`);
    return saved;
  }
  return local.addTimerSessionWithRecovery(day, minutes, createdAt, sessionId);
}

export async function updateSession(day: string, sessionId: string, minutes: number) {
  if (cloudConfigured) return updateCloudSession(day, sessionId, minutes);
  return local.updateSession(day, sessionId, minutes);
}

export async function deleteSession(day: string, sessionId: string) {
  if (cloudConfigured) return deleteCloudSession(day, sessionId);
  return local.deleteSession(day, sessionId);
}
