import { useId, type ReactNode } from "react";
import { PET_DETAILS, PET_STAGES, type PetKind, type PetMood, type PetStage } from "@/lib/social/domain";

/** Ojos grandes y brillantes: la cara sigue siendo mona en todas las evoluciones. */
function Face({ mood, y = 92, x = 80 }: { mood: PetMood; y?: number; x?: number }) {
  const sleeping = mood === "dormida";
  const worried = mood === "peligro" || mood === "recuperable";

  if (mood === "fallecida") {
    return (
      <g stroke="rgba(31,45,57,.72)" strokeWidth="3.6" strokeLinecap="round">
        <path d={`M${x - 18} ${y - 6}l9 9m0-9-9 9M${x + 9} ${y - 6}l9 9m0-9-9 9`} />
        <path d={`M${x - 6} ${y + 18}h12`} />
      </g>
    );
  }

  return (
    <g>
      {sleeping ? (
        <g fill="none" stroke="rgba(20,42,56,.82)" strokeWidth="3.4" strokeLinecap="round">
          <path d={`M${x - 21} ${y}c4.5 4 9 4 13.5 0M${x + 7.5} ${y}c4.5 4 9 4 13.5 0`} />
        </g>
      ) : (
        <g>
          <g fill="rgba(16,38,54,.92)">
            <ellipse cx={x - 14.5} cy={y} rx="5.2" ry={worried ? 6 : 7.6} />
            <ellipse cx={x + 14.5} cy={y} rx="5.2" ry={worried ? 6 : 7.6} />
          </g>
          <g fill="#ffffff">
            <circle cx={x - 16.2} cy={y - 2.6} r="2.1" />
            <circle cx={x + 12.8} cy={y - 2.6} r="2.1" />
            <circle cx={x - 12.4} cy={y + 3.4} r="1.05" opacity=".85" />
            <circle cx={x + 16.6} cy={y + 3.4} r="1.05" opacity=".85" />
          </g>
        </g>
      )}
      <path
        d={worried ? `M${x - 6} ${y + 18}c4-4.5 8-4.5 12 0` : sleeping ? `M${x - 4} ${y + 16}h8` : `M${x - 7.5} ${y + 13}c4.5 7.5 10.5 7.5 15 0`}
        fill="none"
        stroke="rgba(18,40,55,.8)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {mood === "feliz" ? (
        <g fill="rgba(255,117,157,.36)">
          <ellipse cx={x - 27} cy={y + 11} rx="7.5" ry="3.4" />
          <ellipse cx={x + 27} cy={y + 11} rx="7.5" ry="3.4" />
        </g>
      ) : null}
      {mood === "peligro" ? <path d={`M${x + 31} ${y - 21}c0 9.5-10.5 9.5-10.5 0 0-5 5.25-11.5 5.25-11.5s5.25 6.5 5.25 11.5`} fill="rgba(113,205,255,.9)" /> : null}
    </g>
  );
}

function Sparkle({ x, y, r = 5, fill = "#fff6bd", opacity = 1 }: { x: number; y: number; r?: number; fill?: string; opacity?: number }) {
  return (
    <path
      d={`M${x} ${y - r}q${r * 0.22} ${r * 0.78} ${r} ${r}q-${r * 0.78} ${r * 0.22} -${r} ${r}q-${r * 0.22} -${r * 0.78} -${r} -${r}q${r * 0.78} -${r * 0.22} ${r} -${r}Z`}
      fill={fill}
      opacity={opacity}
    />
  );
}

type PetDrawingProps = {
  stageIndex: number;
  mood: PetMood;
  ids: { body: string; soft: string; accent: string };
};

