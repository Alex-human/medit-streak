import type { ReactNode } from "react";
import type { ItemLevel } from "@/lib/social/catalog";

/** Degradados compartidos por las piezas y las formas altas; cada avatar los declara con sus propios ids. */
export const ITEM_GRADIENTS = ["gold", "wood", "crimson", "rose", "night", "plum", "bronze", "lantern", "wind", "ember", "magma", "ice", "aqua", "leaf", "gilded", "prism", "moon", "glow"] as const;
export type ItemIds = Record<(typeof ITEM_GRADIENTS)[number], string>;

const LINEAR: Record<Exclude<keyof ItemIds, "glow">, string[]> = {
  gold: ["#fff6c4", "#f6c94c", "#b9811c"],
  wood: ["#e6b986", "#a86f3c", "#6e4322"],
  crimson: ["#ff8a8a", "#e0304f", "#8f1030"],
  rose: ["#ffe1ef", "#ff9cc2", "#e8578f"],
  night: ["#8d8bff", "#4b48c9", "#26246f"],
  plum: ["#d6b8ff", "#8f63d6", "#4f3391"],
  bronze: ["#ffe3ad", "#d59a52", "#8f5322"],
  lantern: ["#fff8cf", "#ffc670", "#ff8f3d"],
  wind: ["#ffffff", "#dcefff", "#9fc8ff"],
  ember: ["#fff3a3", "#ff9a3c", "#e23c2f"],
  magma: ["#ffd166", "#ff6a2b", "#3b1d16"],
  ice: ["#ffffff", "#cdf2ff", "#79b4ff"],
  aqua: ["#dcfbff", "#4cc9ea", "#2b6fd6"],
  leaf: ["#eaffb8", "#7fd46c", "#2e8b4b"],
  gilded: ["#fffbe0", "#ffd65a", "#d08f1c"],
  prism: ["#fff0fb", "#c9b6ff", "#7fdcff"],
  moon: ["#fffdf2", "#fff1b8", "#f0c766"],
};

export function ItemDefs({ ids }: { ids: ItemIds }) {
  return (
    <>
      {(Object.keys(LINEAR) as (keyof typeof LINEAR)[]).map((key) => (
        <linearGradient key={key} id={ids[key]} x1="0" y1="0" x2="0.6" y2="1">
          {LINEAR[key].map((color, index) => (
            <stop key={color} offset={`${(index / (LINEAR[key].length - 1)) * 100}%`} stopColor={color} />
          ))}
        </linearGradient>
      ))}
      <radialGradient id={ids.glow} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="55%" stopColor="#fff3b0" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#fff3b0" stopOpacity="0" />
      </radialGradient>
    </>
  );
}

const url = (id: string) => `url(#${id})`;
const EDGE = "rgba(255,255,255,.85)";

export function Spark({ x, y, r = 3, fill = "#fff6bd" }: { x: number; y: number; r?: number; fill?: string }) {
  return <path d={`M${x} ${y - r}q${r * 0.22} ${r * 0.78} ${r} ${r}q-${r * 0.78} ${r * 0.22} -${r} ${r}q-${r * 0.22} -${r * 0.78} -${r} -${r}q${r * 0.78} -${r * 0.22} ${r} -${r}Z`} fill={fill} />;
}

/** Una pieza a su nivel: la de oro y la celestial cambian toda su pintura, y la celestial brilla por detrás. */
export function ItemPiece({ id, level, ids }: { id: string; level: ItemLevel; ids: ItemIds }) {
  const draw = ITEM_DRAWINGS[id];
  if (!draw) return null;
  const tone = level === 2 ? ids.gilded : ids.prism;
  const paint = level === 1 ? ids : (Object.fromEntries(ITEM_GRADIENTS.map((key) => [key, key === "glow" ? ids.glow : tone])) as ItemIds);
  return (
    <>
      {level === 3 ? (
        <g>
          <circle r="26" fill={url(ids.glow)} />
          <Spark x={-20} y={-14} r={3.4} fill="#f4ecff" />
          <Spark x={21} y={-4} r={2.6} fill="#e3f8ff" />
        </g>
      ) : null}
      {draw(paint)}
    </>
  );
}

