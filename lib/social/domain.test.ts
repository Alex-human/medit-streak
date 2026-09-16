import { describe, expect, it } from "vitest";
import { computePetLife, petStageForBond, type SocialSession } from "./domain";

const owners: [string, string] = ["alex", "amiga"];

function session(userId: string, day: string, minutes = 10, source: SocialSession["source"] = "timer"): SocialSession {
  return { userId, day, minutes, source };
}

describe("shared pet life", () => {
  it("wakes for one owner and becomes happy when both meditate", () => {
    const waiting = computePetLife({
      sessions: [session("alex", "2026-09-16")],
      ownerIds: owners,
      hatchedDay: "2026-09-16",
      todayDay: "2026-09-16",
    });
    const happy = computePetLife({
      sessions: [session("alex", "2026-09-16"), session("amiga", "2026-09-16")],
      ownerIds: owners,
      hatchedDay: "2026-09-16",
      todayDay: "2026-09-16",
    });

    expect(waiting.mood).toBe("esperando");
    expect(happy.mood).toBe("feliz");
    expect(happy.bondDays).toBe(1);
  });

  it("offers the existing 30 minute recovery on the next day", () => {
    const life = computePetLife({
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
    const life = computePetLife({
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
    const danger = computePetLife({
      sessions: base,
      ownerIds: owners,
      hatchedDay: "2026-09-14",
      todayDay: "2026-09-17",
    });
    const rescued = computePetLife({
      sessions: [...base, session("alex", "2026-09-17", 60)],
      ownerIds: owners,
      hatchedDay: "2026-09-14",
      todayDay: "2026-09-17",
    });

    expect(danger.mood).toBe("peligro");
    expect(danger.rescueDeadline).toBe("2026-09-21");
    expect(rescued.mood).toBe("esperando");
  });

  it("drops one creature per fatal streak incident after the five rescue days", () => {
    const sessions = [session("alex", "2026-09-14"), session("amiga", "2026-09-14")];
    const lastChance = computePetLife({
      sessions,
      ownerIds: owners,
      hatchedDay: "2026-09-14",
      todayDay: "2026-09-21",
    });
    const dead = computePetLife({
      sessions,
      ownerIds: owners,
      hatchedDay: "2026-09-14",
      todayDay: "2026-09-22",
    });

    expect(lastChance.mood).toBe("peligro");
    expect(dead.fallenCount).toBe(2);
    expect(dead.mood).toBe("peligro");
  });

  it("revives one fallen creature with each later 60 minute timer session", () => {
    const base = [session("alex", "2026-09-14"), session("amiga", "2026-09-14")];
    const fallen = computePetLife({ sessions: base, ownerIds: owners, hatchedDay: "2026-09-14", todayDay: "2026-09-22" });
    const revived = computePetLife({
      sessions: [...base, session("alex", "2026-09-22", 60)],
      ownerIds: owners,
      hatchedDay: "2026-09-14",
      todayDay: "2026-09-22",
    });

    expect(fallen.fallenCount).toBe(2);
    expect(revived.fallenCount).toBe(1);
  });

  it("marks the whole four-creature collection as fallen after four fatal incidents", () => {
    const life = computePetLife({
      sessions: [session("alex", "2026-09-01"), session("amiga", "2026-09-01")],
      ownerIds: owners,
      hatchedDay: "2026-09-01",
      todayDay: "2026-09-11",
    });

    expect(life.fallenCount).toBe(4);
    expect(life.mood).toBe("fallecida");
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