/* Chispa: brasa -> cria con patas -> dragoncillo -> fenix -> sol guardian */
function FirePet({ stageIndex, mood, ids }: PetDrawingProps) {
  const body = `url(#${ids.body})`;
  const soft = `url(#${ids.soft})`;
  const accent = `url(#${ids.accent})`;
  const outline = "rgba(255,255,255,.78)";

  if (stageIndex === 0) {
    return (
      <>
        <path className="pet-sprout" d="M80 42c9 11 15 19 15 27 0 9-7 15-15 15s-15-6-15-15c0-8 6-16 15-27Z" fill={soft} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="80" cy="102" r="33" fill={body} stroke={outline} strokeWidth="3" />
        <ellipse cx="80" cy="108" rx="20" ry="17" fill={soft} opacity=".55" />
        <Face mood={mood} y={100} />
      </>
    );
  }

  if (stageIndex === 1) {
    return (
      <>
        <g fill={accent} stroke={outline} strokeWidth="2.6" strokeLinejoin="round">
          <ellipse cx="64" cy="133" rx="12" ry="8" />
          <ellipse cx="96" cy="133" rx="12" ry="8" />
          <path d="M52 100c-11 1-18 7-21 16 9 3 17 0 22-7Z" />
          <path d="M108 100c11 1 18 7 21 16-9 3-17 0-22-7Z" />
        </g>
        <path d="M80 34c13 18 27 36 27 56 0 22-13 36-27 36s-27-14-27-36c0-14 8-24 14-33 2 7 5 11 10 12-7-14-4-25 3-35Z" fill={body} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
        <path d="M80 66c7 11 14 21 14 31 0 12-6 19-14 19s-14-7-14-19c0-7 4-13 7-18 1 4 3 6 6 7-4-8-1-15 1-20Z" fill={soft} opacity=".9" />
        <Face mood={mood} y={94} />
      </>
    );
  }

  if (stageIndex === 2) {
    return (
      <>
        <path className="pet-tail" d="M110 112c28 8 27-24 11-21 9 8 1 13-9 11" fill="none" stroke={accent} strokeWidth="12" strokeLinecap="round" />
        <g fill={accent} stroke={outline} strokeWidth="2.6" strokeLinejoin="round">
          <ellipse cx="63" cy="134" rx="13" ry="8.5" />
          <ellipse cx="97" cy="134" rx="13" ry="8.5" />
          <path d="M50 96c-13 2-21 10-23 21 11 3 20-1 26-10Z" />
          <path d="M110 96c13 2 21 10 23 21-11 3-20-1-26-10Z" />
        </g>
        <path d="M80 22c15 20 30 40 30 62 0 24-14 40-30 40s-30-16-30-40c0-15 9-27 16-37 2 8 6 12 11 14-8-16-4-28 3-39Z" fill={body} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
        <path d="M80 58c8 12 17 25 17 36 0 13-7 22-17 22s-17-9-17-22c0-8 4-15 8-21 1 5 4 7 7 8-5-9-2-17 2-23Z" fill={soft} opacity=".9" />
        <g fill={accent} stroke={outline} strokeWidth="2" strokeLinejoin="round">
          <path d="M60 44 48 22c13 3 20 10 22 20Z" />
          <path d="M100 44l12-22c-13 3-20 10-22 20Z" />
        </g>
        <Face mood={mood} y={92} />
        <Sparkle x={34} y={70} r={4.4} />
        <Sparkle x={128} y={60} r={4} />
      </>
    );
  }

  if (stageIndex === 3) {
    return (
      <>
        <g className="pet-wings" fill={soft} stroke={outline} strokeWidth="2.4" strokeLinejoin="round">
          <path d="M52 76C26 58 8 74 14 100c12-13 25-11 34 0-4-9-1-17 4-24Z" />
          <path d="M108 76c26-18 44-2 38 24-12-13-25-11-34 0 4-9 1-17-4-24Z" />
        </g>
        <path className="pet-tail" d="M108 114c30 10 30-26 12-23 10 9 1 14-10 12" fill="none" stroke={accent} strokeWidth="13" strokeLinecap="round" />
        <g fill={accent} stroke={outline} strokeWidth="2.6" strokeLinejoin="round">
          <ellipse cx="62" cy="136" rx="14" ry="9" />
          <ellipse cx="98" cy="136" rx="14" ry="9" />
          <path d="M48 94c-15 2-24 11-26 24 13 4 23-1 30-11Z" />
          <path d="M112 94c15 2 24 11 26 24-13 4-23-1-30-11Z" />
        </g>
        <path d="M80 16c16 22 32 44 32 66 0 26-15 42-32 42s-32-16-32-42c0-16 10-29 17-40 2 9 6 13 12 15-9-17-4-30 3-41Z" fill={body} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
        <path d="M80 54c9 13 18 27 18 39 0 14-8 23-18 23s-18-9-18-23c0-9 5-16 9-22 1 5 4 8 7 9-5-10-2-19 2-26Z" fill={soft} opacity=".92" />
        <path d="m54 42 8-24 12 18 6-22 10 20 8-16 6 24" fill="none" stroke="#ffd15c" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <Face mood={mood} y={90} />
        <Sparkle x={30} y={56} r={5} />
        <Sparkle x={132} y={48} r={4.5} />
        <Sparkle x={24} y={104} r={4} />
      </>
    );
  }

  const guardian = stageIndex >= 5;

  return (
    <>
      {guardian ? <circle cx="80" cy="80" r="74" fill="none" stroke="#ffd15c" strokeWidth="5" opacity=".5" /> : null}
      <circle cx="80" cy="80" r={guardian ? 68 : 60} fill={soft} opacity=".18" />

      <g className="pet-wings" fill={accent} stroke={outline} strokeWidth="2.2" strokeLinejoin="round" opacity=".95">
        <path d={guardian ? "M58 62C42 40 16 38 2 56c18 4 28 16 32 34 6-14 14-22 24-28Z" : "M58 66C44 48 22 46 10 62c15 4 24 13 27 28 5-12 12-19 21-24Z"} />
        <path d={guardian ? "M56 82C36 72 12 80 4 100c18-2 30 4 38 18 1-16 6-26 14-36Z" : "M56 84C40 76 20 82 13 98c15-1 25 4 32 15 1-13 5-21 11-29Z"} />
        <path d={guardian ? "M102 62c16-22 42-24 56-6-18 4-28 16-32 34-6-14-14-22-24-28Z" : "M102 66c14-18 36-20 48-4-15 4-24 13-27 28-5-12-12-19-21-24Z"} />
        <path d={guardian ? "M104 82c20-10 44-2 52 18-18-2-30 4-38 18-1-16-6-26-14-36Z" : "M104 84c16-8 36-2 43 14-15-1-25 4-32 15-1-13-5-21-11-29Z"} />
      </g>

      <g fill={accent} stroke={outline} strokeWidth="2.2" strokeLinejoin="round">
        <path d={guardian ? "M70 124c-10 16-12 28-8 40-14-10-20-26-16-42Z" : "M72 120c-8 13-10 23-7 33-12-9-17-22-13-35Z"} />
        <path d={guardian ? "M90 124c10 16 12 28 8 40 14-10 20-26 16-42Z" : "M88 120c8 13 10 23 7 33 12-9 17-22 13-35Z"} />
      </g>

      <path
        d={guardian
          ? "M80 4c18 26 38 52 38 78 0 30-17 50-38 50s-38-20-38-50c0-19 12-34 20-48 2 10 7 15 14 17-10-20-4-34 4-47Z"
          : "M80 10c17 24 35 48 35 72 0 28-16 46-35 46s-35-18-35-46c0-17 11-31 18-44 2 9 7 14 13 16-9-19-4-31 4-44Z"}
        fill={body}
        stroke={outline}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d={guardian
          ? "M80 48c11 17 23 35 23 52 0 19-10 31-23 31s-23-12-23-31c0-12 6-21 12-30 1 6 5 10 9 12-6-14-2-25 2-34Z"
          : "M80 50c10 16 21 32 21 48 0 17-9 29-21 29s-21-12-21-29c0-11 6-20 11-28 1 6 4 9 8 11-6-13-2-23 2-31Z"}
        fill={soft}
        opacity=".92"
      />
      <ellipse cx="80" cy={guardian ? 104 : 100} rx="15" ry="19" fill="#fff8d4" opacity=".55" />

      <path
        d={guardian ? "m46 36 10-30 14 22 10-28 12 26 10-20 10 30" : "m52 40 9-26 12 19 9-24 11 22 8-17 9 26"}
        fill="none"
        stroke="#ffe27a"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Face mood={mood} y={guardian ? 96 : 94} />

      <g>
        <Sparkle x={26} y={44} r={5.5} />
        <Sparkle x={136} y={36} r={5} />
        <Sparkle x={16} y={92} r={4.5} />
        <Sparkle x={146} y={84} r={4.2} />
        {guardian ? <Sparkle x={80} y={2} r={5} /> : null}
        {guardian ? <Sparkle x={40} y={12} r={4} /> : null}
        {guardian ? <Sparkle x={124} y={8} r={3.6} /> : null}
      </g>
    </>
  );
}

