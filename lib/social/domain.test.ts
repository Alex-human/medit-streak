import { describe, expect, it } from "vitest";
import { addDays } from "../dates";
import { ANCESTRAL_DAY, EGG_DAYS, PET_STAGES, choiceMilestones, computePetLife, petStageForBond, type SocialSession } from "./domain";
import { dueChoices, equippedItems, identityOf, itemsForPick, ownedItems, pendingOrders, wornOn, type ChoiceRow } from "./catalog";

const owners: [string, string] = ["alex", "amiga"];
/** Día n del calendario de pruebas: D(1) = 2026-01-01. */
const D = (n: number) => addDays("2026-01-01", n - 1);

function session(userId: string, day: string, minutes = 10, source: SocialSession["source"] = "timer"): SocialSession {
  return { userId, day, minutes, source };
}

/** Los dos apuntan 10 min a mano cada día de 1 a `days`, salvo los días que cada uno falla: solo el cronómetro rescata. */
function daily(days: number, skip: { alex?: number[]; amiga?: number[] } = {}) {
  const sessions: SocialSession[] = [];
  for (let n = 1; n <= days; n += 1) {
    if (!skip.alex?.includes(n)) sessions.push(session("alex", D(n), 10, "manual"));
    if (!skip.amiga?.includes(n)) sessions.push(session("amiga", D(n), 10, "manual"));
  }
  return sessions;
}

/** Como en la app, el cálculo solo ve las sesiones hasta hoy. */
function life(sessions: SocialSession[], today: number, identityDay: number | null = 4) {
  const known = sessions.filter((item) => item.day <= D(today));
  return computePetLife({ sessions: known, ownerIds: owners, startDay: D(1), identityDay: identityDay === null ? null : D(identityDay), todayDay: D(today) });
}

describe("egg", () => {
  it("cracks a little more each bond day and asks for the identity on day four", () => {
    const sessions = daily(10);
    expect(life(sessions, 1, null)).toMatchObject({ phase: "egg", bondDays: 1, eggPhase: 0, identityDue: false });
    expect(life(sessions, 2, null).eggPhase).toBe(1);
    expect(life(sessions, 3, null).eggPhase).toBe(2);
    expect(life(sessions, 4, null)).toMatchObject({ eggPhase: 3, identityDue: true });
    expect(life(sessions, 5, null)).toMatchObject({ phase: "egg", eggPhase: 3, identityDue: true, milestones: [] });
    expect(life(sessions, 4)).toMatchObject({ eggPhase: 3, identityDue: false });
  });

  it("hatches on the fifth bond day once the identity is agreed", () => {
    const sessions = daily(12);
    expect(life(sessions, 5)).toMatchObject({ phase: "alive", hatchDay: D(5), eggPhase: 4, stage: "bebe", bondDays: 5, mood: "feliz" });
    expect(life(sessions, 6).eggPhase).toBeNull();
    expect(life(sessions, 7, 7)).toMatchObject({ phase: "alive", hatchDay: D(7), eggPhase: 4, bondDays: 7 });
    expect(life(sessions, 12)).toMatchObject({ stage: "cria", milestones: [{ day: 8, pick: "objeto" }] });
    expect(life(sessions, 12).history).toEqual([
      { life: 1, stage: "bebe", day: D(5) },
      { life: 1, stage: "cria", day: D(12) },
    ]);
  });

  it("cannot go back while it is an egg: missed days only delay the hatching", () => {
    const sessions = daily(20, { alex: [2, 3] });
    expect(life(sessions, 6)).toMatchObject({ phase: "egg", bondDays: 4 });
    expect(life(sessions, 7)).toMatchObject({ phase: "alive", hatchDay: D(7), bondDays: 5 });
    expect(life(sessions, 15)).toMatchObject({ phase: "alive", life: 1, mood: "feliz", bondDays: 13, alerts: [] });
  });

  it("counts a missed egg day once the owner rescues it with the timer", () => {
    const sessions = [...daily(20, { alex: [2] }), session("alex", D(3), 10)];
    expect(life(sessions, 5)).toMatchObject({ phase: "alive", bondDays: 5 });
  });

  it("hatches on the day the fifth bond day is known, never backwards", () => {
    const sessions = [...daily(20, { alex: [5], amiga: [6] }), session("alex", D(7), 15)];
    expect(life(sessions, 6)).toMatchObject({ phase: "egg", bondDays: 4 });
    expect(life(sessions, 7)).toMatchObject({ phase: "alive", hatchDay: D(7), eggPhase: 4, bondDays: 6, alerts: [] });
  });
});

