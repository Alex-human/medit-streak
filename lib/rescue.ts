import { addDays } from "./dates";

/** Minutos de cronómetro que recuperan un día fallado si se hacen el 1.º, 2.º, 3.º o 4.º día después; el 5.º ya no hay rescate. */
export const RESCUE_LADDER = [10, 15, 20, 30] as const;

/** Minutos que pide hoy un día fallado, o null si hoy no es uno de sus días de rescate. */
export function rescueMinutes(missedDay: string, day: string) {
  const index = RESCUE_LADDER.findIndex((_, step) => addDays(missedDay, step + 1) === day);
  return index === -1 ? null : RESCUE_LADDER[index];
}

/**
 * Un día fallado queda recuperado si algún día de su escalera se llegó a los minutos de cronómetro
 * de ese peldaño. Con `asOf` solo cuentan los rescates hechos hasta ese día.
 */
export function isRescued(missedDay: string, timerTotals: Record<string, number>, asOf?: string) {
  return RESCUE_LADDER.some((minutes, step) => {
    const day = addDays(missedDay, step + 1);
    return (asOf === undefined || day <= asOf) && (timerTotals[day] ?? 0) >= minutes;
  });
}

/** El día fallado más antiguo que aún se puede recuperar hoy: pide más minutos que los otros y los arrastra. */
export function oldestOpenRescue(todayDay: string, isOpen: (missedDay: string) => boolean) {
  const steps = RESCUE_LADDER.length;
  const oldest = RESCUE_LADDER.findIndex((_, index) => isOpen(addDays(todayDay, index - steps)));
  return oldest === -1 ? null : { minutes: RESCUE_LADDER[steps - 1 - oldest], daysLeft: oldest };
}
