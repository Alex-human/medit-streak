import type { ReactNode } from "react";
import type { PetKind, PetMood } from "@/lib/social/domain";
import Face from "./PetFace";
import { Spark, type ItemIds } from "./PetItems";

/*
 * Las seis formas altas de cada elemento (etapas 7 a 12). Cada elemento cambia dos veces de
 * criatura y termina en una forma Eterna completamente distinta:
 *   fuego:  dragón de brasa -> fénix -> sol eterno
 *   agua:   ajolote de escarcha -> dragón de las mareas -> ballena celeste
 *   bosque: cervatillo -> tortuga-bosque -> mariposa lunar
 *   nube:   búho de tormenta -> pegaso de nube -> luna de los sueños
 */

export type Fills = { body: string; soft: string; accent: string };
export type Paint = Record<keyof ItemIds, string>;
type FormProps = { tier: number; mood: PetMood; fills: Fills; paint: Paint };

const EDGE = "rgba(255,255,255,.82)";
const BARK = "#8a5c38";

/** El mismo dibujo a la izquierda y reflejado a la derecha sobre el eje central. */
function Pair({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <g transform="matrix(-1 0 0 1 160 0)">{children}</g>
    </>
  );
}

/** Cuerpo alargado (cuello, cola, anillos) como trazo grueso con borde blanco. */
function Tube({ d, width, fill }: { d: string; width: number; fill: string }) {
  return (
    <>
      <path d={d} fill="none" stroke={EDGE} strokeWidth={width + 5} strokeLinecap="round" />
      <path d={d} fill="none" stroke={fill} strokeWidth={width} strokeLinecap="round" />
    </>
  );
}

function Flower({ x, y, r = 3, fill = "#ffd5e7" }: { x: number; y: number; r?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse key={angle} cy={-r * 0.9} rx={r * 0.7} ry={r * 0.95} fill={fill} transform={`rotate(${angle})`} />
      ))}
      <circle r={r * 0.45} fill="#fff0b8" />
    </g>
  );
}

function Fireflies({ points }: { points: [number, number][] }) {
  return (
    <g>
      {points.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="4.5" fill="#fff3a8" opacity=".35" />
          <circle cx={x} cy={y} r="1.8" fill="#fff6c8" />
        </g>
      ))}
    </g>
  );
}

/* ---------- Fuego ---------- */

/** Sabia y Heroica: un dragoncito rechoncho con alas de murciélago y cola en llamas. */
function EmberDragon({ plus, mood, fills: { body, soft, accent }, paint }: { plus: boolean } & Omit<FormProps, "tier">) {
  return (
    <>
      {plus ? <circle cx="80" cy="84" r="70" fill={paint.glow} opacity=".55" /> : null}
      <g className="pet-wings">
        <Pair>
          <path
            d={plus ? "M60 92C44 62 22 40 4 38c6 12 6 22 2 32 10-2 16 2 18 10 8-4 14-2 18 6 6-4 12-2 16 6Z" : "M62 94C48 70 32 56 16 54c4 10 4 18 1 26 8-2 13 2 15 9 6-3 11-1 14 5 5-3 9-1 12 4Z"}
            fill={plus ? paint.ember : soft}
            stroke={EDGE}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d={plus ? "M58 90C44 70 26 52 8 42M52 88C40 78 26 72 10 70M50 94C40 88 32 84 24 82" : "M60 92C48 76 36 64 18 56M54 90C44 82 32 78 18 78"}
            fill="none"
            stroke="rgba(239,66,111,.38)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </Pair>
      </g>

      <g className="pet-tail">
        <Tube d="M104 126c20 8 38 0 40-18" width={12} fill={body} />
        <path
          d={plus ? "M142 112c-12-6-12-20-4-30 1 8 6 10 10 10-2-8 2-16 8-20 1 10 6 18 2 28-3 8-9 12-16 12Z" : "M142 110c-8-5-8-14-2-21 1 5 4 7 7 7-1-5 1-10 5-13 1 7 4 12 1 19-2 5-6 8-11 8Z"}
          fill={plus ? paint.ember : accent}
          stroke={EDGE}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </g>

      <Pair>
        <ellipse cx="50" cy="112" rx="8" ry="11" fill={body} stroke={EDGE} strokeWidth="2.4" transform="rotate(22 50 112)" />
        <ellipse cx="64" cy="144" rx="13" ry="7" fill={accent} stroke={EDGE} strokeWidth="2.4" />
      </Pair>
      <path d="M80 74c24 0 36 22 34 44-2 18-15 28-34 28s-32-10-34-28c-2-22 10-44 34-44Z" fill={body} stroke={EDGE} strokeWidth="3" />
      <path d="M80 98c12 0 18 10 18 21 0 12-8 19-18 19s-18-7-18-19c0-11 6-21 18-21Z" fill={soft} opacity=".92" />
      <path d="M69 112h22M67 121h26M69 130h22" stroke="rgba(239,66,111,.25)" strokeWidth="2" strokeLinecap="round" />
      {plus ? (
        <g>
          <circle cx="80" cy="104" r="8" fill={paint.glow} />
          <path d="M80 97l6 7-6 8-6-8Z" fill={paint.gold} stroke={EDGE} strokeWidth="1.4" strokeLinejoin="round" />
        </g>
      ) : null}

      <Pair>
        <path d="M60 44C54 32 46 20 34 14c14-2 26 8 32 22Z" fill={plus ? paint.gold : accent} stroke={EDGE} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M48 70l-16-6 6 10-8 5 18 1Z" fill={accent} stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
      </Pair>
      <circle cx="80" cy="66" r="34" fill={body} stroke={EDGE} strokeWidth="3" />
      <ellipse cx="80" cy="82" rx="19" ry="10" fill={soft} opacity=".5" />
      <ellipse cx="64" cy="48" rx="11" ry="6" fill="rgba(255,255,255,.35)" transform="rotate(-24 64 48)" />
      {(plus ? [[66, 36, 0.8], [80, 29, 1], [94, 36, 0.8]] : [[80, 31, 0.9]]).map(([x, y, s]) => (
        <path key={x} d="M0 0c7 7 9 14 4 20 0-5-4-7-4-7s-4 2-4 7c-5-6-3-13 4-20Z" transform={`translate(${x} ${y - 10}) scale(${s})`} fill={paint.ember} stroke={EDGE} strokeWidth="1.8" strokeLinejoin="round" />
      ))}
      <Face mood={mood} y={64} />
      {plus ? (
        <g>
          <Spark x={20} y={112} r={4} />
          <Spark x={140} y={60} r={4.4} />
          <Spark x={124} y={22} r={3.4} />
          <circle cx="30" cy="30" r="2.2" fill="#ffd166" />
          <circle cx="134" cy="132" r="2" fill="#ffd166" />
        </g>
      ) : (
        <Spark x={26} y={112} r={3.6} />
      )}
    </>
  );
}

