import { toDayString } from "@/lib/dates";
import { addTimerSessionWithRecovery } from "@/lib/storage/repository";
import {
  clearActiveTimer,
  getActiveTimer,
  markActiveTimerCompleted,
  type ActiveTimerSession,
} from "@/lib/timerSession";

export async function saveCompletedTimer(timer: ActiveTimerSession, finishedAt: number) {
  const settledAt = Math.max(finishedAt, timer.endAt);
  const day = toDayString(new Date(settledAt));

  markActiveTimerCompleted(timer.id, settledAt);
  await addTimerSessionWithRecovery(day, timer.minutes, settledAt, timer.id);

  if (!clearActiveTimer(timer.id)) {
    throw new Error("No se pudo limpiar el cronómetro completado.");
  }
}

export async function saveDueActiveTimer(now = Date.now()) {
  const active = getActiveTimer();
  if (!active) return false;

  const finishedAt = active.completedAt ?? active.endAt;
  if (finishedAt > now) return false;

  await saveCompletedTimer(active, finishedAt);
  return true;
}
