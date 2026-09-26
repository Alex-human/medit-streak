import { addDays } from "../dates";
import { RESCUE_LADDER, isRescued, oldestOpenRescue } from "../rescue";

/** Días de vínculo que la criatura pasa dentro del huevo. */
export const EGG_DAYS = 5;
/** Vínculo que enciende el aura ancestral, que ya no se apaga ni al volver al huevo. */
export const ANCESTRAL_DAY = 365;

export const PET_KINDS = ["fuego", "agua", "bosque", "nube"] as const;
export type PetKind = (typeof PET_KINDS)[number];

export const PET_DETAILS: Record<PetKind, { name: string; title: string }> = {
  fuego: { name: "Chispa", title: "Espíritu de fuego" },
  agua: { name: "Glú", title: "Gota de hielo" },
  bosque: { name: "Tilo", title: "Guardián del bosque" },
  nube: { name: "Nimbo", title: "Nube de los sueños" },
};

/** Doce formas por elemento: las seis últimas son criaturas nuevas y la Eterna, una forma completamente distinta. */
export const PET_STAGES = [
  { id: "bebe", label: "Bebé", minBondDays: 0 },
  { id: "cria", label: "Cría", minBondDays: 12 },
  { id: "joven", label: "Joven", minBondDays: 25 },
  { id: "adulta", label: "Adulta", minBondDays: 40 },
  { id: "radiante", label: "Radiante", minBondDays: 58 },
  { id: "guardiana", label: "Guardiana", minBondDays: 80 },
  { id: "sabia", label: "Sabia", minBondDays: 105 },
  { id: "heroica", label: "Heroica", minBondDays: 135 },
  { id: "legendaria", label: "Legendaria", minBondDays: 170 },
  { id: "mitica", label: "Mítica", minBondDays: 210 },
  { id: "celestial", label: "Celestial", minBondDays: 255 },
  { id: "eterna", label: "Eterna", minBondDays: 305 },
] as const;

export type PetStage = (typeof PET_STAGES)[number]["id"];
export type PetMood = "dormida" | "esperando" | "feliz" | "recuperable" | "peligro";
export type PetPhase = "egg" | "alive";
/** Deberes de una persona hoy: minutos de cronómetro que recuperan su día fallado más antiguo y días que le quedan después de hoy. */
export type PetAlert = { userId: string; minutes: number; daysLeft: number };
/** 0 intacto, 1 rajita, 2 grietas, 3 casi roto, 4 recién nacida entre las cáscaras. */
export type EggPhase = 0 | 1 | 2 | 3 | 4;

export type ChoicePick = "objeto" | "rasgo" | "libre";
export type ChoiceMilestone = { day: number; pick: ChoicePick };

/**
 * Días de vínculo con elección. Con las evoluciones forman un cambio cada 3 a 13 días: el primer
 * mes es denso y desde el día 30 la media es de 8. Pasado el año, una elección cada 5, 11 u 8 días.
 */
const CHOICE_DAYS = [
  8, 16, 20, 30, 46, 61, 71, 88, 94, 110, 122, 127, 144, 148, 159, 175, 185, 193,
  199, 213, 224, 230, 239, 247, 262, 266, 277, 284, 296, 309, 320, 326, 331, 343, 350, 357,
];
const LATE_CHOICE_GAPS = [5, 11, 8];
const PICK_CYCLE: ChoicePick[] = ["objeto", "objeto", "rasgo", "libre"];

export type SocialSession = {
  userId: string;
  day: string;
  minutes: number;
  source: "timer" | "manual" | "import";
};

export type PetLife = {
  phase: PetPhase;
  /** Vida actual: cada vuelta al huevo suma una. */
  life: number;
  /** Día en que empezó el huevo de esta vida: el vínculo se cuenta desde aquí. */
  bornDay: string;
  hatchDay: string | null;
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

export function petStageForBond(bondDays: number): PetStage {
  return [...PET_STAGES].reverse().find((stage) => bondDays >= stage.minBondDays)?.id ?? "bebe";
}

export function choiceMilestones(bondDays: number): ChoiceMilestone[] {
  const days = CHOICE_DAYS.filter((day) => day <= bondDays);
  for (let step = 0, day = ANCESTRAL_DAY + LATE_CHOICE_GAPS[0]; day <= bondDays; step += 1, day += LATE_CHOICE_GAPS[step % LATE_CHOICE_GAPS.length]) {
    days.push(day);
  }
  return days.map((day, index) => ({ day, pick: PICK_CYCLE[index % PICK_CYCLE.length] }));
}

type Chapter = { life: number; bornDay: string; hatchDay: string | null; endDay: string };

/**
 * Recorre día a día la vida de la mascota compartida. Un día fallado se recupera con la escalera
 * de cronómetro de quien falló (10, 15, 20 y 30 min los cuatro días siguientes) y cuenta como día
 * de vínculo. Si la criatura estaba viva y el día no se recupera, al quinto día vuelve al huevo con
 * la misma identidad y empieza de cero. El huevo no corre peligro: sus días fallados solo retrasan
 * que nazca.
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
  const safe = (owner: number, day: string, asOf?: string) => (totals[owner][day] ?? 0) > 0 || isRescued(day, timer[owner], asOf);
  const bonded = (day: string, asOf?: string) => ownerIds.every((_, owner) => safe(owner, day, asOf));

  let phase: PetPhase = "egg";
  let life = 1;
  let bornDay = startDay;
  let hatchDay: string | null = null;
  const chapters: Chapter[] = [];

  for (const day of dayRange(startDay, todayDay)) {
    const lostDay = addDays(day, -(RESCUE_LADDER.length + 1));
    if (hatchDay !== null && lostDay >= hatchDay && !bonded(lostDay)) {
      chapters.push({ life, bornDay, hatchDay, endDay: addDays(day, -1) });
      phase = "egg";
      life += 1;
      bornDay = day;
      hatchDay = null;
    }
    // Nace el día en que se sabe su quinto día de vínculo: un rescate posterior no la hace nacer hacia atrás.
    if (phase === "egg" && identityDay !== null && identityDay <= day && dayRange(bornDay, day).filter((bondDay) => bonded(bondDay, day)).length >= EGG_DAYS) {
      phase = "alive";
      hatchDay = day;
    }
  }
  chapters.push({ life, bornDay, hatchDay, endDay: todayDay });

  const bondDays = dayRange(bornDay, todayDay).filter((day) => bonded(day)).length;
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

  // Cada persona ve el día fallado más antiguo que aún puede recuperar: es el que más minutos pide y arrastra a los demás.
  const alerts = ownerIds.flatMap((userId, owner): PetAlert[] => {
    const rescue = oldestOpenRescue(todayDay, (day) => hatchDay !== null && day >= hatchDay && !safe(owner, day));
    return rescue ? [{ userId, ...rescue }] : [];
  });
  const ownersDoneToday = ownerIds.filter((_, owner) => (totals[owner][todayDay] ?? 0) > 0);
  const mood: PetMood = alerts.some((alert) => alert.minutes > RESCUE_LADDER[0])
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
    : hatchDay === todayDay
      ? 4
      : null;
  return {
    phase,
    life,
    bornDay,
    hatchDay,
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
