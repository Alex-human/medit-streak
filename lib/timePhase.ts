export type TimePhase = "sunrise" | "day" | "sunset" | "night";

export function getTimePhase(now: Date = new Date()): TimePhase {
  const hour = now.getHours();

  // Sensible local-time defaults for a soothing visual rhythm.
  if (hour >= 6 && hour < 9) return "sunrise";
  if (hour >= 9 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "sunset";
  return "night";
}