const FEATHER = "M0 0C-10 -8 -34 -10 -54 -2C-34 6 -12 6 0 0Z";

/** Legendaria, Mítica y Celestial: un fénix que gana plumas, anillo de fuego y, al final, un sol detrás. */
function Phoenix({ level, mood, fills: { body, soft, accent }, paint }: { level: number } & Omit<FormProps, "tier">) {
  const plumes = level === 0 ? [-48, -24, 24, 48] : [-70, -46, -22, 22, 46, 70];
  const feathers: [number, number, string][] = [
    [44, 1.05, accent],
    [24, 1.15, paint.ember],
    [4, 1.05, soft],
    [-16, 0.85, accent],
  ];
  const wingScale = level === 0 ? 1 : 1.18;
  return (
    <>
      {level === 2 ? (
        <g>
          <circle cx="80" cy="74" r="74" fill={paint.glow} />
          <circle cx="80" cy="74" r="60" fill={paint.lantern} opacity=".35" />
          <circle cx="80" cy="74" r="60" fill="none" stroke={paint.gold} strokeWidth="2.4" />
        </g>
      ) : null}
      {level >= 1 ? <circle className="pet-orbit" cx="80" cy="80" r="66" fill="none" stroke={paint.ember} strokeWidth="3" strokeDasharray="9 9" opacity=".55" /> : null}

      <g className="pet-tail">
        {plumes.map((angle) => (
          <g key={angle} transform={`rotate(${angle} 80 120)`}>
            <path d="M80 120c-8 14-8 30 0 42 8-12 8-28 0-42Z" fill={Math.abs(angle) < 30 ? paint.ember : accent} stroke={EDGE} strokeWidth="2" />
            <circle cx="80" cy="152" r="5.4" fill={level === 0 ? soft : paint.gold} stroke={EDGE} strokeWidth="1.4" />
            <circle cx="80" cy="152" r="2.2" fill={paint.crimson} />
          </g>
        ))}
      </g>

      <g className="pet-wings">
        <Pair>
          {feathers.slice(0, level === 0 ? 3 : 4).map(([angle, scale, fill]) => (
            <path key={angle} d={FEATHER} transform={`translate(58 94) rotate(${angle}) scale(${scale * wingScale})`} fill={fill} stroke={EDGE} strokeWidth="1.8" strokeLinejoin="round" />
          ))}
          {level === 2 ? <path d={FEATHER} transform="translate(60 88) rotate(64) scale(0.8)" fill={paint.gold} stroke={EDGE} strokeWidth="1.6" /> : null}
        </Pair>
      </g>

      {[-28, 0, 28].slice(0, level === 0 ? 3 : 3).map((angle) => (
        <path key={angle} d="M0 0C-8 -8 -6 -22 2 -32C2 -22 10 -18 8 -8C6 -3 3 0 0 0Z" transform={`translate(80 44) rotate(${angle}) scale(${angle === 0 ? 1.15 : 0.9})`} fill={level === 2 ? paint.gold : paint.ember} stroke={EDGE} strokeWidth="1.8" strokeLinejoin="round" />
      ))}

      <path d="M80 62c22 0 32 22 30 44-2 20-14 32-30 32s-28-12-30-32c-2-22 8-44 30-44Z" fill={body} stroke={EDGE} strokeWidth="3" />
      <path d="M80 94c10 0 16 10 15 21-1 11-7 17-15 17s-14-6-15-17c-1-11 5-21 15-21Z" fill={soft} opacity=".9" />
      <path d="M72 108l8 5 8-5M72 118l8 5 8-5" stroke="rgba(239,66,111,.35)" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Pair>
        <path d="M72 136l-4 8M74 137v9M76 136l4 8" stroke="#f6b73c" strokeWidth="2.4" strokeLinecap="round" />
      </Pair>
      <circle cx="80" cy="60" r="27" fill={body} stroke={EDGE} strokeWidth="3" />
      <ellipse cx="66" cy="46" rx="10" ry="5.5" fill="rgba(255,255,255,.35)" transform="rotate(-24 66 46)" />
      {level === 2 ? <path d="M66 38l4-11 10 7 10-7 4 11Z" fill={paint.gold} stroke={EDGE} strokeWidth="1.6" strokeLinejoin="round" /> : null}
      <Face mood={mood} y={60} beak />
      <Spark x={24} y={50} r={4.4} />
      <Spark x={138} y={40} r={3.8} />
      {level >= 1 ? <Spark x={20} y={124} r={3.6} /> : null}
      {level === 2 ? <Spark x={142} y={118} r={4} fill="#ffe27a" /> : null}
    </>
  );
}

