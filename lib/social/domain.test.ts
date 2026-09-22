import { describe, expect, it } from "vitest";
import { addDays } from "../dates";
import { choiceMilestones, computePetLife, petStageForBond, type SocialSession } from "./domain";
import { dueChoices, equippedItems, identityOf, ownedItems, pendingOrders, wornOn, type ChoiceRow } from "./catalog";

const owners: [string, string] = ["alex", "amiga"];
/** Día n del calendario de pruebas: D(1) = 2026-01-01. */
const D = (n: number) => addDays("2026-01-01", n - 1);

function session(userId: string, day: string, minutes = 10, source: SocialSession["source"] = "timer"): SocialSession {
  return { userId, day, minutes, source };
}

/** Los dos meditan 10 min cada día de 1 a `days`, salvo los días que cada uno falla. */
function daily(days: number, skip: { alex?: number[]; amiga?: number[] } = {}) {
  const sessions: SocialSession[] = [];
  for (let n = 1; n <= days; n += 1) {
    if (!skip.alex?.includes(n)) sessions.push(session("alex", D(n)));
    if (!skip.amiga?.includes(n)) sessions.push(session("amiga", D(n)));
  }
  return sessions;
}

function life(sessions: SocialSession[], today: number, identityDay: number | null = 4) {
  return computePetLife({ sessions, ownerIds: owners, startDay: D(1), identityDay: identityDay === null ? null : D(identityDay), todayDay: D(today) });
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

  it("cannot die: missed days only delay the hatching", () => {
    const sessions = daily(20, { alex: [2, 3] });
    expect(life(sessions, 6)).toMatchObject({ phase: "egg", bondDays: 4 });
    expect(life(sessions, 7)).toMatchObject({ phase: "alive", hatchDay: D(7), bondDays: 5 });
    expect(life(sessions, 15)).toMatchObject({ phase: "alive", mood: "feliz", bondDays: 13, rescueDaysLeft: null });
  });
});

describe("danger", () => {
  it("offers the 30 minute streak recovery the next day", () => {
    const missed = life(daily(20, { alex: [8] }), 9);
    expect(missed).toMatchObject({ mood: "recuperable", endangeredUserId: "alex", rescueDaysLeft: 5 });

    const saved = life([...daily(20, { alex: [8, 9] }), session("alex", D(9), 30)], 9);
    expect(saved).toMatchObject({ mood: "feliz", bondDays: 9, rescueDaysLeft: null });
  });

  it("enters danger for five days and one 60 minute session of the owner rescues the pet", () => {
    const danger = life(daily(20, { alex: [8] }), 10);
    expect(danger).toMatchObject({ mood: "peligro", rescueDaysLeft: 4 });
    expect(life(daily(20, { alex: [8] }), 14).rescueDaysLeft).toBe(0);

    const rescued = life([...daily(20, { alex: [8, 10] }), session("alex", D(10), 60)], 10);
    expect(rescued).toMatchObject({ mood: "feliz", bondDays: 10, rescueDaysLeft: null });

    const friendCannot = life([...daily(20, { alex: [8], amiga: [10] }), session("amiga", D(10), 60)], 10);
    expect(friendCannot.mood).toBe("peligro");
  });

  it("rescues one incident per 60 minute day, so two missed days keep the pet in danger", () => {
    const sessions = [...daily(20, { alex: [8, 9] }), session("alex", D(11), 60)];
    expect(life(sessions, 11)).toMatchObject({ mood: "peligro", endangeredUserId: "alex", rescueDaysLeft: 4, bondDays: 10 });
    expect(life(sessions, 16).phase).toBe("fallen");
  });

  it("opens the danger once when both owners miss the same day, and the pet falls once", () => {
    const sessions = daily(40, { alex: [8], amiga: [8] });
    expect(life(sessions, 10).mood).toBe("peligro");
    expect(life(sessions, 15)).toMatchObject({ phase: "fallen", life: 1, diedDay: D(15) });
    expect(life(sessions, 19)).toMatchObject({ phase: "egg", life: 2, bornDay: D(19) });
    expect(life(sessions, 23)).toMatchObject({ phase: "alive", life: 2, hatchDay: D(23) });
  });
});

