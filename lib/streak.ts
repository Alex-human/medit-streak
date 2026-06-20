import type { DayRecord } from "./storage/sessions";
import { addDays, toDayString } from "./dates";

export const STREAK_RECOVERY_MINUTES = 30;

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

export function getStreakRecovery(records: DayRecord[], todayDay: string) {
  const completed = new Set(records.filter((record) => record.completed).map((record) => record.day));
  const missedDay = addDays(todayDay, -1);
  const anchorDay = addDays(todayDay, -2);

  return {
    available: !completed.has(missedDay) && completed.has(anchorDay),
    missedDay,
    anchorDay,
    requiredMinutes: STREAK_RECOVERY_MINUTES,
  };
}