describe("rescue ladder", () => {
  const missed = daily(60, { alex: [8] });

  it("asks 10, 15, 20 and 30 minutes on the four days after the missed day, then goes back to the egg", () => {
    expect(life(missed, 9)).toMatchObject({ mood: "recuperable", alerts: [{ userId: "alex", minutes: 10, daysLeft: 3 }] });
    expect(life(missed, 10)).toMatchObject({ mood: "peligro", alerts: [{ userId: "alex", minutes: 15, daysLeft: 2 }] });
    expect(life(missed, 11).alerts).toEqual([{ userId: "alex", minutes: 20, daysLeft: 1 }]);
    expect(life(missed, 12).alerts).toEqual([{ userId: "alex", minutes: 30, daysLeft: 0 }]);
    expect(life(missed, 13)).toMatchObject({ phase: "egg", life: 2, bornDay: D(13), bondDays: 1, eggPhase: 0, identityDue: false, alerts: [] });
    expect(life(missed, 17)).toMatchObject({ phase: "alive", life: 2, hatchDay: D(17), eggPhase: 4, stage: "bebe" });
  });

  it("rescues with that day's minutes and the missed day counts for the bond", () => {
    expect(life([...missed, session("alex", D(9), 10)], 9)).toMatchObject({ mood: "feliz", bondDays: 9, alerts: [] });
    expect(life([...missed, session("alex", D(11), 15)], 11).alerts).toEqual([{ userId: "alex", minutes: 20, daysLeft: 1 }]);
    expect(life([...missed, session("alex", D(11), 20)], 20)).toMatchObject({ phase: "alive", life: 1, bondDays: 20, alerts: [] });
    expect(life([...missed, session("alex", D(12), 30)], 13)).toMatchObject({ phase: "alive", life: 1, bondDays: 13 });
  });

  it("only counts the timer minutes of the owner who missed", () => {
    expect(life([...missed, session("amiga", D(9), 30)], 9).alerts).toEqual([{ userId: "alex", minutes: 10, daysLeft: 3 }]);
    expect(life([...missed, session("alex", D(9), 30, "manual")], 9).alerts).toEqual([{ userId: "alex", minutes: 10, daysLeft: 3 }]);
  });

  it("lets one session cover several missed days in a row", () => {
    const twice = daily(60, { alex: [8, 9] });
    expect(life([...twice, session("alex", D(10), 15)], 10)).toMatchObject({ mood: "feliz", bondDays: 10, alerts: [] });
    expect(life([...twice, session("alex", D(10), 10)], 10).alerts).toEqual([{ userId: "alex", minutes: 15, daysLeft: 2 }]);
  });

  it("gives each owner their own minutes and goes back to the egg once when both miss", () => {
    expect(life(daily(60, { alex: [8], amiga: [9] }), 10)).toMatchObject({
      mood: "peligro",
      alerts: [{ userId: "alex", minutes: 15, daysLeft: 2 }, { userId: "amiga", minutes: 10, daysLeft: 3 }],
    });
    const both = daily(60, { alex: [8], amiga: [8] });
    expect(life(both, 10).alerts).toEqual([{ userId: "alex", minutes: 15, daysLeft: 2 }, { userId: "amiga", minutes: 15, daysLeft: 2 }]);
    expect(life(both, 13)).toMatchObject({ phase: "egg", life: 2 });
    expect(life(both, 20)).toMatchObject({ phase: "alive", life: 2 });
  });

  it("does not open new dangers for days missed while it is an egg again", () => {
    const sessions = daily(60, { alex: [8, 14, 15] });
    expect(life(sessions, 13)).toMatchObject({ phase: "egg", life: 2 });
    expect(life(sessions, 20)).toMatchObject({ phase: "alive", life: 2, hatchDay: D(19), bondDays: 6, alerts: [] });
  });

  it("keeps the ancestral aura after going back to the egg", () => {
    const year = daily(380, { alex: [375] });
    expect(life(year, 370)).toMatchObject({ ancestral: true, stage: "eterna" });
    expect(life(year, 380)).toMatchObject({ phase: "egg", life: 2, ancestral: true });
  });
});

describe("stages and milestones", () => {
  it("uses the twelve body thresholds", () => {
    expect(PET_STAGES.map((stage) => petStageForBond(stage.minBondDays))).toEqual(PET_STAGES.map((stage) => stage.id));
    expect(petStageForBond(11)).toBe("bebe");
    expect(petStageForBond(304)).toBe("celestial");
    expect(petStageForBond(1000)).toBe("eterna");
  });

  it("keeps the dense first month and cycles the picks", () => {
    expect(choiceMilestones(7)).toEqual([]);
    expect(choiceMilestones(30)).toEqual([
      { day: 8, pick: "objeto" },
      { day: 16, pick: "objeto" },
      { day: 20, pick: "rasgo" },
      { day: 30, pick: "libre" },
    ]);
    expect(choiceMilestones(400).map((milestone) => milestone.day).filter((day) => day > ANCESTRAL_DAY)).toEqual([370, 381, 389, 394]);
  });

  it("changes something every 3 to 13 days, 8 on average after the first month", () => {
    const events = [EGG_DAYS, ...PET_STAGES.slice(1).map((stage) => stage.minBondDays), ...choiceMilestones(ANCESTRAL_DAY).map((milestone) => milestone.day), ANCESTRAL_DAY]
      .sort((left, right) => left - right);
    expect(new Set(events).size).toBe(events.length);
    const gaps = events.slice(1).map((day, index) => day - events[index]);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(3);
    expect(Math.max(...gaps)).toBeLessThanOrEqual(13);
    const later = events.filter((day) => day >= 30);
    const average = (later[later.length - 1] - later[0]) / (later.length - 1);
    expect(average).toBeGreaterThan(7.5);
    expect(average).toBeLessThan(8.5);
  });
});