describe("death, revival and rebirth", () => {
  const sessions = daily(40, { alex: [8] });

  it("falls after the deadline and comes back as an egg four days later with the same identity", () => {
    expect(life(sessions, 15)).toMatchObject({ phase: "fallen", mood: "fallecida", diedDay: D(15), rebirthInDays: 4, stage: "cria", milestones: [] });
    expect(life(sessions, 18).rebirthInDays).toBe(1);
    expect(life(sessions, 19)).toMatchObject({ phase: "egg", life: 2, bornDay: D(19), bondDays: 1, eggPhase: 0, identityDue: false });
    expect(life(sessions, 23)).toMatchObject({ phase: "alive", life: 2, hatchDay: D(23), eggPhase: 4, bondDays: 5 });
    expect(life(sessions, 23).history).toEqual([
      { life: 1, stage: "bebe", day: D(5) },
      { life: 1, stage: "cria", day: D(13) },
      { life: 2, stage: "bebe", day: D(23) },
    ]);
  });

  it("keeps the bond when 60 minutes of anyone arrive inside the four day window", () => {
    const revived = life([...sessions, session("amiga", D(17), 60)], 20);
    expect(revived).toMatchObject({ phase: "alive", life: 1, hatchDay: D(5), bondDays: 19, stage: "cria", mood: "feliz" });
    expect(life([...sessions, session("alex", D(18), 60)], 18).phase).toBe("alive");
    expect(life([...sessions, session("alex", D(19), 60)], 19)).toMatchObject({ phase: "egg", life: 2 });
  });

  it("comes back the same day it falls with 60 minutes of either owner", () => {
    expect(life([...sessions, session("amiga", D(15), 60)], 15)).toMatchObject({ phase: "alive", life: 1, diedDay: null, mood: "feliz" });
    expect(life([...sessions, session("alex", D(15), 60)], 15)).toMatchObject({ phase: "alive", life: 1, diedDay: null });
  });

  it("does not open new dangers for days missed while fallen", () => {
    const back = [...daily(40, { alex: [8, 16, 17] }), session("alex", D(18), 60)];
    expect(life(back, 19)).toMatchObject({ phase: "alive", mood: "feliz", rescueDaysLeft: null });
  });

  it("keeps the ancestral aura through a rebirth", () => {
    const year = daily(370);
    expect(life(year, 370)).toMatchObject({ ancestral: true, stage: "guardiana" });
    expect(life(year, 370).milestones.at(-1)).toEqual({ day: 365, pick: "libre" });
    expect(life(year, 377).mood).toBe("peligro");
    expect(life(year, 378).phase).toBe("fallen");
    expect(life(year, 382)).toMatchObject({ phase: "egg", life: 2, ancestral: true });
  });
});

describe("stages and milestones", () => {
  it("uses the six body thresholds", () => {
    expect(petStageForBond(0)).toBe("bebe");
    expect(petStageForBond(11)).toBe("bebe");
    expect(petStageForBond(12)).toBe("cria");
    expect(petStageForBond(25)).toBe("joven");
    expect(petStageForBond(45)).toBe("adulta");
    expect(petStageForBond(90)).toBe("radiante");
    expect(petStageForBond(180)).toBe("guardiana");
  });

  it("is dense in the first month and every 60 days after the first year", () => {
    expect(choiceMilestones(7)).toEqual([]);
    expect(choiceMilestones(30).map((milestone) => milestone.day)).toEqual([8, 16, 20, 30]);
    expect(choiceMilestones(485).map((milestone) => milestone.day).slice(-3)).toEqual([365, 425, 485]);
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

  it("reads the agreed identity and the owned items from confirmed rows only", () => {
    const choices = [
      row({ milestone_day: 5, payload: { name: "Brasa", element: "fuego" } }),
      row({ milestone_day: 8 }),
      row({ milestone_day: 16, payload: { item: "halo" }, confirmed_by: null, confirmed_at: null }),
      row({ milestone_day: 20, payload: { item: "no-existe" } }),
      row({ milestone_day: 30, payload: { order: "collar de dragón", item: "cola-llama" } }),
      row({ milestone_day: 38, payload: { order: "capa de estrellas" } }),
    ];
    expect(identityOf(choices)?.identity).toEqual({ name: "Brasa", element: "fuego" });
    expect(ownedItems(choices).map((item) => item.id)).toEqual(["mala", "cola-llama"]);
    expect(pendingOrders(choices)).toHaveLength(1);
    expect(equippedItems({ cuello: "mala", cola: "estela-viento" }, ownedItems(choices)).map((item) => item.id)).toEqual(["mala"]);
  });

  it("dresses the album with the last piece confirmed in each slot up to that day", () => {
    const choices = [
      row({ id: "halo", milestone_day: 8, payload: { item: "halo" }, proposed_at: "2026-01-08T10:00:00Z", confirmed_at: "2026-01-20T10:00:00Z" }),
      row({ id: "loto", milestone_day: 16, payload: { item: "loto" }, proposed_at: "2026-01-16T10:00:00Z", confirmed_at: "2026-01-16T11:00:00Z" }),
      row({ id: "mala", milestone_day: 30, payload: { item: "mala" }, proposed_at: "2026-01-30T10:00:00Z", confirmed_by: null, confirmed_at: null }),
    ];
    expect(wornOn(choices, "2026-01-10")).toEqual([]);
    expect(wornOn(choices, "2026-01-18").map((item) => item.id)).toEqual(["loto"]);
    expect(wornOn(choices, "2026-01-25").map((item) => item.id)).toEqual(["halo"]);
  });

  it("opens the identity, keeps proposals pending and repeats milestones in each life", () => {
    const egg = life(daily(10), 4, null);
    expect(dueChoices(egg, [])).toEqual([{ milestone: { day: 5, pick: "identidad" }, row: null }]);

    const grown = life(daily(20), 16);
    const choices = [row({ milestone_day: 8 }), row({ milestone_day: 16, payload: { item: "halo" }, confirmed_by: null, confirmed_at: null })];
    expect(dueChoices(grown, choices)).toEqual([{ milestone: { day: 16, pick: "objeto" }, row: choices[1] }]);

    const secondLife = life(daily(40, { alex: [8] }), 26);
    expect(secondLife).toMatchObject({ life: 2, bondDays: 8 });
    expect(dueChoices(secondLife, choices)).toEqual([{ milestone: { day: 8, pick: "objeto" }, row: null }]);
  });
});
