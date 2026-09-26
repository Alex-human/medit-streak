import { useId } from "react";
import { ITEM_GRADIENTS, ItemDefs, ItemPiece, type ItemIds } from "./PetItems";
import type { OwnedItem, Slot } from "@/lib/social/catalog";

/** Encuadre de cada hueco para enseñar la pieza sola, sin criatura. */
const FRAME: Record<Slot, string> = {
  cabeza: "translate(0 16) scale(1)",
  cuello: "translate(0 -8) scale(1)",
  espalda: "translate(0 4) scale(0.5)",
  cola: "translate(-12 10) scale(0.85)",
  mano: "translate(0 8) scale(0.72)",
  suelo: "translate(0 12) scale(0.75)",
};

/** La pieza sola, pintada al nivel que tiene o al que llegaría. */
export default function ItemIcon({ item }: { item: OwnedItem }) {
  const rawId = useId().replaceAll(":", "");
  const ids = Object.fromEntries(ITEM_GRADIENTS.map((key) => [key, `icon-${key}-${rawId}`])) as ItemIds;
  return (
    <svg className="pet-item-icon" viewBox="-46 -46 92 92" aria-hidden="true">
      <defs><ItemDefs ids={ids} /></defs>
      <g transform={FRAME[item.slot]}><ItemPiece id={item.id} level={item.level} ids={ids} /></g>
    </svg>
  );
}
