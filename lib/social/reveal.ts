import type { PetCard } from "../cloud/social";
import { equippedItems, type CatalogItem } from "./catalog";

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
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
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

/** Separa lo que esta persona ya ha estrenado de lo que verá en su próxima celebración. */
export function splitReveal(card: PetCard): { shown: CatalogItem[]; fresh: CatalogItem[] } {
  const equipped = equippedItems(card.pet.outfit, card.owned);
  const seen = readSeenItems(card.currentUserId, card.pet.id);
  if (seen === null) return { shown: equipped, fresh: [] };
  return { shown: equipped.filter((item) => seen.has(item.id)), fresh: equipped.filter((item) => !seen.has(item.id)) };
}

export function markRevealed(card: PetCard) {
  const seen = readSeenItems(card.currentUserId, card.pet.id) ?? new Set<string>();
  for (const item of equippedItems(card.pet.outfit, card.owned)) seen.add(item.id);
  writeSeenItems(card.currentUserId, card.pet.id, seen);
}