/* Glu: gota -> cria con aletas -> cristal -> golem -> monarca de hielo */
function WaterPet({ stageIndex, mood, ids }: PetDrawingProps) {
  const body = `url(#${ids.body})`;
  const soft = `url(#${ids.soft})`;
  const accent = `url(#${ids.accent})`;
  const outline = "rgba(255,255,255,.85)";

  if (stageIndex === 0) {
    return (
      <>
        <path d="M80 44C70 60 54 76 54 96c0 19 12 32 26 32s26-13 26-32c0-20-16-36-26-52Z" fill={body} stroke={outline} strokeWidth="3" />
        <ellipse cx="70" cy="86" rx="6" ry="13" fill="rgba(255,255,255,.4)" transform="rotate(24 70 86)" />
        <Face mood={mood} y={100} />
      </>
    );
  }

  if (stageIndex === 1) {
    return (
      <>
        <g fill={soft} stroke={outline} strokeWidth="2.4" strokeLinejoin="round">
          <path d="M52 104c-12 0-20 6-24 16 11 4 21 1 27-7Z" />
          <path d="M108 104c12 0 20 6 24 16-11 4-21 1-27-7Z" />
          <ellipse cx="66" cy="134" rx="12" ry="7.5" />
          <ellipse cx="94" cy="134" rx="12" ry="7.5" />
        </g>
        <path d="M80 30C68 52 48 72 48 96c0 23 14 38 32 38s32-15 32-38c0-24-20-44-32-66Z" fill={body} stroke={outline} strokeWidth="3" />
        <path d="M80 48c-8 15-20 30-20 46 0 15 9 25 20 25s20-10 20-25c0-16-12-31-20-46Z" fill={soft} opacity=".45" />
        <ellipse cx="66" cy="80" rx="7" ry="15" fill="rgba(255,255,255,.4)" transform="rotate(24 66 80)" />
        <Face mood={mood} y={98} />
      </>
    );
  }

  if (stageIndex === 2) {
    return (
      <>
        <g fill={soft} stroke={outline} strokeWidth="2.4" strokeLinejoin="round">
          <path d="M48 98 30 112l16 4 2 14 12-18Z" />
          <path d="M112 98l18 14-16 4-2 14-12-18Z" />
          <path d="M58 128 46 142h20l4-14Z" />
          <path d="M102 128l12 14H94l-4-14Z" />
        </g>
        <path d="M80 22C66 46 44 68 44 94c0 25 16 42 36 42s36-17 36-42c0-26-22-48-36-72Z" fill={body} stroke={outline} strokeWidth="3" />
        <path d="M80 40c-9 17-22 33-22 51 0 17 10 28 22 28s22-11 22-28c0-18-13-34-22-51Z" fill={soft} opacity=".45" />
        <g fill="rgba(240,253,255,.6)" stroke="rgba(255,255,255,.6)" strokeWidth="1.5">
          <path d="m56 92 24-28-8 34Z" />
          <path d="m104 92-24-28 8 34Z" />
        </g>
        <Face mood={mood} y={98} />
        <Sparkle x={34} y={52} r={4.6} fill="#eafcff" />
        <Sparkle x={128} y={44} r={4.2} fill="#eafcff" />
      </>
    );
  }

  if (stageIndex === 3) {
    return (
      <>
        <g fill={soft} stroke={outline} strokeWidth="2.6" strokeLinejoin="round">
          <path d="M44 96 22 108l20 6 2 18 16-22Z" />
          <path d="M116 96l22 12-20 6-2 18-16-22Z" />
        </g>
        <path d="M80 24 100 56l8 42c3 15-12 26-28 26s-31-11-28-26l8-42Z" fill={body} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
        <path d="M80 40 92 60l5 36c2 10-7 17-17 17s-19-7-17-17l5-36Z" fill={soft} opacity=".42" />
        <path d="m50 56 12-26 18 16 18-16 12 26-12 8H62Z" fill={accent} stroke={outline} strokeWidth="2.6" strokeLinejoin="round" />
        <circle cx="80" cy="44" r="5" fill="#fffdf2" />
        <g fill={soft} stroke={outline} strokeWidth="2.4" strokeLinejoin="round">
          <path d="M58 132 44 146h22l3-14Z" />
          <path d="M102 132l14 14H94l-3-14Z" />
        </g>
        <Face mood={mood} y={94} />
        <Sparkle x={28} y={44} r={5} fill="#eafcff" />
        <Sparkle x={132} y={36} r={4.6} fill="#eafcff" />
      </>
    );
  }

  const monarch = stageIndex >= 5;

  return (
    <>
      {monarch ? <ellipse cx="80" cy="78" rx="72" ry="60" fill="none" stroke={accent} strokeWidth="4" strokeDasharray="3 11" opacity=".7" /> : null}
      <circle cx="80" cy="82" r={monarch ? 68 : 60} fill={soft} opacity=".16" />

      <g fill={soft} stroke={outline} strokeWidth="2.6" strokeLinejoin="round">
        <path d={monarch ? "M14 146 40 44l22 102Z" : "M22 146 44 62l18 84Z"} />
        <path d={monarch ? "M146 146 120 44l-22 102Z" : "M138 146 116 62l-18 84Z"} />
        <path d={monarch ? "M50 146 66 86l10 60Z" : "M52 146 66 98l8 48Z"} opacity=".85" />
        <path d={monarch ? "M110 146 94 86l-10 60Z" : "M108 146 94 98l-8 48Z"} opacity=".85" />
      </g>

      <g fill={soft} stroke={outline} strokeWidth="2.8" strokeLinejoin="round">
        <path d={monarch ? "M44 92 16 96l10 18 12-2 10-12Z" : "M46 94 22 98l8 16 11-2 9-10Z"} />
        <path d={monarch ? "M116 92l28 4-10 18-12-2-10-12Z" : "M114 94l24 4-8 16-11-2-9-10Z"} />
      </g>

      <path
        d={monarch ? "M80 10l24 40 10 48c4 18-16 30-34 30s-38-12-34-30l10-48Z" : "M80 16l22 38 9 44c3 17-14 28-31 28s-34-11-31-28l9-44Z"}
        fill={body}
        stroke={outline}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d={monarch ? "M80 30l14 24 6 44c2 11-9 18-20 18s-22-7-20-18l6-44Z" : "M80 34l13 22 6 40c2 10-8 17-19 17s-21-7-19-17l6-40Z"} fill={soft} opacity=".4" />
      <g fill={soft} stroke={outline} strokeWidth="2.6" strokeLinejoin="round">
        <path d={monarch ? "M56 134 42 150h26l2-16Z" : "M58 132 46 146h24l2-14Z"} />
        <path d={monarch ? "M104 134l14 16H92l-2-16Z" : "M102 132l12 14H90l2-14Z"} />
      </g>
      <g fill="rgba(240,253,255,.5)">
        <path d={monarch ? "m54 58 26-30-8 38Z" : "m56 60 24-28-7 36Z"} />
        <path d={monarch ? "m106 58-26-30 8 38Z" : "m104 60-24-28 7 36Z"} />
      </g>

      <path
        d={monarch ? "m42 44 12-34 14 22 12-30 12 30 14-22 12 34-16 10H58Z" : "m48 48 11-30 13 20 8-26 10 26 13-20 11 30-14 8H62Z"}
        fill={accent}
        stroke={outline}
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <circle cx="80" cy={monarch ? 30 : 34} r={monarch ? 6 : 5} fill="#fffdf2" />

      <Face mood={mood} y={92} />

      <g>
        <Sparkle x={26} y={40} r={5.4} fill="#eafcff" />
        <Sparkle x={136} y={32} r={5} fill="#eafcff" />
        {monarch ? <Sparkle x={14} y={80} r={4.6} fill="#eafcff" /> : null}
        {monarch ? <Sparkle x={148} y={72} r={4.2} fill="#eafcff" /> : null}
        {monarch ? <Sparkle x={80} y={2} r={4.6} fill="#eafcff" /> : null}
      </g>
    </>
  );
}

