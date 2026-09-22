import { addDays } from "../dates";

export const STREAK_RESCUE_MINUTES = 30;
export const PET_RESCUE_MINUTES = 60;
export const PET_RESCUE_DAYS = 5;
/** Días que una criatura caída espera a que la revivan antes de volver como huevo. */
export const PET_REVIVE_DAYS = 4;
/** Días de vínculo que la criatura pasa naciendo del huevo. */
export const EGG_DAYS = 5;

export const PET_KINDS = ["fuego", "agua", "bosque", "nube"] as const;
export type PetKind = (typeof PET_KINDS)[number];

export const PET_DETAILS: Record<PetKind, { name: string; title: string; description: string }> = {
  fuego: { name: "Chispa", title: "Espíritu de fuego", description: "Crece de una brasa tímida a un pequeño sol guardián." },
  agua: { name: "Glú", title: "Gota de hielo", description: "Cada etapa la vuelve más cristalina, hasta dominar el hielo." },
  bosque: { name: "Tilo", title: "Guardián del bosque", description: "Una bellota que echa raíces, ramas y una gran copa." },
  nube: { name: "Nimbo", title: "Nube de los sueños", description: "Aprende a llover, hacer arcoíris y guardar pequeñas estrellas." },
};

export const PET_STAGES = [
  { id: "origen", label: "Origen", minBondDays: 0 },
  { id: "cría", label: "Cría", minBondDays: 10 },
  { id: "curiosa", label: "Curiosa", minBondDays: 50 },
  { id: "radiante", label: "Radiante", minBondDays: 70 },
  { id: "mítica", label: "Mítica", minBondDays: 100 },
  { id: "guardiana", label: "Guardiana", minBondDays: 200 },
] as const;

export type SocialSession = {
  userId: string;
  day: string;
  minutes: number;
  source: "timer" | "manual" | "import";
};

export type PetStage = (typeof PET_STAGES)[number]["id"];
export type PetMood = "dormida" | "esperando" | "feliz" | "recuperable" | "peligro" | "fallecida";
/** 0 intacto, 1 rajita, 2 grietas, 3 casi roto, 4 recién nacida entre las cáscaras. */
export type EggPhase = 0 | 1 | 2 | 3 | 4;

/** Estado individual de una criatura: cada una vive, muere y evoluciona por su cuenta. */
export type PetState = {
  kind: PetKind;
  alive: boolean;
  /** Día en el que nació o volvió como huevo: el vínculo se cuenta desde aquí. */
  bornDay: string;
  diedDay: string | null;
  /** Día en que una criatura caída vuelve como huevo si nadie la revive antes. */
  rebirthDay: string | null;
  /** Días que faltan para ese huevo contados desde hoy; 1 significa mañana. */
  rebirthInDays: number | null;
  bondDays: number;
  stage: PetStage;
  mood: PetMood;
  /** Fase del huevo durante los primeros días de vínculo; null cuando ya es criatura. */
  eggPhase: EggPhase | null;
};

