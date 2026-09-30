import type { PetCard } from "../cloud/social";
import { toDayString } from "../dates";
import { equippedItems, type OwnedItem } from "./catalog";

/**
 * Estreno: cada persona ve una pieza nueva en la celebración de una meditación
 * posterior al día en que se confirmó. Hasta entonces aparece como silueta.
 * Se recuerda en este dispositivo; si falla el almacenamiento, no se oculta nada.
 */
function key(userId: string, petId: string) {
  return `medit_pet_seen:${userId}:${petId}`;
}

function readSeenItems(userId: string, petId: string): Set<string> | null {
  try {
    const raw = window.localStorage.getItem(key(userId, petId));
    // Lo visto antes de que existieran los niveles se guardó sin nivel: era el nivel 1.
    return new Set((raw ? (JSON.parse(raw) as string[]) : []).map((entry) => (entry.includes(":") ? entry : `${entry}:1`)));
  } catch {
    return null;
  }
}

function writeSeenItems(userId: string, petId: string, itemIds: Iterable<string>) {
  try {
    window.localStorage.setItem(key(userId, petId), JSON.stringify([...itemIds]));
  } catch {
    // Sin almacenamiento la pieza se enseña directamente.
  }
}

/** Una pieza que sube de nivel se estrena otra vez: lo visto se recuerda por pieza y nivel. */
const seenKey = (item: OwnedItem) => `${item.id}:${item.level}`;

/** Separa lo que esta persona ya ha estrenado de lo que verá en su próxima celebración. */
export function splitReveal(card: PetCard, todayDay = toDayString(new Date())): { shown: OwnedItem[]; fresh: OwnedItem[]; ready: OwnedItem[] } {
  const equipped = equippedItems(card.pet.outfit, card.owned);
  const seen = readSeenItems(card.currentUserId, card.pet.id);
  if (seen === null) return { shown: equipped, fresh: [], ready: [] };
  const shown = equipped.filter((item) => seen.has(seenKey(item)));
  const fresh = equipped.filter((item) => !seen.has(seenKey(item)));
  const ready = fresh.filter((item) => {
    const lastConfirmation = card.choices
      .filter((choice) => choice.confirmed_at && "item" in choice.payload && choice.payload.item === item.id)
      .map((choice) => choice.confirmed_at as string)
      .sort()
      .at(-1);
    return lastConfirmation && toDayString(new Date(lastConfirmation)) < todayDay;
  });
  return { shown, fresh, ready };
}

export function markRevealed(card: PetCard, todayDay = toDayString(new Date())) {
  const seen = readSeenItems(card.currentUserId, card.pet.id) ?? new Set<string>();
  for (const item of splitReveal(card, todayDay).ready) seen.add(seenKey(item));
  writeSeenItems(card.currentUserId, card.pet.id, seen);
}
