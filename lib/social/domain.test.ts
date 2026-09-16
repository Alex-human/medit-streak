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

  it("dies only after the five rescue days have elapsed", () => {
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
    expect(dead.mood).toBe("fallecida");
    expect(dead.deathDay).toBe("2026-09-22");
  });
});

describe("pet stages", () => {
  it("uses the four compact evolution thresholds", () => {
    expect(petStageForBond(0)).toBe("semilla");
    expect(petStageForBond(3)).toBe("brote");
    expect(petStageForBond(7)).toBe("lumo");
    expect(petStageForBond(21)).toBe("guardián");
  });
});
