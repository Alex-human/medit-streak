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
  { id: "yinyang", label: "Colgante yin-yang", slot: "cuello", kind: "objeto" },
  { id: "guirnalda", label: "Guirnalda de flores", slot: "cuello", kind: "objeto" },
  { id: "abanico", label: "Abanico", slot: "mano", kind: "objeto" },
  { id: "orbe", label: "Orbe de luz", slot: "mano", kind: "objeto" },
  { id: "bonsai", label: "Bonsái", slot: "suelo", kind: "objeto" },
  { id: "gong", label: "Gong", slot: "suelo", kind: "objeto" },
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

/** Elegir otra vez una pieza la sube de nivel: normal, de oro y celestial, que ya no sube más. */
export const MAX_ITEM_LEVEL = 3;
export type ItemLevel = 1 | 2 | 3;
export type OwnedItem = CatalogItem & { level: ItemLevel };
const LEVEL_SUFFIX: Record<ItemLevel, string> = { 1: "", 2: " de oro", 3: " celestial" };

function withLevel(item: CatalogItem, count: number): OwnedItem {
  return { ...item, level: Math.min(MAX_ITEM_LEVEL, count) as ItemLevel };
}

export function itemName(item: OwnedItem) {
  return `${item.label}${LEVEL_SUFFIX[item.level]}`;
}

/** Lo que se puede elegir en un hito, cada pieza con el nivel al que llegaría. */
export function itemsForPick(pick: ChoicePick, owned: OwnedItem[]): OwnedItem[] {
  return CATALOG.filter((item) => pick === "libre" || item.kind === pick).flatMap((item) => {
    const next = (owned.find((own) => own.id === item.id)?.level ?? 0) + 1;
    return next <= MAX_ITEM_LEVEL ? [withLevel(item, next)] : [];
  });
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

/** Piezas confirmadas hasta un día, en orden de confirmación, cada una con las veces que se ha elegido hasta entonces. */
function confirmedPieces(choices: ChoiceRow[], day?: string) {
  const counts = new Map<string, number>();
  return choices
    .filter((choice): choice is ChoiceRow & { confirmed_at: string } => choice.confirmed_at !== null && (day === undefined || toDayString(new Date(choice.confirmed_at)) <= day))
    .sort((a, b) => Date.parse(a.confirmed_at) - Date.parse(b.confirmed_at))
    .flatMap((choice) => {
      const item = "item" in choice.payload && choice.payload.item ? catalogItem(choice.payload.item) : undefined;
      if (!item) return [];
      counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
      return [withLevel(item, counts.get(item.id) as number)];
    });
}

/** El baúl: cada pieza confirmada en un hito o llegada como pedido, de cualquier vida, con su nivel. */
export function ownedItems(choices: ChoiceRow[]): OwnedItem[] {
  const levels = new Map(confirmedPieces(choices).map((piece) => [piece.id, piece]));
  return CATALOG.flatMap((item) => levels.get(item.id) ?? []);
}

export function equippedItems(outfit: Outfit, owned: OwnedItem[]) {
  return owned.filter((item) => outfit[item.slot] === item.id);
}

/** Álbum: la última pieza confirmada en cada hueco hasta ese día, con el nivel que tenía entonces. */
export function wornOn(choices: ChoiceRow[], day: string): OwnedItem[] {
  return [...new Map(confirmedPieces(choices, day).map((piece) => [piece.slot, piece])).values()];
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
