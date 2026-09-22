import { describe, expect, it } from "vitest";
import { computeGardenLife, eggPhaseForBond, petStageForBond, type SocialSession } from "./domain";

const owners: [string, string] = ["alex", "amiga"];

function session(userId: string, day: string, minutes = 10, source: SocialSession["source"] = "timer"): SocialSession {
  return { userId, day, minutes, source };
}

function livingCount(pets: { alive: boolean }[]) {
  return pets.filter((pet) => pet.alive).length;
}

describe("shared pet life", () => {
  it("wakes for one owner and becomes happy when both meditate", () => {
    const waiting = computeGardenLife({
      sessions: [session("alex", "2026-09-16")],
      ownerIds: owners,
      hatchedDay: "2026-09-16",
      todayDay: "2026-09-16",
    });
    const happy = computeGardenLife({
      sessions: [session("alex", "2026-09-16"), session("amiga", "2026-09-16")],
      ownerIds: owners,
      hatchedDay: "2026-09-16",
      todayDay: "2026-09-16",
    });

    expect(waiting.mood).toBe("esperando");
    expect(happy.mood).toBe("feliz");
    expect(happy.bondDays).toBe(1);
    expect(happy.pets).toHaveLength(4);
    expect(happy.pets.every((pet) => pet.alive && pet.bondDays === 1 && pet.eggPhase === 0)).toBe(true);
  });

  it("offers the existing 30 minute recovery on the next day", () => {
    const life = computeGardenLife({
      sessions: [
        session("alex", "2026-09-14"),
        session("amiga", "2026-09-14"),
        session("amiga", "2026-09-15"),
      ],
      ownerIds: owners,
      hatchedDay: "2026-09-14",
      todayDay: "2026-09-16",
    });

    expect(life.mood).toBe("recuperable");
    expect(life.endangeredUserId).toBe("alex");
  });

  it("a 30 minute timer session protects the missed day", () => {
    const life = computeGardenLife({
      sessions: [
        session("alex", "2026-09-14"),
        session("amiga", "2026-09-14"),
        session("amiga", "2026-09-15"),
        session("alex", "2026-09-16", 30),
        session("amiga", "2026-09-16"),
      ],
      ownerIds: owners,
      hatchedDay: "2026-09-14",
      todayDay: "2026-09-16",
    });

    expect(life.mood).toBe("feliz");
    expect(life.bondDays).toBe(3);
  });

  it("enters danger and one 60 minute session rescues the pet", () => {
    const base = [
      session("alex", "2026-09-14"),
      session("amiga", "2026-09-14"),
      session("amiga", "2026-09-15"),
      session("amiga", "2026-09-16"),
    ];
    const danger = computeGardenLife({
      sessions: base,
      ownerIds: owners,
      hatchedDay: "2026-09-14",
      todayDay: "2026-09-17",
    });
    const rescued = computeGardenLife({
      sessions: [...base, session("alex", "2026-09-17", 60)],
      ownerIds: owners,
      hatchedDay: "2026-09-14",
      todayDay: "2026-09-17",
    });

    expect(danger.mood).toBe("peligro");
    expect(danger.rescueDeadline).toBe("2026-09-21");
    expect(danger.pets.every((pet) => pet.alive)).toBe(true);
    expect(rescued.mood).toBe("esperando");
  });

  it("drops one creature per fatal streak incident and leaves the rest alive", () => {
    const sessions = [session("alex", "2026-09-14"), session("amiga", "2026-09-14")];
    const lastChance = computeGardenLife({
      sessions,
      ownerIds: owners,
      hatchedDay: "2026-09-14",
      todayDay: "2026-09-21",
    });
    const dead = computeGardenLife({
      sessions,
      ownerIds: owners,
      hatchedDay: "2026-09-14",
      todayDay: "2026-09-22",
    });

    expect(lastChance.mood).toBe("peligro");
    expect(dead.fallenCount).toBe(2);
    expect(livingCount(dead.pets)).toBe(2);
    expect(dead.pets.filter((pet) => !pet.alive).every((pet) => pet.mood === "fallecida")).toBe(true);
    expect(dead.pets.filter((pet) => pet.alive).every((pet) => pet.mood === "peligro")).toBe(true);
  });

  it("revives one fallen creature with each later 60 minute timer session", () => {
    const base = [session("alex", "2026-09-14"), session("amiga", "2026-09-14")];
    const fallen = computeGardenLife({ sessions: base, ownerIds: owners, hatchedDay: "2026-09-14", todayDay: "2026-09-22" });
    const revived = computeGardenLife({
      sessions: [...base, session("alex", "2026-09-22", 60)],
      ownerIds: owners,
      hatchedDay: "2026-09-14",
      todayDay: "2026-09-22",
    });

    expect(fallen.fallenCount).toBe(2);
    expect(revived.fallenCount).toBe(1);
    expect(livingCount(revived.pets)).toBe(3);
  });

  it("keeps the bond of a creature revived inside the four day window", () => {
    // amiga falla el 05: plazo 11, cae el 12 y puede revivir del 12 al 15.
    const days = Array.from({ length: 20 }, (_, index) => `2026-01-${String(index + 1).padStart(2, "0")}`);
    const sessions = days.flatMap((day) => [
      session("alex", day, day === "2026-01-15" ? 60 : 10),
      ...(day === "2026-01-05" ? [] : [session("amiga", day)]),
    ]);

    const life = computeGardenLife({
      sessions,
      ownerIds: owners,
      hatchedDay: "2026-01-01",
      todayDay: "2026-01-20",
    });

    expect(life.fallenCount).toBe(0);
    expect(life.pets.every((pet) => pet.bornDay === "2026-01-01" && pet.bondDays === 19 && pet.stage === "cría")).toBe(true);
  });

  it("gives four days to revive and then brings the creature back as an egg", () => {
    // alex falla el 05: plazo 11, cae el 12, huevo el 16 si nadie hace 60 min.
    const days = Array.from({ length: 21 }, (_, index) => `2026-09-${String(index + 1).padStart(2, "0")}`);
    const sessions = days.flatMap((day) => [
      ...(day === "2026-09-05" ? [] : [session("alex", day)]),
      session("amiga", day),
    ]);
    const at = (todayDay: string) => computeGardenLife({ sessions, ownerIds: owners, hatchedDay: "2026-09-01", todayDay });

    const fallen = at("2026-09-12");
    const lastChance = at("2026-09-15");
    const reborn = at("2026-09-16");
    const hatching = at("2026-09-20");
    const hatched = at("2026-09-21");

    expect(fallen.fallenCount).toBe(1);
    expect(fallen.pets.find((pet) => !pet.alive)).toMatchObject({ diedDay: "2026-09-12", rebirthDay: "2026-09-16", rebirthInDays: 4, eggPhase: null });
    expect(lastChance.fallenCount).toBe(1);
    expect(lastChance.pets.find((pet) => !pet.alive)?.rebirthInDays).toBe(1);

    expect(reborn.fallenCount).toBe(0);
    const egg = reborn.pets.find((pet) => pet.bornDay === "2026-09-16");
    expect(egg).toMatchObject({ alive: true, bondDays: 1, stage: "origen", eggPhase: 0, rebirthDay: null });
    expect(reborn.pets.filter((pet) => pet.bornDay === "2026-09-01").every((pet) => pet.bondDays === 15)).toBe(true);

    expect(hatching.pets.find((pet) => pet.bornDay === "2026-09-16")).toMatchObject({ bondDays: 5, eggPhase: 4 });
    expect(hatched.pets.find((pet) => pet.bornDay === "2026-09-16")).toMatchObject({ bondDays: 6, eggPhase: null });
  });

  it("ignores a 60 minute session once the egg is already back", () => {
    const days = Array.from({ length: 21 }, (_, index) => `2026-09-${String(index + 1).padStart(2, "0")}`);
    const sessions = days.flatMap((day) => [
      ...(day === "2026-09-05" ? [] : [session("alex", day, day === "2026-09-16" ? 60 : 10)]),
      session("amiga", day),
    ]);

    const life = computeGardenLife({ sessions, ownerIds: owners, hatchedDay: "2026-09-01", todayDay: "2026-09-21" });

    expect(life.fallenCount).toBe(0);
    expect(life.pets.filter((pet) => pet.bornDay === "2026-09-16")).toHaveLength(1);
    expect(life.pets.filter((pet) => pet.bornDay === "2026-09-01")).toHaveLength(3);
  });

  it("marks the four creatures as fallen after four fatal incidents", () => {
    const life = computeGardenLife({
      sessions: [session("alex", "2026-09-01"), session("amiga", "2026-09-01")],
      ownerIds: owners,
      hatchedDay: "2026-09-01",
      todayDay: "2026-09-11",
    });

    expect(life.fallenCount).toBe(4);
    expect(livingCount(life.pets)).toBe(0);
    expect(life.pets.every((pet) => pet.mood === "fallecida")).toBe(true);
  });
});

describe("egg phases", () => {
  it("hatches over the first five bond days", () => {
    expect(eggPhaseForBond(0)).toBe(0);
    expect(eggPhaseForBond(1)).toBe(0);
    expect(eggPhaseForBond(2)).toBe(1);
    expect(eggPhaseForBond(3)).toBe(2);
    expect(eggPhaseForBond(4)).toBe(3);
    expect(eggPhaseForBond(5)).toBe(4);
    expect(eggPhaseForBond(6)).toBeNull();
    expect(eggPhaseForBond(40)).toBeNull();
  });
});

describe("pet stages", () => {
  it("uses all six evolution thresholds", () => {
    expect(petStageForBond(0)).toBe("origen");
    expect(petStageForBond(9)).toBe("origen");
    expect(petStageForBond(10)).toBe("cría");
    expect(petStageForBond(50)).toBe("curiosa");
    expect(petStageForBond(70)).toBe("radiante");
    expect(petStageForBond(100)).toBe("mítica");
    expect(petStageForBond(200)).toBe("guardiana");
  });
});
