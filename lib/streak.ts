import type { DayRecord } from "./storage/sessions";
import { addDays, toDayString } from "./dates";

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
