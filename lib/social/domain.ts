import { addDays } from "../dates";

export const STREAK_RESCUE_MINUTES = 30;
export const PET_RESCUE_MINUTES = 60;
export const PET_RESCUE_DAYS = 5;

export const PET_KINDS = ["fuego", "agua", "bosque", "nube"] as const;
export type PetKind = (typeof PET_KINDS)[number];

export const PET_DETAILS: Record<PetKind, { name: string; title: string; description: string }> = {
  fuego: { name: "Chispa", title: "Espíritu de fuego", description: "Crece de una brasa tímida a un pequeño sol guardián." },
  agua: { name: "Glú", title: "Gota de hielo", description: "Cada etapa la vuelve más cristalina, hasta dominar el hielo." },
  bosque: { name: "Tilo", title: "Guardián del bosque", description: "Un brote de madera que echa raíces, ramas y una gran copa." },
  nube: { name: "Nimbo", title: "Nube de los sueños", description: "Aprende a llover, hacer arcoíris y guardar pequeñas estrellas." },
};

export const PET_STAGES = [
  { id: "origen", label: "Origen", minBondDays: 0 },
  { id: "cría", label: "Cría", minBondDays: 3 },
  { id: "curiosa", label: "Curiosa", minBondDays: 7 },
  { id: "radiante", label: "Radiante", minBondDays: 14 },
  { id: "mítica", label: "Mítica", minBondDays: 30 },
  { id: "guardiana", label: "Guardiana", minBondDays: 60 },
] as const;

export type SocialSession = {
  userId: string;
  day: string;
  minutes: number;
  source: "timer" | "manual" | "import";
};

export type PetStage = (typeof PET_STAGES)[number]["id"];
export type PetMood = "dormida" | "esperando" | "feliz" | "recuperable" | "peligro" | "fallecida";

export type PetLife = {
  mood: PetMood;
  stage: PetStage;
  bondDays: number;
  ownersDoneToday: string[];
  endangeredUserId: string | null;
  rescueDeadline: string | null;
  rescueDaysLeft: number | null;
  fallenCount: number;
};

type MissedDay = {
  day: string;
  rescuedBy: "streak" | "pet" | null;
  rescueDeadline: string;
};

