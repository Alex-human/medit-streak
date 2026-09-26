import type { PetCard } from "../cloud/social";
import { equippedItems, type OwnedItem } from "./catalog";

/**
 * Estreno: cada persona ve una pieza nueva sobre la mascota por primera vez en la
 * celebración de su siguiente meditación. Hasta entonces la pieza está guardada.
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
export function splitReveal(card: PetCard): { shown: OwnedItem[]; fresh: OwnedItem[] } {
  const equipped = equippedItems(card.pet.outfit, card.owned);
  const seen = readSeenItems(card.currentUserId, card.pet.id);
  if (seen === null) return { shown: equipped, fresh: [] };
  return { shown: equipped.filter((item) => seen.has(seenKey(item))), fresh: equipped.filter((item) => !seen.has(seenKey(item))) };
}

export function markRevealed(card: PetCard) {
  const seen = readSeenItems(card.currentUserId, card.pet.id) ?? new Set<string>();
  for (const item of equippedItems(card.pet.outfit, card.owned)) seen.add(seenKey(item));
  writeSeenItems(card.currentUserId, card.pet.id, seen);
}
