import { addDays } from "../dates";

export const STREAK_RESCUE_MINUTES = 30;
export const PET_RESCUE_MINUTES = 60;
/** Días de peligro tras un día fallado antes de que la criatura caiga. */
export const PET_RESCUE_DAYS = 5;
/** Días que una criatura caída espera a que la revivan antes de volver como huevo. */
export const PET_REVIVE_DAYS = 4;
/** Días de vínculo que la criatura pasa dentro del huevo. */
export const EGG_DAYS = 5;
/** Vínculo que enciende el aura ancestral, que ya no se apaga ni al renacer. */
export const ANCESTRAL_DAY = 365;

export const PET_KINDS = ["fuego", "agua", "bosque", "nube"] as const;
export type PetKind = (typeof PET_KINDS)[number];

export const PET_DETAILS: Record<PetKind, { name: string; title: string }> = {
  fuego: { name: "Chispa", title: "Espíritu de fuego" },
  agua: { name: "Glú", title: "Gota de hielo" },
  bosque: { name: "Tilo", title: "Guardián del bosque" },
  nube: { name: "Nimbo", title: "Nube de los sueños" },
};

export const PET_STAGES = [
  { id: "bebe", label: "Bebé", minBondDays: 0 },
  { id: "cria", label: "Cría", minBondDays: 12 },
  { id: "joven", label: "Joven", minBondDays: 25 },
  { id: "adulta", label: "Adulta", minBondDays: 45 },
  { id: "radiante", label: "Radiante", minBondDays: 90 },
  { id: "guardiana", label: "Guardiana", minBondDays: 180 },
] as const;

export type PetStage = (typeof PET_STAGES)[number]["id"];
export type PetMood = "dormida" | "esperando" | "feliz" | "recuperable" | "peligro" | "fallecida";
export type PetPhase = "egg" | "alive" | "fallen";
/** Deberes de una persona para salvar a la mascota: 30 min de cronómetro hoy, o 60 min con los días que le quedan. */
export type PetAlert = { userId: string; minutes: 30 | 60; daysLeft: number };
/** 0 intacto, 1 rajita, 2 grietas, 3 casi roto, 4 recién nacida entre las cáscaras. */
export type EggPhase = 0 | 1 | 2 | 3 | 4;

export type ChoicePick = "objeto" | "rasgo" | "libre";
export type ChoiceMilestone = { day: number; pick: ChoicePick };

/** Hitos de elección por días de vínculo; después del año, uno cada 60 días. */
export const CHOICE_MILESTONES: ChoiceMilestone[] = [
  { day: 8, pick: "objeto" },
  { day: 16, pick: "objeto" },
  { day: 20, pick: "rasgo" },
  { day: 30, pick: "libre" },
  { day: 38, pick: "rasgo" },
  { day: 55, pick: "libre" },
  { day: 70, pick: "rasgo" },
  { day: 110, pick: "libre" },
  { day: 140, pick: "libre" },
  { day: 220, pick: "libre" },
  { day: 270, pick: "libre" },
  { day: 365, pick: "libre" },
];
const LATE_CHOICE_EVERY = 60;

export type SocialSession = {
  userId: string;
  day: string;
  minutes: number;
  source: "timer" | "manual" | "import";
};

export type PetLife = {
  phase: PetPhase;
  /** Vida actual: cada renacer suma una. */
  life: number;
  /** Día en que empezó el huevo de esta vida: el vínculo se cuenta desde aquí. */
  bornDay: string;
  hatchDay: string | null;
  diedDay: string | null;
  /** Días que faltan para que la criatura caída vuelva como huevo; 1 significa mañana. */
  rebirthInDays: number | null;
  bondDays: number;
  stage: PetStage;
  eggPhase: EggPhase | null;
  mood: PetMood;
  /** El huevo ya pide nombre y elemento. */
  identityDue: boolean;
  /** Hitos de elección alcanzados en esta vida. */
  milestones: ChoiceMilestone[];
  ancestral: boolean;
  ownersDoneToday: string[];
  alerts: PetAlert[];
  /** Álbum: día en que la criatura alcanzó cada etapa, vida a vida. */
  history: { life: number; stage: PetStage; day: string }[];
};

