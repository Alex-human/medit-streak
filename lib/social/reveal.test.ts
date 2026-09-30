import { afterEach, describe, expect, it, vi } from "vitest";
import type { PetCard } from "../cloud/social";
import { ownedItems, type ChoiceRow } from "./catalog";
import { markRevealed, splitReveal } from "./reveal";

function cardFor(choices: ChoiceRow[], userId = "alex"): PetCard {
  return {
    pet: { id: "carlitos", outfit: { cabeza: "halo" } },
    currentUserId: userId,
    owned: ownedItems(choices),
    choices,
  } as PetCard;
}

function haloChoice(confirmedAt: string, id = "first"): ChoiceRow {
  return {
    id,
    pet_id: "carlitos",
    life: 1,
    milestone_day: 8,
    payload: { item: "halo" },
    proposed_by: "alicia",
    proposed_at: "2026-09-30T08:00:00Z",
    confirmed_by: "alex",
    confirmed_at: confirmedAt,
  };
}

describe("complement reveal", () => {
  const storage = new Map<string, string>();

  afterEach(() => {
    storage.clear();
    vi.unstubAllGlobals();
  });

  function withStorage() {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => { storage.set(key, value); },
      },
    });
  }

  it("shows a shadow on confirmation day and reveals the real halo after a meditation on a later day", () => {
    withStorage();
    const card = cardFor([haloChoice("2026-09-30T10:00:00Z")]);

    expect(splitReveal(card, "2026-09-30")).toMatchObject({ shown: [], fresh: [{ id: "halo" }], ready: [] });
    markRevealed(card, "2026-09-30");
    expect(splitReveal(card, "2026-09-30").shown).toHaveLength(0);

    expect(splitReveal(card, "2026-10-01").ready.map((item) => item.id)).toEqual(["halo"]);
    markRevealed(card, "2026-10-01");
    expect(splitReveal(card, "2026-10-01")).toMatchObject({ shown: [{ id: "halo" }], fresh: [], ready: [] });
  });

  it("keeps the next level in shadow until its own later-day meditation", () => {
    withStorage();
    storage.set("medit_pet_seen:alex:carlitos", JSON.stringify(["halo:1"]));
    const card = cardFor([
      haloChoice("2026-09-20T10:00:00Z"),
      haloChoice("2026-09-30T10:00:00Z", "upgrade"),
    ]);

    expect(splitReveal(card, "2026-09-30")).toMatchObject({ shown: [], fresh: [{ id: "halo", level: 2 }], ready: [] });
    expect(splitReveal(card, "2026-10-01").ready.map((item) => item.level)).toEqual([2]);
  });
});
