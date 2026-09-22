import { useId } from "react";
import { ITEM_DRAWINGS, ITEM_GRADIENTS, ItemDefs, type ItemIds } from "./PetItems";
import type { CatalogItem, Slot } from "@/lib/social/catalog";

/** Encuadre de cada hueco para enseñar la pieza sola, sin criatura. */
const FRAME: Record<Slot, string> = {
  cabeza: "translate(0 16) scale(1)",
  cuello: "translate(0 -8) scale(1)",
  espalda: "translate(0 4) scale(0.5)",
  cola: "translate(-12 10) scale(0.85)",
  mano: "translate(0 8) scale(0.72)",
  suelo: "translate(0 12) scale(0.75)",
};

export default function ItemIcon({ item }: { item: CatalogItem }) {
  const rawId = useId().replaceAll(":", "");
  const ids = Object.fromEntries(ITEM_GRADIENTS.map((key) => [key, `icon-${key}-${rawId}`])) as ItemIds;
  const draw = ITEM_DRAWINGS[item.id];
  return (
    <svg className="pet-item-icon" viewBox="-46 -46 92 92" aria-hidden="true">
      <defs><ItemDefs ids={ids} /></defs>
      <g transform={FRAME[item.slot]}>{draw ? draw(ids) : null}</g>
    </svg>
  );
}