function dayRange(start: string, end: string) {
  const days: string[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) days.push(day);
  return days;
}

function totalsByDay(sessions: SocialSession[], userId: string, source?: SocialSession["source"]) {
  return sessions.reduce<Record<string, number>>((totals, session) => {
    if (session.userId !== userId || (source && session.source !== source)) return totals;
    totals[session.day] = (totals[session.day] ?? 0) + session.minutes;
    return totals;
  }, {});
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function petStageForBond(bondDays: number): PetStage {
  return [...PET_STAGES].reverse().find((stage) => bondDays >= stage.minBondDays)?.id ?? "bebe";
}

export function choiceMilestones(bondDays: number): ChoiceMilestone[] {
  const reached = CHOICE_MILESTONES.filter((milestone) => milestone.day <= bondDays);
  for (let day = ANCESTRAL_DAY + LATE_CHOICE_EVERY; day <= bondDays; day += LATE_CHOICE_EVERY) {
    reached.push({ day, pick: "libre" });
  }
  return reached;
}

type Incident = { owner: number; day: string; deadline: string; rescued: boolean };
type Chapter = { life: number; bornDay: string; hatchDay: string | null; endDay: string };

/**
 * Recorre día a día la vida de la mascota compartida. Un día fallado queda a salvo con
 * 30 min de cronómetro al día siguiente; si no, abre PET_RESCUE_DAYS días de peligro que
 * cierran 60 min de cronómetro de quien falló. Sin rescate la criatura cae, y tiene
 * PET_REVIVE_DAYS días para que 60 min de cualquiera la devuelvan con su vínculo intacto;
 * pasado el plazo vuelve como huevo con la misma identidad. El huevo y la criatura caída
 * no acumulan peligro: sus días fallados solo dejan de sumar vínculo.
 */
export function computePetLife({
  sessions,
  ownerIds,
  startDay,
  identityDay,
  todayDay,
}: {
  sessions: SocialSession[];
  ownerIds: [string, string];
  startDay: string;
  /** Día en que los dos acordaron nombre y elemento; sin él el huevo no rompe. */
  identityDay: string | null;
  todayDay: string;
}): PetLife {
  const totals = ownerIds.map((id) => totalsByDay(sessions, id));
  const timer = ownerIds.map((id) => totalsByDay(sessions, id, "timer"));
  const safe = (owner: number, day: string) =>
    (totals[owner][day] ?? 0) > 0 || (timer[owner][addDays(day, 1)] ?? 0) >= STREAK_RESCUE_MINUTES;
  const rescuedDays = ownerIds.map(() => new Set<string>());
  const bonded = (day: string) => ownerIds.every((_, owner) => safe(owner, day) || rescuedDays[owner].has(day));

  let phase: PetPhase = "egg";
  let life = 1;
  let bornDay = startDay;
  let hatchDay: string | null = null;
  let diedDay: string | null = null;
  let incidents: Incident[] = [];
  let aliveYesterday = false;
  const chapters: Chapter[] = [];

  for (const day of dayRange(startDay, todayDay)) {
    const yesterday = addDays(day, -1);
    const rescuers = ownerIds.flatMap((_, owner) => ((timer[owner][day] ?? 0) >= PET_RESCUE_MINUTES ? [owner] : []));

    if (phase === "fallen" && diedDay !== null && day >= addDays(diedDay, PET_REVIVE_DAYS)) {
      chapters.push({ life, bornDay, hatchDay, endDay: diedDay });
      phase = "egg";
      life += 1;
      bornDay = day;
      hatchDay = null;
      diedDay = null;
    }
    if (phase === "egg" && identityDay !== null && identityDay <= day && dayRange(bornDay, day).filter(bonded).length >= EGG_DAYS) {
      phase = "alive";
      hatchDay = day;
    }
    if (phase === "alive" && incidents.some((incident) => !incident.rescued && incident.deadline < day)) {
      phase = "fallen";
      diedDay = day;
      incidents = [];
    }
    if (phase === "fallen" && diedDay !== null && rescuers.length > 0 && day < addDays(diedDay, PET_REVIVE_DAYS)) {
      phase = "alive";
      diedDay = null;
    }
    if (phase === "alive") {
      if (aliveYesterday) {
        ownerIds.forEach((_, owner) => {
          if (!safe(owner, yesterday)) {
            incidents.push({ owner, day: yesterday, deadline: addDays(yesterday, PET_RESCUE_DAYS + 1), rescued: false });
          }
        });
      }
      for (const owner of rescuers) {
        const target = incidents.find(
          (incident) => incident.owner === owner && !incident.rescued && day >= addDays(incident.day, 2) && day <= incident.deadline,
        );
        if (target) {
          target.rescued = true;
          rescuedDays[owner].add(target.day);
        }
      }
    }
    aliveYesterday = phase === "alive";
  }
  chapters.push({ life, bornDay, hatchDay, endDay: todayDay });

  const bondDays = dayRange(bornDay, todayDay).filter(bonded).length;
  const history: PetLife["history"] = [];
  let ancestral = false;
  for (const chapter of chapters) {
    let bond = 0;
    for (const day of dayRange(chapter.bornDay, chapter.endDay)) {
      if (bonded(day)) bond += 1;
      if (chapter.hatchDay === null || day < chapter.hatchDay) continue;
      for (const stage of PET_STAGES) {
        if (bond >= stage.minBondDays && !history.some((entry) => entry.life === chapter.life && entry.stage === stage.id)) {
          history.push({ life: chapter.life, stage: stage.id, day });
        }
      }
    }
    if (bond >= ANCESTRAL_DAY) ancestral = true;
  }

  // Un incidente abierto está en su día de gracia (m+1, 30 min) o en peligro (m+2 a m+6, 60 min).
  const open = incidents.filter((incident) => !incident.rescued);
  const alerts = ownerIds.flatMap((userId, owner): PetAlert[] => {
    const danger = open.filter((incident) => incident.owner === owner && todayDay >= addDays(incident.day, 2));
    if (danger.length > 0) return [{ userId, minutes: 60, daysLeft: Math.min(...danger.map((incident) => daysBetween(todayDay, incident.deadline))) }];
    return open.some((incident) => incident.owner === owner) ? [{ userId, minutes: 30, daysLeft: 0 }] : [];
  });
  const ownersDoneToday = ownerIds.filter((_, owner) => (totals[owner][todayDay] ?? 0) > 0);
  const mood: PetMood = phase === "fallen"
    ? "fallecida"
    : alerts.some((alert) => alert.minutes === 60)
      ? "peligro"
      : alerts.length > 0
        ? "recuperable"
        : ownersDoneToday.length === 2
          ? "feliz"
          : ownersDoneToday.length === 1
            ? "esperando"
            : "dormida";
  const eggPhase: EggPhase | null = phase === "egg"
    ? (Math.min(3, Math.max(0, bondDays - 1)) as EggPhase)
    : phase === "alive" && hatchDay === todayDay
      ? 4
      : null;
  return {
    phase,
    life,
    bornDay,
    hatchDay,
    diedDay,
    rebirthInDays: diedDay !== null ? Math.max(1, daysBetween(todayDay, addDays(diedDay, PET_REVIVE_DAYS))) : null,
    bondDays,
    stage: phase === "egg" ? "bebe" : petStageForBond(bondDays),
    eggPhase,
    mood,
    identityDue: phase === "egg" && identityDay === null && bondDays >= EGG_DAYS - 1,
    milestones: phase === "alive" ? choiceMilestones(bondDays) : [],
    ancestral,
    ownersDoneToday,
    alerts,
    history,
  };
}