function dayRange(start: string, end: string) {
  const days: string[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

function totalsByDay(sessions: SocialSession[], userId: string, source?: SocialSession["source"]) {
  return sessions.reduce<Record<string, number>>((totals, session) => {
    if (session.userId !== userId || (source && session.source !== source)) return totals;
    totals[session.day] = (totals[session.day] ?? 0) + session.minutes;
    return totals;
  }, {});
}

function rescueForMissedDay(day: string, timerTotals: Record<string, number>): MissedDay {
  const nextDay = addDays(day, 1);
  if ((timerTotals[nextDay] ?? 0) >= STREAK_RESCUE_MINUTES) {
    return { day, rescuedBy: "streak", rescueDeadline: nextDay };
  }

  return { day, rescuedBy: null, rescueDeadline: addDays(day, PET_RESCUE_DAYS + 1) };
}

function incidentsForUser(
  sessions: SocialSession[],
  userId: string,
  startDay: string,
  todayDay: string,
) {
  const allTotals = totalsByDay(sessions, userId);
  const timerTotals = totalsByDay(sessions, userId, "timer");
  const yesterday = addDays(todayDay, -1);

  const missed = dayRange(startDay, yesterday)
    .filter((day) => (allTotals[day] ?? 0) === 0)
    .map((day) => rescueForMissedDay(day, timerTotals));

  return { allTotals, missed };
}

export function petStageForBond(bondDays: number): PetStage {
  return [...PET_STAGES]
    .reverse()
    .find((stage) => bondDays >= stage.minBondDays)?.id ?? "origen";
}

export function fallenPetKinds(seed: string, fallenCount: number) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const offset = hash % PET_KINDS.length;
  const orderedKinds = [...PET_KINDS.slice(offset), ...PET_KINDS.slice(0, offset)];
  return orderedKinds.slice(0, Math.min(PET_KINDS.length, Math.max(0, fallenCount)));
}

export function computePetLife({
  sessions,
  ownerIds,
  hatchedDay,
  todayDay,
}: {
  sessions: SocialSession[];
  ownerIds: [string, string];
  hatchedDay: string;
  todayDay: string;
}): PetLife {
  const perOwner = ownerIds.map((ownerId) => ({
    ownerId,
    ...incidentsForUser(sessions, ownerId, hatchedDay, todayDay),
  }));

  const candidates = perOwner
    .flatMap(({ ownerId, missed }) => missed.map((incident) => ({ ownerId, ...incident })))
    .filter((incident) => incident.rescuedBy === null)
    .sort((left, right) => left.day.localeCompare(right.day));
  const revivedIncidents = new Set<(typeof candidates)[number]>();
  const rescueSessions = sessions
    .map((session, index) => ({ session, index }))
    .filter(({ session }) => ownerIds.includes(session.userId) && session.source === "timer" && session.minutes >= PET_RESCUE_MINUTES)
    .sort((left, right) => left.session.day.localeCompare(right.session.day) || left.index - right.index);

  for (const { session } of rescueSessions) {
    const fallen = candidates.find(
      (incident) => incident.rescuedBy === null && !revivedIncidents.has(incident) && incident.rescueDeadline < session.day,
    );
    if (fallen) {
      revivedIncidents.add(fallen);
      continue;
    }

    const endangered = candidates.find(
      (incident) =>
        incident.rescuedBy === null
        && incident.ownerId === session.userId
        && session.day >= addDays(incident.day, 2)
        && session.day <= incident.rescueDeadline,
    );
    if (endangered) endangered.rescuedBy = "pet";
  }

  const unresolved = candidates.filter(
    (incident) => incident.rescuedBy === null && !revivedIncidents.has(incident),
  );
  const fallenIncidents = unresolved.filter((incident) => todayDay > incident.rescueDeadline);
  const fallenCount = Math.min(PET_KINDS.length, fallenIncidents.length);
  const danger = unresolved.find(
    (incident) => todayDay >= addDays(incident.day, 2) && todayDay <= incident.rescueDeadline,
  );
  const grace = unresolved.find((incident) => todayDay === addDays(incident.day, 1));

  const ownersDoneToday = perOwner
    .filter(({ allTotals }) => (allTotals[todayDay] ?? 0) > 0)
    .map(({ ownerId }) => ownerId);

  const protectedByOwner = perOwner.map(({ ownerId, allTotals, missed }) => {
    const rescued = new Set([
      ...missed.filter((incident) => incident.rescuedBy !== null).map((incident) => incident.day),
      ...candidates.filter((incident) => incident.ownerId === ownerId && incident.rescuedBy === "pet").map((incident) => incident.day),
    ]);
    return {
      ownerId,
      protectedDays: new Set(
        dayRange(hatchedDay, todayDay).filter((day) => (allTotals[day] ?? 0) > 0 || rescued.has(day)),
      ),
    };
  });

  let bondDays = 0;
  for (const day of dayRange(hatchedDay, todayDay)) {
    if (protectedByOwner.every(({ protectedDays }) => protectedDays.has(day))) bondDays += 1;
  }

  const shared = {
    stage: petStageForBond(bondDays),
    bondDays,
    ownersDoneToday,
    fallenCount,
  };

  if (fallenCount === PET_KINDS.length) {
    return {
      ...shared,
      mood: "fallecida",
      endangeredUserId: fallenIncidents[0]?.ownerId ?? null,
      rescueDeadline: fallenIncidents[0]?.rescueDeadline ?? null,
      rescueDaysLeft: 0,
    };
  }

  if (danger) {
    const remaining = Math.max(0, Math.round((Date.parse(`${danger.rescueDeadline}T00:00:00Z`) - Date.parse(`${todayDay}T00:00:00Z`)) / 86_400_000));
    return {
      ...shared,
      mood: "peligro",
      endangeredUserId: danger.ownerId,
      rescueDeadline: danger.rescueDeadline,
      rescueDaysLeft: remaining,
    };
  }

  if (grace) {
    return {
      ...shared,
      mood: "recuperable",
      endangeredUserId: grace.ownerId,
      rescueDeadline: grace.rescueDeadline,
      rescueDaysLeft: PET_RESCUE_DAYS,
    };
  }

  return {
    ...shared,
    mood: ownersDoneToday.length === 2 ? "feliz" : ownersDoneToday.length === 1 ? "esperando" : "dormida",
    endangeredUserId: null,
    rescueDeadline: null,
    rescueDaysLeft: null,
  };
}
