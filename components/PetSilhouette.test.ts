import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CATALOG } from "../lib/social/catalog";
import { ITEM_DRAWINGS } from "./PetItems";
import ItemSilhouette from "./PetSilhouette";

const markup = (id: string) => renderToStaticMarkup(createElement(ItemSilhouette, { id }));

describe("item silhouettes", () => {
  it.each(CATALOG.map((item) => item.id))("%s has a drawing and a solid, filter-free silhouette", (id) => {
    expect(ITEM_DRAWINGS[id]).toBeDefined();
    const html = markup(id);

    // Contorno luminoso debajo y silueta encima, cada uno con formas de verdad.
    const [rim, ink] = html.split('<g class="pet-silhouette-ink">');
    expect(rim).toMatch(/^<g class="pet-silhouette-rim">.*<(path|circle|ellipse|rect)/);
    expect(ink).toMatch(/<(path|circle|ellipse|rect)/);

    // Ni degradados, ni filtros, ni transparencias: el color lo pone el CSS con currentColor.
    expect(html).not.toMatch(/url\(|<filter|<defs|opacity|rgba?\(|#[0-9a-f]{3,6}/i);
    expect(html).toContain("currentColor");
  });

  it("leaves out glows, highlights and sparkles", () => {
    const halo = markup("halo");
    // El halo real dibuja resplandor, brillo interior y tres chispas: la silueta es solo el aro.
    expect(halo.match(/<ellipse/g)).toHaveLength(2);
    expect(halo).not.toContain("<path");
  });

  it("gives an unknown piece no silhouette", () => {
    expect(markup("no-existe")).toBe("");
  });
});