/** Espejo horizontal para dibujar el lado izquierdo de alas, cuernos y astas. */
function Mirrored({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <g transform="scale(-1 1)">{children}</g>
    </>
  );
}

/*
 * Cada pieza se dibuja en coordenadas locales con el origen en su punto de anclaje:
 * cabeza = coronilla (la pieza crece hacia arriba), cuello = centro del cuello,
 * espalda = centro de la espalda (detrás del cuerpo), cola = base de la cola,
 * mano = empuñadura, suelo = centro del suelo bajo la criatura.
 */
export const ITEM_DRAWINGS: Record<string, (ids: ItemIds) => ReactNode> = {
  mala: (ids) => (
    <g>
      <path d="M-17 -3Q-15 14 0 15Q15 14 17 -3" fill="none" stroke="#5b3a1e" strokeWidth="1.6" />
      {[[-16, -2], [-14, 4], [-10, 9], [-5, 12.5], [5, 12.5], [10, 9], [14, 4], [16, -2]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="3.4" fill={url(ids.wood)} stroke={EDGE} strokeWidth=".8" />
          <circle cx={x - 1} cy={y - 1.2} r="1" fill="rgba(255,255,255,.7)" />
        </g>
      ))}
      <circle cx="0" cy="15" r="4.6" fill={url(ids.gold)} stroke={EDGE} strokeWidth="1" />
      <circle cx="-1.2" cy="13.6" r="1.3" fill="#fffbe6" />
      <path d="M-2 19l-2 9M0 19v10M2 19l2 9" stroke={url(ids.crimson)} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="0" cy="20" r="1.8" fill={url(ids.crimson)} />
    </g>
  ),

  bandana: (ids) => (
    <g>
      <path d="M-22 -3q22 9 44 0v7q-22 9-44 0z" fill={url(ids.crimson)} stroke={EDGE} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M-20 0q20 7 40 0" fill="none" stroke={url(ids.gold)} strokeWidth="1.4" strokeDasharray="3 2.5" opacity=".9" />
      <path d="M18 0l16-8-6 12z" fill={url(ids.crimson)} stroke={EDGE} strokeWidth="1" strokeLinejoin="round" />
      <path d="M18 3l14 11-12-2z" fill={url(ids.crimson)} stroke={EDGE} strokeWidth="1" strokeLinejoin="round" />
      <circle cx="19" cy="2" r="3.2" fill={url(ids.crimson)} stroke={EDGE} strokeWidth="1" />
      <circle cx="18" cy="1" r="1.1" fill="rgba(255,255,255,.7)" />
    </g>
  ),

  halo: (ids) => (
    <g>
      <ellipse cx="0" cy="-9" rx="24" ry="9" fill={url(ids.glow)} opacity=".8" />
      <ellipse cx="0" cy="-9" rx="18" ry="5" fill="none" stroke={url(ids.gold)} strokeWidth="3.8" />
      <ellipse cx="0" cy="-9.6" rx="17" ry="4.2" fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="1.1" />
      <Spark x={-22} y={-14} r={3.2} />
      <Spark x={21} y={-4} r={2.6} />
      <Spark x={6} y={-19} r={2.2} />
    </g>
  ),

  loto: (ids) => (
    <g transform="translate(0 -2)">
      {[-70, -35, 0, 35, 70].map((angle) => (
        <path key={`b${angle}`} d="M0 0c-7-5-9-14 0-21c9 7 7 16 0 21z" fill={url(ids.rose)} stroke={EDGE} strokeWidth="1" transform={`rotate(${angle})`} opacity=".85" />
      ))}
      {[-45, 0, 45].map((angle) => (
        <path key={`f${angle}`} d="M0 0c-6-4-8-11 0-17c8 6 6 13 0 17z" fill="#ffe4f0" stroke={EDGE} strokeWidth="1" transform={`rotate(${angle}) translate(0 2)`} />
      ))}
      <circle cx="0" cy="-2" r="4" fill={url(ids.gold)} stroke={EDGE} strokeWidth=".9" />
      <g fill="#fff6c4"><circle cx="-1.4" cy="-3" r=".9" /><circle cx="1.4" cy="-3" r=".9" /><circle cx="0" cy="-.8" r=".9" /></g>
      <circle cx="-9" cy="-12" r="1.8" fill="rgba(255,255,255,.85)" />
    </g>
  ),

  gorro: (ids) => (
    <g>
      <path d="M-17 1C-16-13-6-26 6-31c8-3 16 0 21 6c-8-2-15 2-17 9c-2 8 5 12 6 16z" fill={url(ids.night)} stroke={EDGE} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M-11-6c6-10 14-16 22-19" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="3" strokeLinecap="round" />
      <g fill="#fff3a8"><circle cx="-4" cy="-10" r="1.3" /><circle cx="6" cy="-19" r="1.1" /><circle cx="2" cy="-4" r=".9" /></g>
      <rect x="-19" y="-2" width="38" height="7" rx="3.5" fill="#fffaf0" stroke={EDGE} strokeWidth="1" />
      <circle cx="27" cy="-25" r="5" fill="#fffaf0" stroke={EDGE} strokeWidth="1" />
      <circle cx="25.5" cy="-26.5" r="1.6" fill="rgba(0,0,0,.06)" />
    </g>
  ),

  campanita: (ids) => (
    <g>
      <path d="M0-14v6" stroke={url(ids.crimson)} strokeWidth="2" strokeLinecap="round" />
      <circle cx="0" cy="-15" r="2.4" fill="none" stroke={url(ids.crimson)} strokeWidth="1.6" />
      <path d="M-7 4c0-9 14-9 14 0v3h-14z" fill={url(ids.gold)} stroke={EDGE} strokeWidth="1" strokeLinejoin="round" />
      <ellipse cx="0" cy="7" rx="8" ry="2.4" fill={url(ids.gold)} stroke={EDGE} strokeWidth="1" />
      <circle cx="0" cy="9" r="1.8" fill="#8a5a1a" />
      <circle cx="-3" cy="-1" r="1.4" fill="rgba(255,255,255,.75)" />
      <path d="M11-1q4 4 0 9M15-4q6 7 0 15" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  ),

  baston: (ids) => (
    <g>
      <path d="M0 30V-44" stroke={url(ids.wood)} strokeWidth="4" strokeLinecap="round" />
      <path d="M0 30V-44" stroke="rgba(255,255,255,.3)" strokeWidth="1.2" strokeLinecap="round" transform="translate(-1 0)" />
      <circle cx="0" cy="-52" r="8" fill="none" stroke={url(ids.gold)} strokeWidth="3.2" />
      <circle cx="0" cy="-52" r="8" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth=".9" />
      {[-6, -2.2, 2.2, 6].map((x) => <circle key={x} cx={x} cy={-45 + Math.abs(x) * 0.3} r="2.2" fill="none" stroke={url(ids.gold)} strokeWidth="1.5" />)}
      <path d="M0-60v-4" stroke={url(ids.gold)} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M-3-34l-2 9M0-34v10M3-34l2 9" stroke={url(ids.crimson)} strokeWidth="1.5" strokeLinecap="round" />
      <Spark x={9} y={-58} r={2.4} />
    </g>
  ),

  zafu: (ids) => (
    <g>
      <path d="M-30-3v6a30 10 0 0 0 60 0v-6z" fill={url(ids.plum)} stroke={EDGE} strokeWidth="1.2" />
      <ellipse cx="0" cy="-3" rx="30" ry="10" fill="#c9a8ff" stroke={EDGE} strokeWidth="1.2" />
      <ellipse cx="0" cy="-3" rx="30" ry="10" fill="none" stroke={url(ids.gold)} strokeWidth="1.3" strokeDasharray="4 3" opacity=".85" />
      <path d="M-20-9l-4 12M-8-12l-2 15M8-12l2 15M20-9l4 12" stroke="rgba(78,44,130,.35)" strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="-10" cy="-6" rx="9" ry="2.6" fill="rgba(255,255,255,.35)" />
      <circle cx="0" cy="-3" r="2.2" fill={url(ids.gold)} />
    </g>
  ),

  cuenco: (ids) => (
    <g transform="translate(34 -2)">
      <path d="M-13-9c0 11 26 11 26 0z" fill={url(ids.bronze)} stroke={EDGE} strokeWidth="1.1" />
      <ellipse cx="0" cy="-9" rx="13" ry="3.4" fill="#f5d39a" stroke={url(ids.gold)} strokeWidth="1.4" />
      <ellipse cx="0" cy="-9" rx="9" ry="1.8" fill="#c78b46" opacity=".8" />
      <path d="M13-16l9-9" stroke={url(ids.wood)} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="13" cy="-16" r="3" fill="#e9c7a4" stroke={EDGE} strokeWidth=".9" />
      <path d="M-18-16q-4 6 0 12M18-16q4 6 0 12" fill="none" stroke="rgba(255,255,255,.65)" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="0" cy="1" rx="12" ry="2" fill="rgba(15,44,68,.12)" />
    </g>
  ),

  farolillo: (ids) => (
    <g transform="translate(-36 -18)">
      <circle cx="0" cy="0" r="18" fill={url(ids.glow)} opacity=".75" />
      <path d="M0-24v-6" stroke={url(ids.wood)} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="-6" y="-24" width="12" height="4" rx="1.5" fill="#8f1030" stroke={EDGE} strokeWidth=".8" />
      <ellipse cx="0" cy="-2" rx="11" ry="16" fill={url(ids.lantern)} stroke={EDGE} strokeWidth="1.2" />
      <path d="M-10-10h20M-11-2h22M-10 6h20" stroke="rgba(160,60,20,.35)" strokeWidth="1" />
      <path d="M0-18v32" stroke="rgba(160,60,20,.25)" strokeWidth="1" />
      <ellipse cx="-4" cy="-8" rx="3" ry="6" fill="rgba(255,255,255,.55)" />
      <rect x="-6" y="13" width="12" height="4" rx="1.5" fill="#8f1030" stroke={EDGE} strokeWidth=".8" />
      <path d="M-2 17l-1 8M0 17v9M2 17l1 8" stroke={url(ids.crimson)} strokeWidth="1.4" strokeLinecap="round" />
    </g>
  ),

  yinyang: (ids) => (
    <g>
      <path d="M-16 -3Q-14 10 0 12Q14 10 16 -3" fill="none" stroke={url(ids.night)} strokeWidth="1.8" />
      <circle cy="12" r="2.2" fill={url(ids.gold)} />
      <g transform="translate(0 22)">
        <circle r="9.5" fill={url(ids.glow)} />
        <circle r="8.5" fill="#fffdf6" stroke={url(ids.gold)} strokeWidth="2.2" />
        <path d="M0 -8.5A8.5 8.5 0 0 1 0 8.5A4.25 4.25 0 0 1 0 0A4.25 4.25 0 0 0 0 -8.5Z" fill="#2c2540" />
        <circle cy="-4.25" r="1.5" fill="#2c2540" />
        <circle cy="4.25" r="1.5" fill="#fffdf6" />
      </g>
    </g>
  ),

  guirnalda: (ids) => (
    <g>
      <path d="M-22 -2Q-18 14 0 16Q18 14 22 -2" fill="none" stroke="#3f9a55" strokeWidth="2" />
      {[[-21, 1], [-17, 8], [-10, 13], [-3, 15.5], [4, 15.5], [11, 13], [17, 8], [21, 1]].map(([x, y], index) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse key={angle} cy="-2.6" rx="2.2" ry="2.8" fill={[url(ids.rose), url(ids.lantern), "#ffffff", url(ids.plum)][index % 4]} stroke="rgba(255,255,255,.7)" strokeWidth=".5" transform={`rotate(${angle})`} />
          ))}
          <circle r="1.4" fill={url(ids.gold)} />
        </g>
      ))}
    </g>
  ),

  abanico: (ids) => (
    <g>
      <path d="M0 0L-22.5 -13A26 26 0 0 1 22.5 -13Z" fill={url(ids.rose)} stroke={EDGE} strokeWidth="1.2" strokeLinejoin="round" />
      {[150, 130, 110, 90, 70, 50, 30].map((angle) => (
        <path key={angle} d={`M0 0L${(26 * Math.cos((angle * Math.PI) / 180)).toFixed(1)} ${(-26 * Math.sin((angle * Math.PI) / 180)).toFixed(1)}`} stroke="rgba(143,16,48,.35)" strokeWidth="1" />
      ))}
      <path d="M-22.5 -13A26 26 0 0 1 22.5 -13" fill="none" stroke={url(ids.gold)} strokeWidth="2.4" />
      <g transform="translate(-5 -17)">
        {[0, 72, 144, 216, 288].map((angle) => <ellipse key={angle} cy="-2.4" rx="2" ry="2.6" fill="#ffffff" transform={`rotate(${angle})`} />)}
        <circle r="1.3" fill={url(ids.gold)} />
      </g>
      <path d="M0 0v10" stroke={url(ids.wood)} strokeWidth="3" strokeLinecap="round" />
      <circle r="2.2" fill={url(ids.gold)} stroke={EDGE} strokeWidth=".8" />
      <path d="M-1 10l-2 9M1 10l2 9" stroke={url(ids.crimson)} strokeWidth="1.4" strokeLinecap="round" />
    </g>
  ),

  orbe: (ids) => (
    <g>
      <circle cy="-16" r="20" fill={url(ids.glow)} />
      <path d="M-9 -5q9 7 18 0l-4 7h-10z" fill={url(ids.gold)} stroke={EDGE} strokeWidth=".9" strokeLinejoin="round" />
      <circle cy="-16" r="11" fill={url(ids.aqua)} stroke={EDGE} strokeWidth="1.3" />
      <path d="M-6 -12c3 4 9 4 12-1M-7 -19c4-3 9-3 13 1" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="-4" cy="-21" rx="3.4" ry="2" fill="rgba(255,255,255,.85)" transform="rotate(-30 -4 -21)" />
      <Spark x={12} y={-30} r={3} />
      <Spark x={-13} y={-4} r={2} />
    </g>
  ),

  bonsai: (ids) => (
    <g transform="translate(38 -2)">
      <path d="M-12 -9h24l-3 9h-18Z" fill={url(ids.night)} stroke={EDGE} strokeWidth="1.1" strokeLinejoin="round" />
      <rect x="-14" y="-12" width="28" height="4" rx="2" fill={url(ids.gold)} />
      <path d="M1 -12c-2-7 5-10 1-17-3-5-8-6-10-11M2 -26c4-3 9-3 12-8" fill="none" stroke={url(ids.wood)} strokeWidth="3.2" strokeLinecap="round" />
      <g fill={url(ids.leaf)} stroke={EDGE} strokeWidth="1">
        <ellipse cx="-10" cy="-42" rx="10" ry="5.5" />
        <ellipse cx="14" cy="-36" rx="8.5" ry="4.8" />
        <ellipse cx="0" cy="-51" rx="7.5" ry="4.4" />
      </g>
      <circle cx="-4" cy="-13" r="2.4" fill={url(ids.leaf)} />
    </g>
  ),

  gong: (ids) => (
    <g transform="translate(-38 0)">
      <path d="M-14 0V-44M14 0V-44" stroke={url(ids.wood)} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M-20 -46c6 2 34 2 40 0" fill="none" stroke={url(ids.crimson)} strokeWidth="4" strokeLinecap="round" />
      <path d="M-6 -44l3 8M6 -44l-3 8" stroke="rgba(255,255,255,.7)" strokeWidth="1" />
      <circle cy="-24" r="12" fill={url(ids.bronze)} stroke={EDGE} strokeWidth="1.2" />
      <circle cy="-24" r="8" fill="none" stroke="rgba(143,83,34,.45)" strokeWidth="1.2" />
      <circle cy="-24" r="3.4" fill={url(ids.gold)} />
      <ellipse cx="-4" cy="-29" rx="3.6" ry="2" fill="rgba(255,255,255,.55)" transform="rotate(-30 -4 -29)" />
      <path d="M16 -4l10 -10" stroke={url(ids.wood)} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="26" cy="-14" r="3" fill="#e9c7a4" stroke={EDGE} strokeWidth=".8" />
    </g>
  ),

  "alas-pegaso": (ids) => (
    <Mirrored>
      <g>
        <path d="M4 0C20-30 52-46 80-32C62-28 50-18 46-8C58-12 70-10 78 0C62 2 50 8 42 16C52 18 60 24 64 32C46 30 26 22 4 6Z" fill={url(ids.wind)} stroke={EDGE} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M10-2C26-22 48-32 70-28M12 4C28-8 46-14 66-12M14 8C30 4 44 6 56 12" fill="none" stroke="rgba(120,170,255,.45)" strokeWidth="1.4" strokeLinecap="round" />
        <Spark x={74} y={-34} r={3} />
        <Spark x={76} y={4} r={2.2} />
      </g>
    </Mirrored>
  ),

  "corona-nubes": (ids) => (
    <g transform="translate(0 -4)">
      <path d="M-12-9a12 12 0 0 1 24 0" fill="none" stroke="#ff8f9c" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M-9-9a9 9 0 0 1 18 0" fill="none" stroke="#ffd86b" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M-6-9a6 6 0 0 1 12 0" fill="none" stroke="#8fd6ff" strokeWidth="2.2" strokeLinecap="round" />
      {[[-19, -2, 5.5], [-9, -6, 6.5], [2, -7, 6], [12, -5, 6.5], [21, -1, 5.5], [-14, 2, 4.5], [7, 1, 5], [17, 3, 4.2]].map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#ffffff" stroke={url(ids.wind)} strokeWidth="1.2" />
      ))}
      <ellipse cx="-11" cy="-8" rx="3" ry="1.6" fill="rgba(255,255,255,.9)" />
    </g>
  ),

  "estela-viento": (ids) => (
    <g>
      <path d="M0 0c14-6 24-2 30-12c3-6-4-10-8-4" fill="none" stroke={url(ids.wind)} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M2 5c10 2 20 5 24 13c2 4-2 8-6 6" fill="none" stroke={url(ids.wind)} strokeWidth="3.5" strokeLinecap="round" opacity=".9" />
      <path d="M0 0c14-6 24-2 30-12" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.2" strokeLinecap="round" />
      <Spark x={30} y={-20} r={3} />
      <Spark x={34} y={6} r={2.2} />
      <Spark x={18} y={16} r={1.8} />
    </g>
  ),

  "alas-fenix": (ids) => (
    <Mirrored>
      <g>
        <path d="M4 0C18-34 46-52 76-42C64-36 58-28 56-20C68-24 78-20 86-10C72-10 62-4 56 4C66 6 74 14 78 26C62 22 46 18 36 14C30 22 22 26 8 22Z" fill={url(ids.ember)} stroke="rgba(255,220,150,.9)" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 2C20-20 40-32 60-28C50-22 46-14 46-8C54-10 62-8 66-2C56-2 48 2 44 8C50 10 54 14 56 20C44 16 32 14 24 12C20 16 14 18 8 16Z" fill="#fff0a8" opacity=".55" />
        <g fill="#ffd166"><circle cx="70" cy="-46" r="2.2" /><circle cx="84" cy="-16" r="1.8" /><circle cx="80" cy="30" r="2" /><circle cx="52" cy="-42" r="1.4" /></g>
      </g>
    </Mirrored>
  ),

  "cuernos-brasa": (ids) => (
    <Mirrored>
      <g>
        <path d="M5 2C9-8 15-16 26-22C22-12 16-4 9 4Z" fill={url(ids.magma)} stroke={EDGE} strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M10-3l4-4M13-9l4-3M17-14l4-3" stroke="#ffd166" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="26" cy="-22" r="2.6" fill={url(ids.glow)} />
        <circle cx="26" cy="-22" r="1.3" fill="#fff3a3" />
      </g>
    </Mirrored>
  ),

  "cola-llama": (ids) => (
    <g>
      <path d="M0 2C10 6 20 4 26-6C30-14 26-26 18-32C22-22 18-14 12-12C16-20 12-30 4-36C6-24 0-18-2-8Z" fill={url(ids.ember)} stroke="rgba(255,220,150,.9)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M2 0C8 3 14 2 18-4C20-9 18-15 14-19C16-13 13-9 10-8C12-12 10-18 6-22C7-16 3-12 2-6Z" fill="#fff0a8" opacity=".75" />
      <g fill="#ffd166"><circle cx="28" cy="-24" r="1.8" /><circle cx="22" cy="-36" r="1.4" /><circle cx="8" cy="-40" r="1.6" /></g>
    </g>
  ),

  "alas-escarcha": (ids) => (
    <Mirrored>
      <g fill={url(ids.ice)} stroke="rgba(255,255,255,.95)" strokeWidth="1.2" strokeLinejoin="round" opacity=".92">
        <path d="M4-2L34-50L44-42L14 4Z" />
        <path d="M6 2L58-32L62-20L16 8Z" />
        <path d="M8 6L70-6L66 6L18 12Z" />
        <path d="M8 10L58 24L48 32L16 14Z" />
        <path d="M34-50L18-6M58-32L20 2M70-6L22 6M58 24L22 10" fill="none" stroke="rgba(120,180,255,.5)" strokeWidth=".9" />
        <Spark x={40} y={-52} r={2.6} fill="#eafcff" />
        <Spark x={72} y={-10} r={2.2} fill="#eafcff" />
      </g>
    </Mirrored>
  ),

  "cuernos-hielo": (ids) => (
    <Mirrored>
      <g>
        <path d="M4 2L13-24L20-19L12 4Z" fill={url(ids.ice)} stroke="rgba(255,255,255,.95)" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M13-24L14-4" stroke="rgba(255,255,255,.9)" strokeWidth="1" />
        <path d="M9-8L17-11" stroke="rgba(120,180,255,.5)" strokeWidth=".9" />
        <Spark x={17} y={-28} r={2.4} fill="#eafcff" />
      </g>
    </Mirrored>
  ),

  "cola-sirena": (ids) => (
    <g>
      <path d="M0 0C10 3 18-2 24-10" fill="none" stroke={url(ids.aqua)} strokeWidth="6" strokeLinecap="round" />
      <path d="M24-10C34-26 48-24 50-14C42-12 34-8 30-2C38 0 46 4 50 12C40 14 30 10 24-2Z" fill={url(ids.aqua)} stroke="rgba(255,255,255,.9)" strokeWidth="1.3" strokeLinejoin="round" opacity=".95" />
      <path d="M28-8c6-8 12-10 18-8M28 0c6 4 12 6 18 8" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M4-3q3 3 6 0M10-4q3 3 6 0M16-7q3 3 6 0" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1" />
      <Spark x={48} y={-22} r={2.4} fill="#eafcff" />
    </g>
  ),

  "alas-hoja": (ids) => (
    <Mirrored>
      <g stroke={EDGE} strokeWidth="1.3" strokeLinejoin="round">
        <path d="M4 0C20-30 46-42 74-34C56-20 38-8 8 4Z" fill={url(ids.leaf)} transform="rotate(-16)" opacity=".75" />
        <path d="M4 0C20-30 46-42 74-34C56-20 38-8 8 4Z" fill={url(ids.leaf)} />
        <path d="M4 0C20-30 46-42 74-34C56-20 38-8 8 4Z" fill={url(ids.leaf)} transform="rotate(18)" opacity=".6" />
        <path d="M8-1C30-20 50-28 68-32M10 6C32-6 50-10 66-12" fill="none" stroke="rgba(46,139,75,.5)" strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="66" cy="-38" r="2.4" fill="#ffd5e7" />
      </g>
    </Mirrored>
  ),

  "astas-flores": (ids) => (
    <g>
      <Mirrored>
        <g fill="none" stroke={url(ids.wood)} strokeWidth="3.2" strokeLinecap="round">
          <path d="M4 2C8-8 10-18 19-28" />
          <path d="M12-15C16-19 21-21 27-21" />
          <path d="M9-9C14-11 16-15 18-19" />
        </g>
      </Mirrored>
      {[[19, -28], [27, -21], [-19, -28]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          {[0, 72, 144, 216, 288].map((angle) => <ellipse key={angle} cx={x} cy={y - 2.6} rx="1.7" ry="2.6" fill={url(ids.rose)} transform={`rotate(${angle} ${x} ${y})`} />)}
          <circle cx={x} cy={y} r="1.3" fill="#fff0b8" />
        </g>
      ))}
      <g transform="translate(-27 -21)">
        <path d="M0 0c-6-6-10-2-6 3c-4-1-8 3-2 6zM0 0c6-6 10-2 6 3c4-1 8 3 2 6z" fill="#8fd6ff" stroke={EDGE} strokeWidth=".8" />
        <path d="M0-1v8" stroke="#3b3550" strokeWidth="1" strokeLinecap="round" />
      </g>
    </g>
  ),

  "cola-hojas": (ids) => (
    <g>
      <path d="M0 0c10-2 18-10 16-22" fill="none" stroke="#3f9a55" strokeWidth="2.2" strokeLinecap="round" />
      {[-8, -34, -60].map((angle, index) => (
        <path key={angle} d="M0 0C8-7 20-9 30-4C20 3 8 5 0 0Z" fill={url(ids.leaf)} opacity={[0.8, 1, 0.6][index]} stroke={EDGE} strokeWidth="1.1" transform={`rotate(${angle})`} />
      ))}
      <path d="M2-1C10-5 18-6 26-4" fill="none" stroke="rgba(46,139,75,.45)" strokeWidth=".9" transform="rotate(-34)" />
      <circle cx="16" cy="-24" r="2.4" fill="#ffd5e7" stroke={EDGE} strokeWidth=".8" />
    </g>
  ),
};

/** Aura del año: se enciende a los 365 días de vínculo y ya no se apaga. */
export function AncestralAura({ ids }: { ids: ItemIds }) {
  return (
    <g className="pet-aura-ancestral">
      <circle cx="80" cy="80" r="70" fill={url(ids.glow)} opacity=".35" />
      <circle cx="80" cy="80" r="76" fill="none" stroke={url(ids.gold)} strokeWidth="2.6" strokeDasharray="2 9" opacity=".8" />
      <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1" opacity=".8" />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <Spark key={angle} x={80 + 76 * Math.cos((angle * Math.PI) / 180)} y={80 + 76 * Math.sin((angle * Math.PI) / 180)} r={3.4} />
      ))}
    </g>
  );
}