/* Tilo: semilla -> brote con patas -> arbolito -> arbol -> guardian ancestral */
function ForestPet({ stageIndex, mood, ids }: PetDrawingProps) {
  const body = `url(#${ids.body})`;
  const soft = `url(#${ids.soft})`;
  const accent = `url(#${ids.accent})`;
  const outline = "rgba(255,255,255,.66)";
  const bark = "#8a5c38";

  if (stageIndex === 0) {
    return (
      <>
        <path className="pet-sprout" d="M82 48c0-16 9-27 23-28-1 15-9 24-23 28Z" fill={accent} stroke={outline} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M80 64c-18 0-30 14-30 32 0 22 13 40 30 40s30-18 30-40c0-18-12-32-30-32Z" fill={body} stroke={outline} strokeWidth="3" />
        <path d="M49 72c1-14 13-24 31-24s30 10 31 24c-10 6-19 9-31 9s-21-3-31-9Z" fill="#7d5334" stroke="rgba(255,255,255,.5)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M80 48v-9" stroke="#7d5334" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="64" cy="100" rx="8" ry="12" fill="rgba(255,255,255,.24)" transform="rotate(16 64 100)" />
        <Face mood={mood} y={104} />
      </>
    );
  }

  if (stageIndex === 1) {
    return (
      <>
        <path className="pet-sprout" d="M80 52c-2-20 9-34 25-36-1 19-10 31-25 36Zm-4 2C66 38 50 32 36 40c11 16 27 21 40 14Z" fill={accent} stroke={outline} strokeWidth="2.6" strokeLinejoin="round" />
        <g fill={bark} stroke={outline} strokeWidth="2.2" strokeLinejoin="round">
          <path d="M66 128c-8 2-13 7-15 14h18Z" />
          <path d="M94 128c8 2 13 7 15 14H91Z" />
        </g>
        <path d="M80 56c-13 0-21 9-21 22l3 34c1 12 7 18 18 18s17-6 18-18l3-34c0-13-8-22-21-22Z" fill={body} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="68" cy="92" rx="6" ry="12" fill="rgba(255,255,255,.2)" transform="rotate(12 68 92)" />
        <Face mood={mood} y={96} />
      </>
    );
  }

  if (stageIndex === 2) {
    return (
      <>
        <g fill={bark} stroke={outline} strokeWidth="2.4" strokeLinejoin="round">
          <path d="M60 130c-10 2-16 7-19 14h22Z" />
          <path d="M100 130c10 2 16 7 19 14H98Z" />
          <path d="M56 96c-12 2-19 9-21 19 11 3 19-1 24-9Z" />
          <path d="M104 96c12 2 19 9 21 19-11 3-19-1-24-9Z" />
        </g>
        <path d="M80 62c-14 0-23 9-23 23l3 32c1 12 8 18 20 18s19-6 20-18l3-32c0-14-9-23-23-23Z" fill={body} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
        <path d="M80 18c17 0 30 11 32 25 12 3 19 12 19 21 0 12-13 20-30 20H59c-17 0-30-8-30-20 0-9 7-18 19-21 2-14 15-25 32-25Z" fill={soft} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
        <path d="M46 70c9 6 20 9 34 9s25-3 34-9c-2 10-15 16-34 16s-32-6-34-16Z" fill={accent} opacity=".5" />
        <ellipse cx="58" cy="40" rx="13" ry="8" fill="rgba(255,255,255,.32)" transform="rotate(-18 58 40)" />
        <Face mood={mood} y={100} />
      </>
    );
  }

  if (stageIndex === 3) {
    return (
      <>
        <g fill={bark} stroke={outline} strokeWidth="2.6" strokeLinejoin="round">
          <path d="M56 130c-12 3-19 8-22 16h26Z" />
          <path d="M104 130c12 3 19 8 22 16h-26Z" />
          <path d="M52 92c-15 3-24 12-26 24 14 4 24-2 30-12Z" />
          <path d="M108 92c15 3 24 12 26 24-14 4-24-2-30-12Z" />
        </g>
        <path d="M80 58c-17 0-27 11-27 27l4 32c1 12 9 19 23 19s22-7 23-19l4-32c0-16-10-27-27-27Z" fill={body} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
        <path d="M70 76c-4 18-5 30-2 46m24-46c3 16 3 30 1 45" fill="none" stroke="rgba(91,58,35,.22)" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M80 8c20 0 35 12 38 28 14 3 23 13 23 24 0 13-16 22-35 22H54c-19 0-35-9-35-22 0-11 9-21 23-24C45 20 60 8 80 8Z" fill={soft} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
        <path d="M32 64c11 8 27 12 48 12s37-4 48-12c-3 11-19 18-48 18s-45-7-48-18Z" fill={accent} opacity=".5" />
        <ellipse cx="54" cy="34" rx="16" ry="9" fill="rgba(255,255,255,.34)" transform="rotate(-18 54 34)" />
        <g>
          <circle cx="40" cy="48" r="5.5" fill="#ffd5e7" stroke="rgba(255,255,255,.72)" strokeWidth="1.5" />
          <circle cx="118" cy="42" r="5" fill="#ffd5e7" stroke="rgba(255,255,255,.72)" strokeWidth="1.5" />
          <circle cx="82" cy="22" r="4.5" fill="#fff0b8" stroke="rgba(255,255,255,.72)" strokeWidth="1.5" />
        </g>
        <Face mood={mood} y={102} />
      </>
    );
  }

  const ancient = stageIndex >= 5;

  return (
    <>
      <g fill={body} stroke={outline} strokeWidth="2.6" strokeLinejoin="round">
        <path d={ancient ? "M52 126c-16 2-30 8-38 20 18 4 34 0 44-10Z" : "M56 126c-14 2-26 7-33 18 16 3 30-1 39-9Z"} />
        <path d={ancient ? "M108 126c16 2 30 8 38 20-18 4-34 0-44-10Z" : "M104 126c14 2 26 7 33 18-16 3-30-1-39-9Z"} />
      </g>

      <g fill="none" stroke={bark} strokeWidth={ancient ? 11 : 9} strokeLinecap="round">
        <path d={ancient ? "M52 92 18 74M108 92l34-18" : "M54 94 24 80m82 14 30-14"} />
      </g>
      <g fill={accent} stroke={outline} strokeWidth="2.2">
        <ellipse cx={ancient ? 16 : 22} cy={ancient ? 72 : 78} rx="14" ry="8" transform={`rotate(24 ${ancient ? 16 : 22} ${ancient ? 72 : 78})`} />
        <ellipse cx={ancient ? 144 : 138} cy={ancient ? 72 : 78} rx="14" ry="8" transform={`rotate(-24 ${ancient ? 144 : 138} ${ancient ? 72 : 78})`} />
      </g>

      <path
        d={ancient
          ? "M80 52c-24 0-38 14-38 34l6 36c2 14 14 22 32 22s30-8 32-22l6-36c0-20-14-34-38-34Z"
          : "M80 54c-21 0-33 12-33 30l5 34c2 13 12 20 28 20s26-7 28-20l5-34c0-18-12-30-33-30Z"}
        fill={body}
        stroke={outline}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M62 78c-5 20-6 34-2 52m36-52c4 18 4 34 1 51" fill="none" stroke="rgba(91,58,35,.22)" strokeWidth="5" strokeLinecap="round" />

      <path
        d={ancient
          ? "M80 2c24 0 42 12 48 28 18 2 30 14 30 26 0 15-20 24-44 24H46C22 80 2 71 2 56c0-12 12-24 30-26C38 14 56 2 80 2Z"
          : "M80 6c21 0 37 11 42 26 16 2 26 13 26 23 0 14-18 22-40 22H52c-22 0-40-8-40-22 0-10 10-21 26-23C43 17 59 6 80 6Z"}
        fill={soft}
        stroke={outline}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d={ancient ? "M6 62c16 12 44 18 74 18s58-6 74-18c-2 14-30 24-74 24S8 76 6 62Z" : "M16 62c14 10 38 16 64 16s50-6 64-16c-2 12-26 20-64 20s-62-8-64-20Z"}
        fill={accent}
        opacity=".5"
      />
      <ellipse cx={ancient ? 44 : 48} cy="28" rx={ancient ? 20 : 17} ry="10" fill="rgba(255,255,255,.34)" transform={`rotate(-16 ${ancient ? 44 : 48} 28)`} />
      <g>
        <circle cx={ancient ? 28 : 34} cy={ancient ? 44 : 44} r="6" fill="#ffd5e7" stroke="rgba(255,255,255,.72)" strokeWidth="1.5" />
        <circle cx={ancient ? 132 : 126} cy={ancient ? 38 : 40} r="5.5" fill="#ffd5e7" stroke="rgba(255,255,255,.72)" strokeWidth="1.5" />
        <circle cx="86" cy={ancient ? 14 : 18} r="5" fill="#fff0b8" stroke="rgba(255,255,255,.72)" strokeWidth="1.5" />
        {ancient ? <circle cx="106" cy="52" r="4.5" fill="#fff0b8" stroke="rgba(255,255,255,.7)" strokeWidth="1.4" /> : null}
      </g>
      {ancient ? <path d="M24 22c16-24 96-24 112 0-20-10-40-11-56 0-16-11-36-10-56 0Z" fill="#ffdf7e" stroke="#fff3c4" strokeWidth="3" strokeLinejoin="round" /> : null}
      {ancient ? <path d="M58 116c4 12 10 18 22 18s18-6 22-18c-6 6-14 9-22 9s-16-3-22-9Z" fill={accent} opacity=".7" /> : null}

      <Face mood={mood} y={ancient ? 102 : 100} />

      <g fill="#fff3a8">
        <circle cx="22" cy="104" r="3.8" opacity=".9" />
        <circle cx="140" cy="98" r="3.2" opacity=".85" />
        {ancient ? <circle cx="126" cy="126" r="2.8" opacity=".8" /> : null}
        {ancient ? <circle cx="32" cy="130" r="2.6" opacity=".8" /> : null}
      </g>
    </>
  );
}