export type GardenLife = {
  pets: PetState[];
  /** Ánimo compartido por las criaturas vivas. */
  mood: PetMood;
  /** Vínculo de la criatura viva más veterana. */
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

type LifeEvent = { day: string; type: "death" | "revival" };

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

/** Los primeros EGG_DAYS días de vínculo la criatura nace: día 1 huevo intacto, día 5 recién salida. */
export function eggPhaseForBond(bondDays: number): EggPhase | null {
  if (bondDays > EGG_DAYS) return null;
  return Math.max(0, Math.min(EGG_DAYS - 1, bondDays - 1)) as EggPhase;
}

/** Orden estable en el que caen las criaturas de un jardín concreto. */
export function petKindOrder(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const offset = hash % PET_KINDS.length;
  return [...PET_KINDS.slice(offset), ...PET_KINDS.slice(0, offset)];
}

export function computeGardenLife({
  sessions,
  ownerIds,
  hatchedDay,
  todayDay,
  seed = hatchedDay,
}: {
  sessions: SocialSession[];
  ownerIds: [string, string];
  hatchedDay: string;
  todayDay: string;
  seed?: string;
}): GardenLife {
  const perOwner = ownerIds.map((ownerId) => ({
    ownerId,
    ...incidentsForUser(sessions, ownerId, hatchedDay, todayDay),
  }));

  const candidates = perOwner
    .flatMap(({ ownerId, missed }) => missed.map((incident) => ({ ownerId, ...incident })))
    .filter((incident) => incident.rescuedBy === null)
    .sort((left, right) => left.day.localeCompare(right.day));
  const revivedIncidents = new Set<(typeof candidates)[number]>();
  const revivalDays: string[] = [];
  const rescueSessions = sessions
    .map((session, index) => ({ session, index }))
    .filter(({ session }) => ownerIds.includes(session.userId) && session.source === "timer" && session.minutes >= PET_RESCUE_MINUTES)
    .sort((left, right) => left.session.day.localeCompare(right.session.day) || left.index - right.index);

  for (const { session } of rescueSessions) {
    // La criatura cae el día siguiente al plazo y espera PET_REVIVE_DAYS días a los 60 min.
    const fallen = candidates.find(
      (incident) =>
        incident.rescuedBy === null
        && !revivedIncidents.has(incident)
        && incident.rescueDeadline < session.day
        && session.day <= addDays(incident.rescueDeadline, PET_REVIVE_DAYS),
    );
    if (fallen) {
      revivedIncidents.add(fallen);
      revivalDays.push(session.day);
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
  const fatalIncidents = candidates.filter(
    (incident) => incident.rescuedBy === null && incident.rescueDeadline < todayDay,
  );
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

  const bondedDays = dayRange(hatchedDay, todayDay).filter((day) =>
    protectedByOwner.every(({ protectedDays }) => protectedDays.has(day)),
  );

  // Cada muerte se lleva a la primera criatura viva del orden. Un rescate de 60 min
  // dentro de los PET_REVIVE_DAYS siguientes devuelve a la última que cayó con su
  // vínculo intacto; si nadie la revive, vuelve sola como huevo y empieza de cero.
  const events: LifeEvent[] = [
    ...fatalIncidents.map((incident) => ({ day: addDays(incident.rescueDeadline, 1), type: "death" as const })),
    ...revivalDays.map((day) => ({ day, type: "revival" as const })),
  ].sort((left, right) => left.day.localeCompare(right.day) || (left.type === "death" ? -1 : 1));

  const timeline = petKindOrder(seed).map((kind) => ({
    kind,
    alive: true,
    bornDay: hatchedDay,
    diedDay: null as string | null,
  }));
  const rebirthDayOf = (diedDay: string) => addDays(diedDay, PET_REVIVE_DAYS);
  const hatchFallenBefore = (day: string) => {
    for (const pet of timeline) {
      if (pet.alive || pet.diedDay === null) continue;
      const rebirthDay = rebirthDayOf(pet.diedDay);
      if (rebirthDay >= day) continue;
      pet.alive = true;
      pet.bornDay = rebirthDay;
      pet.diedDay = null;
    }
  };

  for (const event of events) {
    hatchFallenBefore(event.day);
    if (event.type === "death") {
      const victim = timeline.find((pet) => pet.alive);
      if (!victim) continue;
      victim.alive = false;
      victim.diedDay = event.day;
      continue;
    }
    const revived = timeline
      .filter((pet) => !pet.alive && pet.diedDay !== null && event.day < rebirthDayOf(pet.diedDay))
      .sort((left, right) => (right.diedDay ?? "").localeCompare(left.diedDay ?? ""))[0];
    if (!revived) continue;
    revived.alive = true;
    revived.diedDay = null;
  }
  hatchFallenBefore(addDays(todayDay, 1));
  const fallenCount = timeline.filter((pet) => !pet.alive).length;

  const mood: PetMood = danger
    ? "peligro"
    : grace
      ? "recuperable"
      : ownersDoneToday.length === 2
        ? "feliz"
        : ownersDoneToday.length === 1
          ? "esperando"
          : "dormida";

  const daysUntil = (day: string) =>
    Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${todayDay}T00:00:00Z`)) / 86_400_000);

  const pets: PetState[] = timeline.map((pet) => {
    if (!pet.alive) {
      const rebirthDay = rebirthDayOf(pet.diedDay ?? todayDay);
      return {
        ...pet,
        rebirthDay,
        rebirthInDays: Math.max(1, daysUntil(rebirthDay)),
        bondDays: 0,
        stage: "origen" as PetStage,
        mood: "fallecida" as PetMood,
        eggPhase: null,
      };
    }
    const bondDays = bondedDays.filter((day) => day >= pet.bornDay).length;
    return {
      ...pet,
      rebirthDay: null,
      rebirthInDays: null,
      bondDays,
      stage: petStageForBond(bondDays),
      mood,
      eggPhase: eggPhaseForBond(bondDays),
    };
  });

  const rescueDaysLeft = danger ? Math.max(0, daysUntil(danger.rescueDeadline)) : grace ? PET_RESCUE_DAYS : null;

  return {
    pets,
    mood,
    bondDays: pets.reduce((best, pet) => (pet.alive ? Math.max(best, pet.bondDays) : best), 0),
    ownersDoneToday,
    endangeredUserId: danger?.ownerId ?? grace?.ownerId ?? null,
    rescueDeadline: danger?.rescueDeadline ?? grace?.rescueDeadline ?? null,
    rescueDaysLeft,
    fallenCount,
  };
}