/** Eterna: un sol vivo con corona de llamas y tres pequeños soles en órbita. */
function EternalSun({ mood, fills, paint }: Omit<FormProps, "tier">) {
  return (
    <>
      <circle cx="80" cy="80" r="78" fill={paint.glow} />
      <g className="pet-sun-rays">
        {Array.from({ length: 16 }, (_, index) => (
          <path
            key={index}
            transform={`rotate(${index * 22.5} 80 80)`}
            d={index % 2 ? "M74 38C71 30 75 24 78 16C79 21 82 23 84 21C83 26 88 31 86 38Z" : "M72 38C68 26 74 16 78 4C79 12 83 15 86 13C85 20 91 28 88 38Z"}
            fill={index % 2 ? paint.lantern : paint.ember}
            stroke="rgba(255,240,200,.9)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        ))}
      </g>
      <circle cx="80" cy="80" r="50" fill="none" stroke={paint.gold} strokeWidth="4" />
      <circle cx="80" cy="80" r="46" fill={fills.body} stroke="rgba(255,248,220,.95)" strokeWidth="3" />
      <circle cx="80" cy="80" r="38" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="2" />
      <ellipse cx="64" cy="60" rx="15" ry="8" fill="rgba(255,255,255,.42)" transform="rotate(-26 64 60)" />
      <Face mood={mood} y={84} />
      <g className="pet-orbit">
        {[0, 120, 240].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 80 80)`}>
            <circle cx="80" cy="18" r="7" fill={paint.glow} />
            <circle cx="80" cy="18" r="4.4" fill={paint.gold} stroke="#fffbe6" strokeWidth="1.2" />
          </g>
        ))}
      </g>
      <Spark x={14} y={30} r={4.4} />
      <Spark x={148} y={128} r={4} />
    </>
  );
}

/* ---------- Agua ---------- */

const FROND = "M0 0C-6 -5 -18 -8 -27 -3C-21 1 -19 3 -15 4C-19 6 -21 9 -23 13C-13 13 -6 8 0 4Z";

/** Sabia y Heroica: un ajolote de escarcha con branquias rosadas; el heroico lleva corona de hielo. */
function FrostAxolotl({ plus, mood, fills: { body, soft }, paint }: { plus: boolean } & Omit<FormProps, "tier">) {
  return (
    <>
      {plus ? (
        <g>
          <circle cx="80" cy="84" r="70" fill={paint.glow} opacity=".5" />
          <Pair>
            <path d="M52 108L34 90l24 6Z" fill={paint.ice} stroke={EDGE} strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M50 120L28 114l24-4Z" fill={paint.ice} stroke={EDGE} strokeWidth="1.8" strokeLinejoin="round" />
          </Pair>
        </g>
      ) : null}
      <path className="pet-tail" d="M104 122c18 2 34-8 40-24 3 12-1 25-10 32-9 6-21 6-30 0Z" fill={plus ? paint.ice : soft} stroke={EDGE} strokeWidth="2.4" strokeLinejoin="round" />
      <Pair>
        <ellipse cx="62" cy="140" rx="11" ry="6.5" fill={body} stroke={EDGE} strokeWidth="2.2" />
        <ellipse cx="53" cy="118" rx="7" ry="10" fill={body} stroke={EDGE} strokeWidth="2.2" transform="rotate(26 53 118)" />
      </Pair>
      <ellipse cx="80" cy="118" rx="31" ry="24" fill={body} stroke={EDGE} strokeWidth="3" />
      <ellipse cx="80" cy="124" rx="18" ry="14" fill="#ffffff" opacity=".42" />
      <Pair>
        {[26, 0, -26].map((angle) => (
          <path key={angle} d={FROND} transform={`translate(40 72) rotate(${angle}) scale(${plus ? 1.18 : 1})`} fill={plus ? paint.prism : paint.rose} stroke={EDGE} strokeWidth="1.8" strokeLinejoin="round" />
        ))}
      </Pair>
      <ellipse cx="80" cy="78" rx="44" ry="34" fill={body} stroke={EDGE} strokeWidth="3" />
      <ellipse cx="62" cy="58" rx="14" ry="7" fill="rgba(255,255,255,.45)" transform="rotate(-18 62 58)" />
      <g fill={paint.aqua} opacity=".35">
        <circle cx="96" cy="56" r="3" />
        <circle cx="104" cy="64" r="2" />
        <circle cx="58" cy="100" r="2.4" />
      </g>
      <Pair>
        <ellipse cx="52" cy="95" rx="7" ry="3.4" fill="rgba(255,140,180,.35)" />
      </Pair>
      {plus ? <path d="M64 50l4-18 7 13 5-20 5 20 7-13 4 18Z" fill={paint.ice} stroke={EDGE} strokeWidth="2" strokeLinejoin="round" /> : null}
      <Face mood={mood} y={82} />
      <g fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="1.4">
        <circle cx="130" cy="44" r="4" />
        <circle cx="140" cy="30" r="2.6" />
        {plus ? <circle cx="22" cy="36" r="3.4" /> : null}
      </g>
      {plus ? (
        <g>
          <Spark x={14} y={60} r={3.2} fill="#eafcff" />
          <Spark x={146} y={62} r={3.2} fill="#eafcff" />
          <Spark x={120} y={20} r={3.8} fill="#eafcff" />
        </g>
      ) : null}
    </>
  );
}

/** Legendaria, Mítica y Celestial: un dragón marino que asoma de las olas y acaba coronado con su perla. */
function TideDragon({ level, mood, fills: { body, soft, accent }, paint }: { level: number } & Omit<FormProps, "tier">) {
  return (
    <>
      {level === 2 ? (
        <g className="pet-orbit">
          <ellipse cx="80" cy="80" rx="74" ry="74" fill="none" stroke={paint.aqua} strokeWidth="2.4" strokeDasharray="3 9" opacity=".75" />
        </g>
      ) : null}
      <path d="M4 124c12-9 24-9 36 0s26 9 40 0 26-9 40 0 24 9 36 0c3 10 1 18-6 22-22 8-48 10-70 10s-48-2-70-10c-7-4-9-12-6-22Z" fill={paint.aqua} opacity=".5" />
      <Tube d="M26 132c0-26 28-26 28 0" width={14} fill={body} />
      <Tube d="M108 132c0-30 32-30 32 0" width={16} fill={body} />
      <g fill={accent} stroke={EDGE} strokeWidth="1.6" strokeLinejoin="round">
        <path d="M36 110l4-10 5 9Z" />
        <path d="M118 106l5-11 6 10Z" />
        <path d="M130 108l5-10 5 10Z" />
      </g>
      <Tube d="M84 136C66 118 98 100 80 74" width={24} fill={body} />
      <path d="M84 136C66 118 98 100 80 74" fill="none" stroke={soft} strokeWidth="8" strokeLinecap="round" opacity=".45" />
      {level >= 1 ? (
        <g fill={accent} stroke={EDGE} strokeWidth="1.4" strokeLinejoin="round">
          <path d="M92 90l12-4-8 10Z" />
          <path d="M86 108l12-2-9 9Z" />
        </g>
      ) : null}
      <path d="M8 134c12-7 22-7 34 0s24 7 38 0 26-7 38 0 22 7 34 0c2 8 0 13-6 16-20 7-44 9-66 9s-46-2-66-9c-6-3-8-8-6-16Z" fill={paint.aqua} stroke="rgba(255,255,255,.8)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 133c6-3 12-3 16 0M58 137c6-3 12-3 16 0M108 133c6-3 12-3 16 0" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" />

      <Pair>
        <path d="M54 50C40 38 26 36 14 40c9 4 13 9 15 15-7 0-11 3-13 7 13 4 26 1 38-6Z" fill={accent} stroke={EDGE} strokeWidth="2" strokeLinejoin="round" />
        <path d="M50 50C40 44 30 42 20 44M50 54C42 54 34 56 26 60" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.2" strokeLinecap="round" />
        {level >= 1 ? <path d="M64 30L58 8l14 16Z" fill={paint.ice} stroke={EDGE} strokeWidth="1.8" strokeLinejoin="round" /> : null}
      </Pair>
      <ellipse cx="80" cy="54" rx="32" ry="28" fill={body} stroke={EDGE} strokeWidth="3" />
      <ellipse cx="80" cy="70" rx="18" ry="8.5" fill={soft} opacity=".6" />
      <ellipse cx="66" cy="38" rx="10" ry="5" fill="rgba(255,255,255,.45)" transform="rotate(-20 66 38)" />
      {level >= 1 ? (
        <path d="M60 70c-14 2-24 10-28 22M100 70c14 2 24 10 28 22" stroke={soft} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      ) : null}
      {level === 2 ? <path d="M64 30l3-14 7 9 6-14 6 14 7-9 3 14Z" fill={paint.gold} stroke={EDGE} strokeWidth="1.8" strokeLinejoin="round" /> : null}
      <Face mood={mood} y={54} />
      {level === 2 ? (
        <g>
          <circle cx="132" cy="36" r="12" fill={paint.glow} />
          <circle cx="132" cy="36" r="7" fill={paint.moon} stroke={EDGE} strokeWidth="1.6" />
        </g>
      ) : null}
      <Spark x={24} y={24} r={3.8} fill="#eafcff" />
      {level >= 1 ? <Spark x={146} y={70} r={3.4} fill="#eafcff" /> : null}
    </>
  );
}

/** Eterna: una ballena que nada por el cielo con una constelación en el lomo. */
function SkyWhale({ mood, fills: { body }, paint }: Omit<FormProps, "tier">) {
  return (
    <>
      <circle cx="80" cy="84" r="76" fill={paint.glow} opacity=".6" />
      <ellipse className="pet-orbit" cx="80" cy="86" rx="74" ry="30" fill="none" stroke={paint.gold} strokeWidth="1.6" strokeDasharray="2 8" opacity=".75" />
      <g className="pet-tail">
        <Tube d="M116 90C130 78 136 62 132 44" width={16} fill={paint.night} />
        <path d="M132 50C124 38 112 32 100 32c6 7 14 13 30 20 10-9 20-14 30-15-12-6-22-4-28 5Z" fill={paint.night} stroke={EDGE} strokeWidth="2.4" strokeLinejoin="round" />
      </g>
      <Pair>
        <path d="M34 108c-12 4-22 12-24 24 13 0 24-7 28-18Z" fill={paint.night} stroke={EDGE} strokeWidth="2.4" strokeLinejoin="round" />
      </Pair>
      <path d="M80 44c38 0 60 22 60 48 0 26-26 42-60 42S20 118 20 92c0-26 22-48 60-48Z" fill={body} stroke={EDGE} strokeWidth="3" />
      <path d="M22 84c2-24 26-40 58-40s56 16 58 40c-16-8-36-12-58-12S38 76 22 84Z" fill={paint.night} />
      <g fill="#fffbe6">
        {[[46, 62], [60, 54], [78, 58], [96, 52], [112, 60], [70, 68]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" />)}
      </g>
      <path d="M46 62L60 54L78 58L96 52L112 60M78 58L70 68" stroke="rgba(255,251,230,.55)" strokeWidth=".9" fill="none" />
      <path d="M32 108c14 16 30 24 48 24s34-8 48-24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeLinecap="round" />
      <path d="M44 118c10 7 22 10 36 10s26-3 36-10" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M80 44c-2-10-10-16-18-16M80 44c0-12 0-18 0-26M80 44c2-10 10-16 18-16" stroke={paint.aqua} strokeWidth="4" fill="none" strokeLinecap="round" />
      <Spark x={62} y={24} r={4} fill="#eafcff" />
      <Spark x={80} y={12} r={4.6} />
      <Spark x={98} y={24} r={4} fill="#eafcff" />
      <Face mood={mood} y={98} />
      <Spark x={16} y={48} r={3.6} />
      <Spark x={148} y={116} r={3.6} fill="#eafcff" />
    </>
  );
}

/* ---------- Bosque ---------- */

/** Sabia y Heroica: un cervatillo con astas que brotan; el heroico florece y lleva luciérnagas. */
function Fawn({ plus, mood, fills: { body, soft }, paint }: { plus: boolean } & Omit<FormProps, "tier">) {
  return (
    <>
      {plus ? <circle cx="80" cy="84" r="70" fill={paint.glow} opacity=".5" /> : null}
      <ellipse cx="108" cy="116" rx="7" ry="5" fill="#fff4dc" stroke={EDGE} strokeWidth="1.6" />
      <Pair>
        <Tube d="M68 128v17" width={8} fill={body} />
        <ellipse cx="68" cy="148" rx="5" ry="3" fill="#4a2c1c" />
      </Pair>
      <ellipse cx="80" cy="122" rx="30" ry="18" fill={body} stroke={EDGE} strokeWidth="2.6" />
      <g fill="#fff4dc" opacity=".85">
        <circle cx="66" cy="116" r="3" />
        <circle cx="78" cy="111" r="2.4" />
        <circle cx="93" cy="117" r="3" />
        <circle cx="85" cy="125" r="2.2" />
      </g>
      {plus ? (
        <g>
          <path d="M60 108c6 6 14 8 20 8s14-2 20-8" fill="none" stroke="#3f9a55" strokeWidth="2" />
          {[[62, 110], [70, 114], [80, 116], [90, 114], [98, 110]].map(([x, y], index) => (
            <Flower key={x} x={x} y={y} r={3.2} fill={index % 2 ? "#fff" : "#ffc8dc"} />
          ))}
        </g>
      ) : null}
      <Pair>
        <g fill="none" stroke={BARK} strokeWidth="4.5" strokeLinecap="round">
          <path d={plus ? "M66 50C58 36 56 22 62 6M60 32C50 28 42 20 40 8M58 42C48 42 38 38 32 30M62 18C68 14 70 8 70 2" : "M66 50C60 38 58 28 62 16M61 34C53 30 47 24 45 16"} />
        </g>
        <g fill={soft} stroke={EDGE} strokeWidth="1.2">
          <ellipse cx={plus ? 62 : 62} cy={plus ? 6 : 16} rx="6" ry="3.4" transform={`rotate(-40 62 ${plus ? 6 : 16})`} />
          <ellipse cx={plus ? 40 : 45} cy={plus ? 8 : 16} rx="5.4" ry="3" transform={`rotate(30 ${plus ? 40 : 45} ${plus ? 8 : 16})`} />
          {plus ? <ellipse cx="32" cy="30" rx="5" ry="3" transform="rotate(10 32 30)" /> : null}
        </g>
        <path d="M50 66C36 60 24 62 16 68c8 8 22 10 34 6Z" fill={body} stroke={EDGE} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M46 67C38 65 30 66 24 69c6 4 14 5 21 3Z" fill="#ffc8d6" />
      </Pair>
      {plus ? (
        <g>
          <Flower x={62} y={20} r={4} />
          <Flower x={98} y={20} r={4} fill="#fff" />
          <Flower x={44} y={24} r={3.4} fill="#fff" />
          <Flower x={116} y={24} r={3.4} />
          <path d="M40 8c-4 10-2 18 4 24" fill="none" stroke="#5fb96d" strokeWidth="1.6" />
        </g>
      ) : (
        <Flower x={98} y={22} r={3.6} />
      )}
      <path d="M80 44c24 0 36 18 34 38-2 18-16 30-34 30S48 100 46 82c-2-20 10-38 34-38Z" fill={body} stroke={EDGE} strokeWidth="3" />
      <ellipse cx="80" cy="99" rx="17" ry="11" fill="#fff4dc" />
      <g fill="#fff4dc" opacity=".8">
        <circle cx="68" cy="56" r="2.4" />
        <circle cx="92" cy="56" r="2.4" />
        <circle cx="80" cy="52" r="2" />
      </g>
      <ellipse cx="80" cy="88" rx="4.2" ry="2.8" fill="#4a2c1c" />
      <Face mood={mood} y={77} />
      {plus ? <Fireflies points={[[20, 90], [140, 84], [128, 40], [30, 126], [146, 128]]} /> : <Fireflies points={[[22, 96], [138, 88]]} />}
    </>
  );
}

/** Legendaria, Mítica y Celestial: una tortuga que lleva un bosque encima; al final da frutos dorados. */
function ForestTurtle({ level, mood, fills: { body, soft, accent }, paint }: { level: number } & Omit<FormProps, "tier">) {
  const canopy: [number, number, number][] = [
    [80, 26, 20],
    [60, 36, 14],
    [100, 36, 14],
    [68, 18, 12],
    [92, 18, 12],
  ];
  return (
    <>
      {level === 2 ? <circle cx="80" cy="60" r="70" fill={paint.glow} opacity=".55" /> : null}
      <Pair>
        <ellipse cx="32" cy="126" rx="12" ry="9" fill={soft} stroke={EDGE} strokeWidth="2.2" />
      </Pair>
      <path d="M80 74C78 60 83 52 80 38M80 58c-6-4-10-8-12-14M80 52c6-3 10-8 11-13" fill="none" stroke={BARK} strokeWidth="6" strokeLinecap="round" />
      <g stroke={EDGE} strokeWidth="2.2">
        {canopy.map(([x, y, r], index) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r * (level === 0 ? 0.92 : 1.05)} fill={index % 2 ? accent : soft} />)}
      </g>
      <ellipse cx="68" cy="16" rx="8" ry="4" fill="rgba(255,255,255,.35)" transform="rotate(-20 68 16)" />
      {level >= 1 ? (
        <g>
          <Flower x={64} y={30} r={3.6} />
          <Flower x={94} y={22} r={3.4} fill="#fff" />
          <Flower x={80} y={40} r={3} />
          <Flower x={104} y={40} r={3} fill="#fff" />
        </g>
      ) : null}
      {level === 2 ? (
        <g>
          {[[70, 26], [88, 32], [58, 40], [100, 28]].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r="6" fill={paint.glow} />
              <circle cx={x} cy={y} r="3.4" fill={paint.gold} stroke={EDGE} strokeWidth="1" />
            </g>
          ))}
        </g>
      ) : null}
      <path d="M22 118C22 82 48 62 80 62s58 20 58 56Z" fill={body} stroke={EDGE} strokeWidth="3" />
      <path d="M38 88c10-14 24-20 42-20s32 6 42 20c-12-5-26-7-42-7s-30 2-42 7Z" fill={accent} opacity=".9" />
      <g fill="none" stroke="rgba(70,40,20,.35)" strokeWidth="2" strokeLinejoin="round">
        <path d="M60 96l8-8h24l8 8-8 9H68Z" />
        <path d="M34 110l10-8 14 3M126 110l-10-8-14 3" />
      </g>
      {level >= 1 ? (
        <g>
          <path d="M30 112c0-6 4-10 8-10s8 4 8 10Z" fill={paint.crimson} stroke={EDGE} strokeWidth="1.4" />
          <circle cx="35" cy="107" r="1.2" fill="#fff" />
          <circle cx="41" cy="106" r="1.2" fill="#fff" />
          <path d="M116 110c0-5 3-8 7-8s7 3 7 8Z" fill={paint.crimson} stroke={EDGE} strokeWidth="1.4" />
        </g>
      ) : null}
      <path d="M18 118h124c0 6-4 10-10 10H28c-6 0-10-4-10-10Z" fill={BARK} stroke={EDGE} strokeWidth="2" />
      <Pair>
        <ellipse cx="46" cy="136" rx="13" ry="10" fill={soft} stroke={EDGE} strokeWidth="2.4" />
      </Pair>
      <circle cx="80" cy="120" r="29" fill={soft} stroke={EDGE} strokeWidth="3" />
      <ellipse cx="68" cy="104" rx="9" ry="5" fill="rgba(255,255,255,.4)" transform="rotate(-24 68 104)" />
      <Face mood={mood} y={119} />
      {level === 2 ? <Fireflies points={[[18, 70], [142, 64], [24, 30], [138, 22], [150, 100]]} /> : <Fireflies points={[[20, 72], [140, 66]]} />}
    </>
  );
}

/** Eterna: una mariposa lunar con alas de hoja y ocelos dorados. */
function LunaMoth({ mood, paint }: Omit<FormProps, "tier">) {
  return (
    <>
      <circle cx="80" cy="84" r="76" fill={paint.glow} opacity=".6" />
      <g className="pet-moth-wings">
        <Pair>
          <path d="M80 92C62 96 46 108 42 126c-3 12 4 22 -2 34 12-6 20-16 22-28 6-14 16-26 18-36Z" fill={paint.leaf} stroke={EDGE} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M80 80C66 44 34 16 12 22 4 42 14 70 42 86c14 6 28 4 38-6Z" fill={paint.leaf} stroke={EDGE} strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M78 80C60 58 40 38 20 28M78 82C58 72 40 66 22 64M76 86C60 86 48 84 36 82M78 96C66 104 56 116 50 132" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M12 22C4 42 14 70 42 86" fill="none" stroke={paint.gold} strokeWidth="2.6" strokeLinecap="round" opacity=".85" />
          <circle cx="40" cy="50" r="10" fill={paint.lantern} stroke={EDGE} strokeWidth="1.6" />
          <circle cx="40" cy="50" r="5" fill={paint.rose} />
          <circle cx="38.5" cy="48.5" r="1.8" fill="#ffffff" />
          <circle cx="56" cy="118" r="5.4" fill={paint.lantern} stroke={EDGE} strokeWidth="1.2" />
          <circle cx="56" cy="118" r="2.4" fill={paint.rose} />
        </Pair>
      </g>
      <ellipse cx="80" cy="104" rx="11" ry="26" fill="#fff6e0" stroke={EDGE} strokeWidth="2.4" />
      <path d="M71 100h18M70 110h20M72 120h16" stroke="rgba(200,160,90,.4)" strokeWidth="1.6" strokeLinecap="round" />
      <Pair>
        <path d="M72 48C66 34 58 24 48 16" fill="none" stroke="#e8d6a8" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M68 40l-5 1M64 33l-5 0M59 27l-5-1M54 21l-4-2M66 37l1-5M61 30l1-5M56 24l1-5" stroke="#e8d6a8" strokeWidth="1.6" strokeLinecap="round" />
      </Pair>
      <g fill="#fff8e8" stroke={EDGE} strokeWidth="1.4">
        {[56, 64, 72, 80, 88, 96, 104].map((x, index) => <circle key={x} cx={x} cy={index % 2 ? 84 : 86} r="6" />)}
      </g>
      <circle cx="80" cy="66" r="24" fill="#fff8e8" stroke={EDGE} strokeWidth="3" />
      <Face mood={mood} y={67} />
      <Spark x={20} y={112} r={4} />
      <Spark x={142} y={112} r={4} />
      <Spark x={80} y={10} r={4.6} />
      <Fireflies points={[[26, 140], [134, 144]]} />
    </>
  );
}

/* ---------- Nube ---------- */

/** Sabia y Heroica: un búho de nube de tormenta; el heroico abre las alas entre rayos. */
function StormOwl({ plus, mood, fills: { body, soft }, paint }: { plus: boolean } & Omit<FormProps, "tier">) {
  const bolt = "#ffe14f";
  return (
    <>
      {plus ? (
        <g>
          <circle cx="80" cy="86" r="72" fill={paint.glow} opacity=".5" />
          <g fill={bolt} stroke="#fff6c2" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M20 30l-8 16h7l-5 12 13-18h-7l5-10Z" />
            <path d="M140 26l-8 16h7l-5 12 13-18h-7l5-10Z" />
          </g>
        </g>
      ) : null}
      <g className="pet-wings">
        <Pair>
          {plus ? (
            [40, 20, 0].map((angle, index) => (
              <path key={angle} d={FEATHER} transform={`translate(46 96) rotate(${angle}) scale(${index === 1 ? 1.05 : 0.92})`} fill={index === 1 ? soft : body} stroke={EDGE} strokeWidth="1.8" strokeLinejoin="round" />
            ))
          ) : (
            <path d="M40 86c-11 12-13 30-5 44 9-4 13-14 13-26 0-8-2-14-8-18Z" fill={body} stroke={EDGE} strokeWidth="2.4" strokeLinejoin="round" />
          )}
        </Pair>
      </g>
      <Pair>
        <path d="M56 50L46 22l22 20Z" fill={body} stroke={EDGE} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M70 140l-4 6M74 141v7M78 140l4 6" stroke="#f6c94c" strokeWidth="2.6" strokeLinecap="round" />
      </Pair>
      <path d="M80 40c28 0 44 20 44 46 0 24-6 40-16 48-6 4-12 2-16 6-4-4-8-6-12-6s-8 2-12 6c-4-4-10-2-16-6-10-8-16-24-16-48 0-26 16-46 44-46Z" fill={body} stroke={EDGE} strokeWidth="3" />
      <path d="M80 62c-6-6-14-8-22-6-10 4-14 14-12 24 2 12 14 18 24 16 4 0 8-2 10-4 2 2 6 4 10 4 10 2 22-4 24-16 2-10-2-20-12-24-8-2-16 0-22 6Z" fill={soft} opacity=".95" />
      <path d="M66 114l6 4 6-4M82 114l6 4 6-4M74 124l6 4 6-4" stroke="rgba(70,90,140,.4)" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M88 96l-9 12h7l-5 11 12-15h-7l5-8Z" fill={bolt} stroke="#fff6c2" strokeWidth="1.2" strokeLinejoin="round" />
      <ellipse cx="62" cy="52" rx="10" ry="5" fill="rgba(255,255,255,.42)" transform="rotate(-22 62 52)" />
      <Face mood={mood} y={80} beak />
      <g fill="#8fd8ff" opacity=".85">
        <path d="M28 138c0 3-2 5-4 5s-4-2-4-5 4-8 4-8 4 5 4 8Z" />
        <path d="M140 140c0 3-2 5-4 5s-4-2-4-5 4-8 4-8 4 5 4 8Z" />
      </g>
    </>
  );
}

/** Legendaria, Mítica y Celestial: un pegaso de nube; la crin se vuelve arcoíris y al final lleva halo y luna. */
function CloudPegasus({ level, mood, fills: { body, soft }, paint }: { level: number } & Omit<FormProps, "tier">) {
  const wing = level === 2 ? paint.prism : level === 1 ? paint.wind : soft;
  const mane = level === 0 ? [paint.wind, paint.wind, paint.wind] : [paint.rose, paint.lantern, paint.aqua];
  return (
    <>
      {level === 2 ? (
        <g>
          <circle cx="80" cy="80" r="74" fill={paint.glow} opacity=".6" />
          <circle className="pet-orbit" cx="80" cy="80" r="70" fill="none" stroke={paint.gold} strokeWidth="2" strokeDasharray="2 9" />
        </g>
      ) : null}
      <g className="pet-wings">
        <Pair>
          {[46, 28, 10, -8].slice(0, level === 0 ? 3 : 4).map((angle, index) => (
            <path key={angle} d={FEATHER} transform={`translate(62 100) rotate(${angle}) scale(${(index === 1 ? 1.2 : 1.05) * (level === 0 ? 0.95 : 1.1)})`} fill={wing} stroke={EDGE} strokeWidth="1.8" strokeLinejoin="round" />
          ))}
        </Pair>
      </g>
      <g className="pet-tail">
        {[[110, 118, 8], [118, 126, 7], [114, 134, 6]].map(([x, y, r], index) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={mane[index]} stroke={EDGE} strokeWidth="1.6" />)}
      </g>
      <Pair>
        <Tube d="M68 130v15" width={8} fill={body} />
        <rect x="63" y="144" width="10" height="5" rx="2" fill={paint.gold} />
      </Pair>
      <ellipse cx="80" cy="124" rx="32" ry="17" fill={body} stroke={EDGE} strokeWidth="2.6" />
      {level === 2 ? <path d="M86 122a8 8 0 1 1-8-10 6 6 0 1 0 8 10Z" fill={paint.moon} stroke={EDGE} strokeWidth="1.2" /> : null}
      <Pair>
        <path d="M62 50L52 24l20 17Z" fill={body} stroke={EDGE} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M61 45L56 31l9 9Z" fill="#ffc8d6" />
      </Pair>
      <g stroke={EDGE} strokeWidth="1.6">
        {[[60, 52, 9, 0], [100, 52, 9, 2], [56, 66, 7, 1], [104, 66, 7, 0], [68, 40, 10, 1], [92, 40, 10, 2], [80, 34, 11, 0]].map(([x, y, r, tone]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={mane[tone]} />
        ))}
      </g>
      <path d="M80 40c22 0 34 16 33 36-1 16-8 28-16 34-4 3-10 4-17 4s-13-1-17-4c-8-6-15-18-16-34-1-20 11-36 33-36Z" fill={body} stroke={EDGE} strokeWidth="3" />
      <g stroke={EDGE} strokeWidth="1.4">
        <circle cx="72" cy="44" r="7" fill={mane[1]} />
        <circle cx="86" cy="42" r="8" fill={mane[0]} />
      </g>
      <ellipse cx="80" cy="100" rx="20" ry="13" fill={soft} />
      <g fill="rgba(90,110,160,.5)">
        <ellipse cx="73" cy="103" rx="2.2" ry="1.6" />
        <ellipse cx="87" cy="103" rx="2.2" ry="1.6" />
      </g>
      {level >= 1 ? <Spark x={80} y={58} r={5} fill={level === 2 ? "#ffe27a" : "#ffffff"} /> : null}
      <Face mood={mood} y={77} />
      <Spark x={22} y={40} r={4} />
      {level >= 1 ? <Spark x={144} y={36} r={3.6} /> : null}
    </>
  );
}

const CRESCENT = "M20.4 46.7A64 64 0 1 0 139.6 46.7A60 60 0 0 1 20.4 46.7Z";

/** Eterna: una luna cuna con nubes en las puntas y estrellas colgando. */
function DreamMoon({ mood, fills: { body }, paint }: Omit<FormProps, "tier">) {
  return (
    <>
      <circle cx="80" cy="84" r="76" fill={paint.glow} opacity=".65" />
      <g stroke="rgba(255,255,255,.55)" strokeWidth="1">
        <path d="M52 0v28M108 0v20M80 0v44" />
      </g>
      <g className="pet-orbit-soft">
        <Spark x={52} y={32} r={6} fill="#ffe27a" />
        <Spark x={108} y={24} r={5.4} fill="#fff6bd" />
        <Spark x={80} y={50} r={7} fill="#ffe27a" />
      </g>
      <path d={CRESCENT} fill={paint.moon} stroke={EDGE} strokeWidth="3" />
      <g fill="rgba(222,178,80,.28)">
        <circle cx="40" cy="98" r="5" />
        <circle cx="122" cy="96" r="4" />
        <circle cx="54" cy="122" r="3" />
        <circle cx="110" cy="122" r="3.4" />
      </g>
      <path d="M28 62c4 24 18 42 38 52" stroke="rgba(255,255,255,.65)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Pair>
        <g fill={body} stroke={EDGE} strokeWidth="2">
          <circle cx="14" cy="46" r="9" />
          <circle cx="26" cy="40" r="10" />
          <circle cx="24" cy="52" r="8" />
        </g>
      </Pair>
      <Face mood={mood} y={112} />
      <Spark x={10} y={96} r={3.6} />
      <Spark x={150} y={100} r={3.6} />
      <Spark x={30} y={146} r={3} />
      <Spark x={132} y={148} r={3.2} />
    </>
  );
}

/** Dibuja la forma alta que toca: tier 0 y 1 son la primera criatura, 2 a 4 la segunda y 5 la Eterna. */
export const EVOLVED: Record<PetKind, (props: FormProps) => ReactNode> = {
  fuego: ({ tier, ...rest }) => (tier < 2 ? <EmberDragon plus={tier === 1} {...rest} /> : tier < 5 ? <Phoenix level={tier - 2} {...rest} /> : <EternalSun {...rest} />),
  agua: ({ tier, ...rest }) => (tier < 2 ? <FrostAxolotl plus={tier === 1} {...rest} /> : tier < 5 ? <TideDragon level={tier - 2} {...rest} /> : <SkyWhale {...rest} />),
  bosque: ({ tier, ...rest }) => (tier < 2 ? <Fawn plus={tier === 1} {...rest} /> : tier < 5 ? <ForestTurtle level={tier - 2} {...rest} /> : <LunaMoth {...rest} />),
  nube: ({ tier, ...rest }) => (tier < 2 ? <StormOwl plus={tier === 1} {...rest} /> : tier < 5 ? <CloudPegasus level={tier - 2} {...rest} /> : <DreamMoon {...rest} />),
};