/* Nimbo: nubecita -> nube con patas -> nube gris con rayo -> tormenta -> coloso */
function CloudPet({ stageIndex, mood, ids }: PetDrawingProps) {
  const body = `url(#${ids.body})`;
  const outline = "rgba(255,255,255,.84)";
  const bolt = "#ffe14f";
  const boltEdge = "#fff6c2";

  if (stageIndex === 0) {
    return (
      <>
        <path d="M64 112c-13 0-23-9-23-20 0-9 6-17 15-19 3-12 14-21 27-21s24 9 27 21c9 2 15 10 15 19 0 11-10 20-23 20Z" fill={body} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="68" cy="70" rx="13" ry="8" fill="rgba(255,255,255,.44)" transform="rotate(-18 68 70)" />
        <Face mood={mood} y={88} />
      </>
    );
  }

  if (stageIndex === 1) {
    return (
      <>
        <g fill="#8fd8ff" stroke="rgba(255,255,255,.72)" strokeWidth="2.2" strokeLinejoin="round">
          <path d="M64 124c0 7-5 12-10 12s-10-5-10-12 10-22 10-22 10 15 10 22Z" />
          <path d="M116 124c0 7-5 12-10 12s-10-5-10-12 10-22 10-22 10 15 10 22Z" />
        </g>
        <g fill={body} stroke={outline} strokeWidth="2.6" strokeLinejoin="round">
          <ellipse cx="34" cy="94" rx="13" ry="10" />
          <ellipse cx="126" cy="94" rx="13" ry="10" />
        </g>
        <path d="M52 110c-15 0-26-10-26-23 0-11 8-20 19-22 4-16 18-27 35-27s31 11 35 27c11 2 19 11 19 22 0 13-11 23-26 23Z" fill={body} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
        <ellipse cx="62" cy="62" rx="14" ry="8.5" fill="rgba(255,255,255,.44)" transform="rotate(-18 62 62)" />
        <Face mood={mood} y={84} />
      </>
    );
  }

  if (stageIndex === 2) {
    return (
      <>
        <g fill="#8fd8ff" stroke="rgba(255,255,255,.7)" strokeWidth="2" strokeLinejoin="round">
          <path d="M48 126c0 6-4 10-8 10s-8-4-8-10 8-18 8-18 8 12 8 18Z" />
          <path d="M128 128c0 5.5-3.5 9.5-7.5 9.5s-7.5-4-7.5-9.5 7.5-17 7.5-17 7.5 11.5 7.5 17Z" />
        </g>
        <path d="M88 112 70 144h11l-5 16 21-26H85l7-22Z" fill={bolt} stroke={boltEdge} strokeWidth="2.4" strokeLinejoin="round" />
        <g fill={body} stroke={outline} strokeWidth="2.6" strokeLinejoin="round">
          <ellipse cx="28" cy="92" rx="14" ry="10.5" transform="rotate(-12 28 92)" />
          <ellipse cx="132" cy="92" rx="14" ry="10.5" transform="rotate(12 132 92)" />
        </g>
        <path d="M48 112c-16 0-28-11-28-25 0-12 9-22 20-24 4-18 20-29 38-29s34 11 38 29c11 2 20 12 20 24 0 14-12 25-28 25Z" fill={body} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
        <path d="M28 104c12 6 30 9 52 9s40-3 52-9c-3 5-10 8-18 8H46c-8 0-15-3-18-8Z" fill="rgba(122,157,209,.3)" />
        <ellipse cx="60" cy="60" rx="15" ry="9" fill="rgba(255,255,255,.44)" transform="rotate(-18 60 60)" />
        <Face mood={mood} y={82} />
        <Sparkle x={26} y={48} r={5.5} />
        <Sparkle x={136} y={42} r={4.6} />
      </>
    );
  }

  if (stageIndex === 3) {
    return (
      <>
        <g stroke="#8fd8ff" strokeWidth="4" strokeLinecap="round" opacity=".9">
          <path d="M46 116 40 140m18-22-6 22m60-22 6 24m-24-24 6 22" />
        </g>
        <path d="M84 112 62 148h13l-6 20 24-30H79l5-26Z" fill={bolt} stroke={boltEdge} strokeWidth="2.4" strokeLinejoin="round" />
        <g fill={body} stroke={outline} strokeWidth="2.6" strokeLinejoin="round">
          <ellipse cx="22" cy="86" rx="15" ry="11" transform="rotate(-16 22 86)" />
          <ellipse cx="138" cy="86" rx="15" ry="11" transform="rotate(16 138 86)" />
        </g>
        <path d="M44 110c-17 0-30-12-30-27 0-13 9-23 21-26 4-19 21-31 41-31s37 12 41 31c12 3 21 13 21 26 0 15-13 27-30 27Z" fill={body} stroke={outline} strokeWidth="3" strokeLinejoin="round" />
        <path d="M22 102c13 7 33 10 58 10s45-3 58-10c-3 6-11 8-20 8H42c-9 0-17-2-20-8Z" fill="rgba(80,100,150,.3)" />
        <ellipse cx="56" cy="54" rx="16" ry="9.5" fill="rgba(255,255,255,.42)" transform="rotate(-18 56 54)" />
        <Face mood={mood} y={78} />
        <Sparkle x={22} y={40} r={6} />
        <Sparkle x={140} y={34} r={5} />
      </>
    );
  }

  const colossus = stageIndex >= 5;

  return (
    <>
      {colossus ? <ellipse cx="80" cy="66" rx="74" ry="56" fill="none" stroke={bolt} strokeWidth="4" strokeDasharray="2 10" opacity=".65" /> : null}

      <g stroke="rgba(143,216,255,.85)" strokeWidth={colossus ? 4.5 : 4} strokeLinecap="round">
        <path d={colossus
          ? "M52 116 44 146m18-30-8 32m22-32-6 32m22-32 6 32m16-32 8 30"
          : "M56 112 50 140m18-28-6 30m22-30 6 30m16-30 8 28"} />
      </g>
      <path
        d={colossus ? "M42 112c6 18 14 30 38 30s32-12 38-30c-12 8-24 12-38 12s-26-4-38-12Z" : "M48 108c5 16 13 26 32 26s27-10 32-26c-10 7-20 10-32 10s-22-3-32-10Z"}
        fill="rgba(70,90,140,.24)"
      />

      <ellipse cx="80" cy="140" rx={colossus ? 54 : 44} ry="16" fill={bolt} opacity=".18" />
      <g fill={bolt} stroke={boltEdge} strokeWidth="2.6" strokeLinejoin="round">
        <path d={colossus ? "M36 104 10 142h14l-8 18 28-34H26l10-22Z" : "M40 104 18 140h12l-6 16 24-30H32l8-22Z"} />
        <path d={colossus ? "M124 104l26 38h-14l8 18-28-34h18l-10-22Z" : "M120 104l22 36h-12l6 16-24-30h12l-4-22Z"} />
        {colossus ? <path d="M80 118 62 158h12l-4 16 22-30H72l8-26Z" /> : null}
      </g>

      <path
        d={colossus
          ? "M36 116c-19 0-34-14-34-31 0-15 11-27 25-30C32 32 53 16 78 16c24 0 44 15 50 38 14 3 26 15 26 31 0 17-15 31-34 31Z"
          : "M40 112c-17 0-31-13-31-29 0-14 10-25 23-28 5-21 23-35 46-35s41 14 46 35c13 3 23 14 23 28 0 16-14 29-31 29Z"}
        fill={body}
        stroke="rgba(255,255,255,.7)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d={colossus
          ? "M8 100c18 10 44 14 72 14s54-4 72-14c-4 9-14 16-26 16H34c-12 0-22-7-26-16Z"
          : "M14 98c17 9 40 13 66 13s49-4 66-13c-4 8-13 14-24 14H38c-11 0-20-6-24-14Z"}
        fill="rgba(40,54,88,.3)"
      />
      <ellipse cx={colossus ? 50 : 52} cy={colossus ? 50 : 52} rx={colossus ? 19 : 17} ry={colossus ? 11 : 10} fill="rgba(255,255,255,.4)" transform={`rotate(-18 ${colossus ? 50 : 52} ${colossus ? 50 : 52})`} />

      {colossus ? (
        <path d="m34 34 10-26 12 18 10-24 12 24 12-18 10 26" fill="none" stroke={bolt} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}

      <Face mood={mood} y={colossus ? 74 : 72} />

      <g>
        <Sparkle x={18} y={38} r={6} />
        <Sparkle x={144} y={30} r={5} />
        {colossus ? <Sparkle x={8} y={86} r={4.6} /> : null}
        {colossus ? <Sparkle x={152} y={78} r={4.2} /> : null}
      </g>
    </>
  );
}

