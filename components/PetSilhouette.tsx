import { Fragment, createElement, isValidElement, type ReactNode } from "react";
import { ITEM_DRAWINGS, ITEM_GRADIENTS, Spark, Trim, type ItemIds } from "./PetItems";

/*
 * Silueta de una pieza: se deriva del propio dibujo, así que toda pieza nueva de ITEM_DRAWINGS
 * ya tiene su sombra. Conserva la geometría con relleno y trazo sólidos y descarta lo que no es
 * contorno: resplandores y colores translúcidos (brillos, vetas), chispas y lo envuelto en <Trim>.
 * Solo vectores: un filtro SVG pinta una mancha o un rectángulo pálido según el navegador.
 */

type Props = Record<string, unknown> & { children?: ReactNode };
type Inherited = { fill?: string; stroke?: string; width: number };
type Pass = "rim" | "ink";

/** Ids ficticios: solo sirven para reconocer el resplandor (`glow`) y descartarlo. */
const PROBE = Object.fromEntries(ITEM_GRADIENTS.map((key) => [key, `sil-${key}`])) as ItemIds;
const SHAPES = new Set(["path", "circle", "ellipse", "rect", "line", "polygon", "polyline"]);
/** Un color con menos alfa que esto es un brillo o una veta, no materia de la pieza. */
const SOLID_ALPHA = 0.9;
/** Lo que sobresale el borde luminoso a cada lado, en unidades de la pieza. */
const RIM = 1.1;
/** Lo que cada pasada quita del dibujo: la pintura se recalcula en cada figura. */
const PAINT = new Set(["fill", "stroke", "strokeWidth", "strokeDasharray", "opacity", "fillOpacity", "strokeOpacity", "children"]);

function isSolid(paint: unknown) {
  if (typeof paint !== "string" || paint === "none" || paint.includes(PROBE.glow)) return false;
  const alpha = /^rgba\([^)]*,\s*([\d.]+)\s*\)$/.exec(paint)?.[1];
  return alpha === undefined || Number(alpha) >= SOLID_ALPHA;
}

const text = (value: unknown) => (typeof value === "string" ? value : undefined);

function walk(node: ReactNode, inherited: Inherited, pass: Pass): ReactNode[] {
  if (Array.isArray(node)) return node.flatMap((child) => walk(child, inherited, pass));
  if (!isValidElement<Props>(node)) return [];
  const { type, props } = node;
  if (type === Spark || type === Trim) return [];
  if (type === Fragment) return walk(props.children, inherited, pass);
  if (typeof type === "function") return walk((type as (own: Props) => ReactNode)(props), inherited, pass);
  if (typeof type !== "string") return [];

  const fill = text(props.fill) ?? inherited.fill;
  const stroke = text(props.stroke) ?? inherited.stroke;
  const width = Number(props.strokeWidth ?? inherited.width);
  const kept = Object.fromEntries(Object.entries(props).filter(([key]) => !PAINT.has(key)));

  if (type === "g") return [createElement("g", kept, ...walk(props.children, { fill, stroke, width }, pass))];
  if (!SHAPES.has(type)) return [];

  // Sin fill propio ni heredado, SVG pinta en negro.
  const filled = isSolid(fill ?? "#000");
  const outlined = stroke !== undefined && stroke !== "none" && (filled || isSolid(stroke));
  if (!filled && !outlined) return [];
  return [
    createElement(type, {
      ...kept,
      fill: filled ? "currentColor" : "none",
      stroke: outlined || pass === "rim" ? "currentColor" : undefined,
      strokeWidth: pass === "rim" ? (outlined ? width : 0) + 2 * RIM : width,
      ...(pass === "rim" ? { strokeLinejoin: "round" } : {}),
    }),
  ];
}

const cache = new Map<string, { rim: ReactNode; ink: ReactNode } | null>();

function silhouetteOf(id: string) {
  if (!cache.has(id)) {
    const draw = ITEM_DRAWINGS[id];
    cache.set(id, draw ? {
      rim: createElement("g", null, ...walk(draw(PROBE), { width: 1 }, "rim")),
      ink: createElement("g", null, ...walk(draw(PROBE), { width: 1 }, "ink")),
    } : null);
  }
  return cache.get(id) ?? null;
}

/** La sombra de una pieza: contorno luminoso debajo y silueta oscura encima. El color lo pone el CSS. */
export default function ItemSilhouette({ id }: { id: string }) {
  const parts = silhouetteOf(id);
  if (!parts) return null;
  return (
    <>
      <g className="pet-silhouette-rim">{parts.rim}</g>
      <g className="pet-silhouette-ink">{parts.ink}</g>
    </>
  );
}
