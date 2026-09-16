import { addDays } from "../dates";

export const STREAK_RESCUE_MINUTES = 30;
export const PET_RESCUE_MINUTES = 60;
export const PET_RESCUE_DAYS = 5;

export type SocialSession = {
  userId: string;
  day: string;
  minutes: number;
  source: "timer" | "manual" | "import";
};

export type PetStage = "semilla" | "brote" | "lumo" | "guardián";
export type PetMood = "dormida" | "esperando" | "feliz" | "recuperable" | "peligro" | "fallecida";

export type PetLife = {
  mood: PetMood;
  stage: PetStage;
  bondDays: number;
  ownersDoneToday: string[];
  endangeredUserId: string | null;
  rescueDeadline: string | null;
  rescueDaysLeft: number | null;
  deathDay: string | null;
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

  const firstPetRescueDay = addDays(day, 2);
  const rescueDeadline = addDays(firstPetRescueDay, PET_RESCUE_DAYS - 1);
  const petRescued = dayRange(firstPetRescueDay, rescueDeadline).some(
    (candidate) => (timerTotals[candidate] ?? 0) >= PET_RESCUE_MINUTES,
  );

  return { day, rescuedBy: petRescued ? "pet" : null, rescueDeadline };
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
  if (bondDays >= 21) return "guardián";
  if (bondDays >= 7) return "lumo";
  if (bondDays >= 3) return "brote";
  return "semilla";
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

  const unresolved = perOwner
    .flatMap(({ ownerId, missed }) => missed.map((incident) => ({ ownerId, ...incident })))
    .filter((incident) => incident.rescuedBy === null)
    .sort((left, right) => left.day.localeCompare(right.day));

  const fatal = unresolved.find((incident) => todayDay > incident.rescueDeadline);
  const danger = unresolved.find(
    (incident) => todayDay >= addDays(incident.day, 2) && todayDay <= incident.rescueDeadline,
  );
  const grace = unresolved.find((incident) => todayDay === addDays(incident.day, 1));

  const ownersDoneToday = perOwner
    .filter(({ allTotals }) => (allTotals[todayDay] ?? 0) > 0)
    .map(({ ownerId }) => ownerId);

  const protectedByOwner = perOwner.map(({ ownerId, allTotals, missed }) => {
    const rescued = new Set(missed.filter((incident) => incident.rescuedBy !== null).map((incident) => incident.day));
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
  };

  if (fatal) {
    return {
      ...shared,
      mood: "fallecida",
      endangeredUserId: fatal.ownerId,
      rescueDeadline: fatal.rescueDeadline,
      rescueDaysLeft: 0,
      deathDay: addDays(fatal.rescueDeadline, 1),
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
      deathDay: null,
    };
  }

  if (grace) {
    return {
      ...shared,
      mood: "recuperable",
      endangeredUserId: grace.ownerId,
      rescueDeadline: grace.rescueDeadline,
      rescueDaysLeft: PET_RESCUE_DAYS,
      deathDay: null,
    };
  }

  return {
    ...shared,
    mood: ownersDoneToday.length === 2 ? "feliz" : ownersDoneToday.length === 1 ? "esperando" : "dormida",
    endangeredUserId: null,
    rescueDeadline: null,
    rescueDaysLeft: null,
    deathDay: null,
  };
}