const DRAWINGS: Record<PetKind, (props: PetDrawingProps) => ReactNode> = {
  fuego: FirePet,
  agua: WaterPet,
  bosque: ForestPet,
  nube: CloudPet,
};

const COLORS: Record<PetKind, { body: [string, string, string]; soft: [string, string]; accent: [string, string] }> = {
  fuego: { body: ["#ffe486", "#ff9450", "#ef426f"], soft: ["#fff7c4", "#ffb648"], accent: ["#ff6f63", "#ffd15c"] },
  agua: { body: ["#eafdff", "#8ce2fb", "#5f93ef"], soft: ["#ffffff", "#bdeeff"], accent: ["#8ce9ff", "#8c9cff"] },
  bosque: { body: ["#d7ab72", "#a56d43", "#6c4630"], soft: ["#c2f39b", "#5fb96d"], accent: ["#e3fba8", "#63c478"] },
  nube: { body: ["#ffffff", "#e6f2ff", "#bfd2f4"], soft: ["#ffffff", "#ddf7ff"], accent: ["#f6b8ff", "#93dfff"] },
};

/** La nube se va cargando de tormenta: cada etapa oscurece su cuerpo. */
const CLOUD_BODY_BY_STAGE: [string, string, string][] = [
  ["#ffffff", "#eef6ff", "#cbd9f2"],
  ["#ffffff", "#e6f0ff", "#b6c7e8"],
  ["#f6fafe", "#d0ddf3", "#94a6ca"],
  ["#e6ecf8", "#a9bada", "#6d7fa9"],
  ["#ccd7ee", "#8395bf", "#495880"],
  ["#b9c7e4", "#6174a0", "#2f3c60"],
];

