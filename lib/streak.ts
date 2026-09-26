import type { DayRecord } from "./storage/repository";
import { addDays, toDayString } from "./dates";
import { RESCUE_LADDER, isRescued, oldestOpenRescue } from "./rescue";

export function computeStreak(records: DayRecord[], today = new Date()): number {
  const completed = new Set(records.filter(r => r.completed).map(r => r.day));
  const todayStr = toDayString(today);
  const yesterdayStr = addDays(todayStr, -1);

  let streak = 0;
  let day = completed.has(todayStr)
    ? todayStr
    : completed.has(yesterdayStr)
      ? yesterdayStr
      : null;

  while (day && completed.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

/**
 * Días fallados que recupera el cronómetro de los días siguientes según la escalera, siempre que
 * la víspera contara (meditada o ya recuperada): así una racha rota hace tiempo no revive sola.
 */
export function recoveredDays(completedDays: Iterable<string>, timerTotals: Record<string, number>) {
  const completed = new Set(completedDays);
  const candidates = [...new Set(Object.keys(timerTotals).flatMap((day) => RESCUE_LADDER.map((_, step) => addDays(day, -(step + 1)))))].sort();
  const recovered: string[] = [];
  for (const day of candidates) {
    if (completed.has(day) || !completed.has(addDays(day, -1)) || !isRescued(day, timerTotals)) continue;
    completed.add(day);
    recovered.push(day);
  }
  return recovered;
}

/** Lo que pide hoy la racha, o null si no hay nada que recuperar. */
export function getStreakRecovery(records: DayRecord[], todayDay: string) {
  const completed = new Set(records.filter((record) => record.completed).map((record) => record.day));
  return oldestOpenRescue(todayDay, (day) => !completed.has(day) && completed.has(addDays(day, -1)));
}
