import { describe, expect, it } from "vitest";
import { computeGardenLife, petStageForBond, type SocialSession } from "./domain";

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
    expect(happy.pets.every((pet) => pet.alive && pet.bondDays === 1)).toBe(true);
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

  it("restarts a revived creature at the first stage while the others keep their bond", () => {
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

    const revived = life.pets.find((pet) => pet.bornDay !== "2026-01-01");
    const veterans = life.pets.filter((pet) => pet.bornDay === "2026-01-01");

    expect(life.fallenCount).toBe(0);
    expect(revived?.bornDay).toBe("2026-01-15");
    expect(revived?.bondDays).toBe(6);
    expect(revived?.stage).toBe("cría");
    expect(veterans).toHaveLength(3);
    expect(veterans.every((pet) => pet.bondDays === 19 && pet.stage === "radiante")).toBe(true);
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

describe("pet stages", () => {
  it("uses all six evolution thresholds", () => {
    expect(petStageForBond(0)).toBe("origen");
    expect(petStageForBond(3)).toBe("cría");
    expect(petStageForBond(7)).toBe("curiosa");
    expect(petStageForBond(14)).toBe("radiante");
    expect(petStageForBond(30)).toBe("mítica");
    expect(petStageForBond(60)).toBe("guardiana");
  });
});