function colorsFor(kind: PetKind, stageIndex: number) {
  const base = COLORS[kind];
  if (kind !== "nube") return base;
  return { ...base, body: CLOUD_BODY_BY_STAGE[stageIndex] ?? base.body };
}

/** La escala remata el salto: de cría diminuta a criatura desarrollada. */
const STAGE_SCALE = [0.44, 0.58, 0.72, 0.86, 1, 1.1];

export default function PetAvatar({
  kind,
  stage,
  mood,
  size = "normal",
}: {
  kind: PetKind;
  stage: PetStage;
  mood: PetMood;
  size?: "tiny" | "small" | "normal" | "large";
}) {
  const rawId = useId().replaceAll(":", "");
  const ids = { body: `pet-body-${rawId}`, soft: `pet-soft-${rawId}`, accent: `pet-accent-${rawId}` };
  const stageIndex = Math.max(0, PET_STAGES.findIndex((item) => item.id === stage));
  const colors = colorsFor(kind, stageIndex);
  const scale = STAGE_SCALE[stageIndex] ?? 1;
  const Drawing = DRAWINGS[kind];

  return (
    <div className={`pet-avatar pet-avatar-${size} pet-avatar-${kind} pet-avatar-${mood}`} role="img" aria-label={`${PET_DETAILS[kind].name}, ${PET_STAGES[stageIndex]?.label ?? stage}, ${mood}`}>
      <span className="pet-avatar-aura" aria-hidden="true" />
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <defs>
          <radialGradient id={ids.body} cx="35%" cy="25%" r="82%">
            <stop offset="0%" stopColor={colors.body[0]} />
            <stop offset="58%" stopColor={colors.body[1]} />
            <stop offset="100%" stopColor={colors.body[2]} />
          </radialGradient>
          <linearGradient id={ids.soft} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.soft[0]} />
            <stop offset="100%" stopColor={colors.soft[1]} />
          </linearGradient>
          <linearGradient id={ids.accent} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.accent[0]} />
            <stop offset="100%" stopColor={colors.accent[1]} />
          </linearGradient>
        </defs>
        <ellipse cx="80" cy={142 - (1 - scale) * 6} rx={16 + 28 * scale} ry={4 + 4.5 * scale} fill="rgba(15,44,68,.12)" />
        <g style={{ transform: `translate(80px, 84px) scale(${scale}) translate(-80px, -84px)` }}>
          <Drawing stageIndex={stageIndex} mood={mood} ids={ids} />
        </g>
      </svg>
    </div>
  );
}
