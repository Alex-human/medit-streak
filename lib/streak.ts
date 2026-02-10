import type { DayRecord } from "./storage/sessions";
import { addDays, toDayString } from "./dates";

export function computeStreak(records: DayRecord[], today = new Date()): number {
  const completed = new Set(records.filter(r => r.completed).map(r => r.day));

  let streak = 0;
  let day = toDayString(today);

  while (completed.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}