describe("shared choices", () => {
  const row = (overrides: Partial<ChoiceRow>): ChoiceRow => ({
    id: "row",
    pet_id: "pet",
    life: 1,
    milestone_day: 8,
    payload: { item: "mala" },
    proposed_by: "alex",
    proposed_at: "2026-01-08T10:00:00Z",
    confirmed_by: "amiga",
    confirmed_at: "2026-01-08T11:00:00Z",
    ...overrides,
  });

  it("reads the agreed identity and the owned items with their level from confirmed rows only", () => {
    const choices = [
      row({ milestone_day: 5, payload: { name: "Brasa", element: "fuego" } }),
      row({ milestone_day: 8 }),
      row({ milestone_day: 16, payload: { item: "halo" }, confirmed_by: null, confirmed_at: null }),
      row({ milestone_day: 20, payload: { item: "no-existe" } }),
      row({ milestone_day: 30, payload: { order: "collar de dragón", item: "cola-llama" } }),
      row({ milestone_day: 38, payload: { order: "capa de estrellas" } }),
      row({ milestone_day: 46, confirmed_at: "2026-02-15T11:00:00Z" }),
    ];
    expect(identityOf(choices)?.identity).toEqual({ name: "Brasa", element: "fuego" });
    expect(ownedItems(choices).map((item) => [item.id, item.level])).toEqual([["mala", 2], ["cola-llama", 1]]);
    expect(pendingOrders(choices)).toHaveLength(1);
    expect(equippedItems({ cuello: "mala", cola: "estela-viento" }, ownedItems(choices)).map((item) => item.id)).toEqual(["mala"]);
  });

  it("offers each piece at the level it would reach and hides the celestial ones", () => {
    const owned = ownedItems([row({ id: "a" }), row({ id: "b" }), row({ id: "c" }), row({ id: "d", payload: { item: "halo" } })]);
    const offer = itemsForPick("objeto", owned);
    expect(offer.find((item) => item.id === "mala")).toBeUndefined();
    expect(offer.find((item) => item.id === "halo")?.level).toBe(2);
    expect(offer.find((item) => item.id === "zafu")?.level).toBe(1);
    expect(offer.every((item) => item.kind === "objeto")).toBe(true);
    expect(itemsForPick("libre", owned).some((item) => item.kind === "rasgo")).toBe(true);
  });

  it("dresses the album with the last piece confirmed in each slot up to that day, at its level then", () => {
    const choices = [
      row({ milestone_day: 8, payload: { item: "halo" }, proposed_at: "2026-01-08T10:00:00Z", confirmed_at: "2026-01-20T10:00:00Z" }),
      row({ milestone_day: 16, payload: { item: "loto" }, proposed_at: "2026-01-16T10:00:00Z", confirmed_at: "2026-01-16T11:00:00Z" }),
      row({ milestone_day: 20, payload: { item: "loto" }, proposed_at: "2026-01-21T10:00:00Z", confirmed_at: "2026-01-30T11:00:00Z" }),
      row({ milestone_day: 30, payload: { item: "gorro" }, confirmed_at: null, confirmed_by: null }),
    ];
    const worn = (day: string) => wornOn(choices, day).map((item) => [item.id, item.level]);
    expect(worn("2026-01-10")).toEqual([]);
    expect(worn("2026-01-18")).toEqual([["loto", 1]]);
    expect(worn("2026-01-25")).toEqual([["halo", 1]]);
    expect(worn("2026-02-05")).toEqual([["loto", 2]]);
  });

  it("opens the identity, keeps proposals pending and repeats milestones in each life", () => {
    const egg = life(daily(10), 4, null);
    expect(dueChoices(egg, [])).toEqual([{ milestone: { day: 5, pick: "identidad" }, row: null }]);

    const grown = life(daily(20), 16);
    const choices = [row({ milestone_day: 8 }), row({ milestone_day: 16, payload: { item: "halo" }, confirmed_by: null, confirmed_at: null })];
    expect(dueChoices(grown, choices)).toEqual([{ milestone: { day: 16, pick: "objeto" }, row: choices[1] }]);

    const secondLife = life(daily(40, { alex: [8] }), 20);
    expect(secondLife).toMatchObject({ life: 2, bondDays: 8 });
    expect(dueChoices(secondLife, choices)).toEqual([{ milestone: { day: 8, pick: "objeto" }, row: null }]);
  });
});
