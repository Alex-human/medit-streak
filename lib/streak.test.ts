import { describe, expect, it } from "vitest";
import { addDays } from "./dates";
import { getStreakRecovery, recoveredDays } from "./streak";
import type { DayRecord } from "./storage/sessions";

/** Día n del calendario de pruebas: D(1) = 2026-01-01. */
const D = (n: number) => addDays("2026-01-01", n - 1);
const record = (n: number): DayRecord => ({ day: D(n), minutes: 10, completed: true, updatedAt: 0, sessions: [], tombstones: {} });

describe("streak rescue ladder", () => {
  it("recovers a missed day with 10, 15, 20 or 30 timer minutes on the four following days", () => {
    // Solo falta el día 3; los demás se meditaron y el cronómetro de un día posterior decide.
    const completed = [1, 2, 4, 5, 6, 7, 8].map(D);
    expect(recoveredDays(completed, { [D(4)]: 10 })).toEqual([D(3)]);
    expect(recoveredDays(completed, { [D(5)]: 12 })).toEqual([]);
    expect(recoveredDays(completed, { [D(5)]: 15 })).toEqual([D(3)]);
    expect(recoveredDays(completed, { [D(7)]: 30 })).toEqual([D(3)]);
    expect(recoveredDays(completed, { [D(8)]: 60 })).toEqual([]);
  });

  it("chains several missed days only while the day before counts", () => {
    expect(recoveredDays([D(1)], { [D(4)]: 15 })).toEqual([D(2), D(3)]);
    expect(recoveredDays([D(1)], { [D(4)]: 10 })).toEqual([]);
    expect(recoveredDays([], { [D(4)]: 30 })).toEqual([]);
  });

  it("tells today's minutes for the oldest day that can still be recovered", () => {
    expect(getStreakRecovery([record(1), record(2), record(3)], D(5))).toEqual({ minutes: 10, daysLeft: 3 });
    expect(getStreakRecovery([record(1), record(2)], D(5))).toEqual({ minutes: 15, daysLeft: 2 });
    expect(getStreakRecovery([record(1)], D(6))).toEqual({ minutes: 30, daysLeft: 0 });
    expect(getStreakRecovery([record(1)], D(7))).toBeNull();
    expect(getStreakRecovery([record(1), record(2), record(3), record(4)], D(5))).toBeNull();
  });
});
