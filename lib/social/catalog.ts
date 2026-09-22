import { toDayString } from "../dates";
import { EGG_DAYS, PET_KINDS, type ChoicePick, type PetKind, type PetLife } from "./domain";

export const SLOTS = ["cabeza", "cuello", "espalda", "cola", "mano", "suelo"] as const;
export type Slot = (typeof SLOTS)[number];

export type ItemKind = "objeto" | "rasgo";
export type CatalogItem = { id: string; label: string; slot: Slot; kind: ItemKind; element?: PetKind };

/** Piezas que la pareja puede elegir en cada hito: objetos zen y rasgos de los cuatro elementos. */
export const CATALOG: CatalogItem[] = [
  { id: "mala", label: "Mala de cuentas", slot: "cuello", kind: "objeto" },
  { id: "bandana", label: "Bandana", slot: "cuello", kind: "objeto" },
  { id: "halo", label: "Halo", slot: "cabeza", kind: "objeto" },
  { id: "loto", label: "Flor de loto", slot: "cabeza", kind: "objeto" },
  { id: "gorro", label: "Gorro de dormir", slot: "cabeza", kind: "objeto" },
  { id: "campanita", label: "Campanita", slot: "mano", kind: "objeto" },
  { id: "baston", label: "Bastón de monje", slot: "mano", kind: "objeto" },
  { id: "zafu", label: "Zafu", slot: "suelo", kind: "objeto" },
  { id: "cuenco", label: "Cuenco tibetano", slot: "suelo", kind: "objeto" },
  { id: "farolillo", label: "Farolillo", slot: "suelo", kind: "objeto" },
  { id: "alas-pegaso", label: "Alas de Pegaso", slot: "espalda", kind: "rasgo", element: "nube" },
  { id: "corona-nubes", label: "Corona de nubes", slot: "cabeza", kind: "rasgo", element: "nube" },
  { id: "estela-viento", label: "Estela de viento", slot: "cola", kind: "rasgo", element: "nube" },
  { id: "alas-fenix", label: "Alas de fénix", slot: "espalda", kind: "rasgo", element: "fuego" },
  { id: "cuernos-brasa", label: "Cuernos de brasa", slot: "cabeza", kind: "rasgo", element: "fuego" },
  { id: "cola-llama", label: "Cola de llama", slot: "cola", kind: "rasgo", element: "fuego" },
  { id: "alas-escarcha", label: "Alas de escarcha", slot: "espalda", kind: "rasgo", element: "agua" },
  { id: "cuernos-hielo", label: "Cuernos de hielo", slot: "cabeza", kind: "rasgo", element: "agua" },
  { id: "cola-sirena", label: "Cola de sirena", slot: "cola", kind: "rasgo", element: "agua" },
  { id: "alas-hoja", label: "Alas de hoja", slot: "espalda", kind: "rasgo", element: "bosque" },
  { id: "astas-flores", label: "Astas floridas", slot: "cabeza", kind: "rasgo", element: "bosque" },
  { id: "cola-hojas", label: "Cola de hojas", slot: "cola", kind: "rasgo", element: "bosque" },
];

export function catalogItem(id: string) {
  return CATALOG.find((item) => item.id === id);
}

export function itemsForPick(pick: ChoicePick) {
  return pick === "libre" ? CATALOG : CATALOG.filter((item) => item.kind === pick);
}

export type Identity = { name: string; element: PetKind };
export type ChoicePayload = Identity | { item: string } | { order: string; item?: string };

export type ChoiceRow = {
  id: string;
  pet_id: string;
  life: number;
  milestone_day: number;
  payload: ChoicePayload;
  proposed_by: string;
  proposed_at: string;
  confirmed_by: string | null;
  confirmed_at: string | null;
};

export type Outfit = Partial<Record<Slot, string>>;

export function isIdentity(payload: ChoicePayload): payload is Identity {
  return "element" in payload && PET_KINDS.includes(payload.element);
}

/** Nombre y elemento acordados: se deciden una vez y sobreviven a cada renacer. */
export function identityOf(choices: ChoiceRow[]) {
  const row = choices.find((choice) => choice.confirmed_at !== null && isIdentity(choice.payload));
  return row && isIdentity(row.payload) ? { identity: row.payload, confirmedAt: row.confirmed_at as string } : null;
}

/** El baúl: cada pieza confirmada en un hito o llegada como pedido, de cualquier vida. */
export function ownedItems(choices: ChoiceRow[]): CatalogItem[] {
  return CATALOG.filter((item) => choices.some((choice) => choice.confirmed_at !== null && "item" in choice.payload && choice.payload.item === item.id));
}

export function equippedItems(outfit: Outfit, owned: CatalogItem[]) {
  return owned.filter((item) => outfit[item.slot] === item.id);
}

/** Álbum: la última pieza confirmada en cada hueco hasta ese día, en orden de confirmación. */
export function wornOn(choices: ChoiceRow[], day: string): CatalogItem[] {
  const bySlot = new Map<Slot, CatalogItem>();
  const confirmed = choices
    .filter((choice): choice is ChoiceRow & { confirmed_at: string } => choice.confirmed_at !== null && toDayString(new Date(choice.confirmed_at)) <= day)
    .sort((a, b) => Date.parse(a.confirmed_at) - Date.parse(b.confirmed_at));
  for (const choice of confirmed) {
    const item = "item" in choice.payload && choice.payload.item ? catalogItem(choice.payload.item) : null;
    if (item) bySlot.set(item.slot, item);
  }
  return [...bySlot.values()];
}

export type DueChoice = { milestone: { day: number; pick: ChoicePick | "identidad" }; row: ChoiceRow | null };

/** Decisiones que la pareja tiene abiertas hoy: la identidad del huevo y los hitos de esta vida sin acuerdo. */
export function dueChoices(life: PetLife, choices: ChoiceRow[]): DueChoice[] {
  const due: DueChoice[] = [];
  if (life.identityDue) {
    due.push({ milestone: { day: EGG_DAYS, pick: "identidad" }, row: choices.find((choice) => isIdentity(choice.payload)) ?? null });
  }
  for (const milestone of life.milestones) {
    const row = choices.find((choice) => choice.life === life.life && choice.milestone_day === milestone.day) ?? null;
    if (row === null || row.confirmed_at === null) due.push({ milestone, row });
  }
  return due;
}

/** Pedidos personalizados confirmados que aún no tienen pieza dibujada. */
export function pendingOrders(choices: ChoiceRow[]) {
  return choices.filter((choice) => choice.confirmed_at !== null && "order" in choice.payload && !choice.payload.item);
}
