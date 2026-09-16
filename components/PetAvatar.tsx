import { useId, type ReactNode } from "react";
import { PET_DETAILS, PET_STAGES, type PetKind, type PetMood, type PetStage } from "@/lib/social/domain";

function Face({ mood, x = 80, y = 92 }: { mood: PetMood; x?: number; y?: number }) {
  const sleeping = mood === "dormida";
  const worried = mood === "peligro" || mood === "recuperable";

  if (mood === "fallecida") {
    return (
      <g stroke="rgba(31,45,57,.72)" strokeWidth="3.4" strokeLinecap="round">
        <path d={`M${x - 17} ${y - 5}l8 8m0-8-8 8M${x + 9} ${y - 5}l8 8m0-8-8 8`} />
        <path d={`M${x - 6} ${y + 17}h12`} />
      </g>
    );
  }

  return (
    <g>
      {sleeping ? (
        <g fill="none" stroke="rgba(20,42,56,.8)" strokeWidth="3.2" strokeLinecap="round">
          <path d={`M${x - 20} ${y}c4 3 8 3 12 0M${x + 8} ${y}c4 3 8 3 12 0`} />
        </g>
      ) : (
        <g fill="rgba(18,40,55,.86)">
          <ellipse cx={x - 14} cy={y} rx="4" ry={worried ? 5 : 6.2} />
          <ellipse cx={x + 14} cy={y} rx="4" ry={worried ? 5 : 6.2} />
          <circle cx={x - 15} cy={y - 2} r="1.25" fill="white" />
          <circle cx={x + 13} cy={y - 2} r="1.25" fill="white" />
        </g>
      )}
      <path
        d={worried ? `M${x - 6} ${y + 18}c4-4 8-4 12 0` : sleeping ? `M${x - 4} ${y + 17}h8` : `M${x - 7} ${y + 14}c4 7 10 7 14 0`}
        fill="none"
        stroke="rgba(18,40,55,.76)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {mood === "feliz" ? (
        <g fill="rgba(255,117,157,.36)">
          <ellipse cx={x - 27} cy={y + 12} rx="8" ry="3.5" />
          <ellipse cx={x + 27} cy={y + 12} rx="8" ry="3.5" />
        </g>
      ) : null}
      {mood === "peligro" ? <path d={`M${x + 30} ${y - 22}c0 10-11 10-11 0 0-5 5.5-12 5.5-12s5.5 7 5.5 12`} fill="rgba(113,205,255,.9)" /> : null}
    </g>
  );
}

type PetDrawingProps = {
  stageIndex: number;
  mood: PetMood;
  ids: { body: string; soft: string; accent: string };
};

function FirePet({ stageIndex, mood, ids }: PetDrawingProps) {
  return (
    <>
      {stageIndex >= 5 ? <ellipse cx="80" cy="42" rx="39" ry="13" fill="none" stroke={`url(#${ids.accent})`} strokeWidth="5" opacity=".72" /> : null}
      {stageIndex >= 4 ? (
        <g className="pet-wings" fill={`url(#${ids.soft})`} stroke="rgba(255,255,255,.55)" strokeWidth="2">
          <path d="M47 78C25 65 15 76 21 94c8-9 16-8 25 0-3-7-2-11 1-16Z" />
          <path d="M113 78c22-13 32-2 26 16-8-9-16-8-25 0 3-7 2-11-1-16Z" />
        </g>
      ) : null}
      {stageIndex >= 2 ? <path className="pet-tail" d="M117 103c25 5 24-22 10-19 7 7 0 12-9 10" fill="none" stroke={`url(#${ids.accent})`} strokeWidth="11" strokeLinecap="round" /> : null}
      {stageIndex >= 1 ? (
        <g fill={`url(#${ids.accent})`}>
          <path d="M48 84C29 75 31 57 44 46c-2 13 6 16 13 23Z" />
          <path d="M112 84c19-9 17-27 4-38 2 13-6 16-13 23Z" />
        </g>
      ) : null}
      <path d="M80 22c21 24 39 48 36 76-2 25-16 42-36 42s-35-16-36-40c-2-21 12-31 17-47 3 10 9 14 14 15-5-19-1-34 5-46Z" fill={`url(#${ids.body})`} stroke="rgba(255,255,255,.72)" strokeWidth="3" />
      <path d="M81 48c12 17 21 31 18 48-2 14-9 23-19 23-11 0-18-9-19-22-1-10 5-16 9-24 2 7 6 9 10 10-3-13-2-23 1-35Z" fill={`url(#${ids.soft})`} opacity=".92" />
      {stageIndex >= 3 ? <path d="M57 57 43 36c14 2 22 8 25 18m25 3 14-21c-14 2-22 8-25 18" fill={`url(#${ids.accent})`} stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeLinecap="round" /> : null}
      {stageIndex >= 5 ? <path d="m63 43 8-15 10 11 11-14 7 18" fill="none" stroke="#fff1a8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /> : null}
      <Face mood={mood} y={94} />
    </>
  );
}

function WaterPet({ stageIndex, mood, ids }: PetDrawingProps) {
  return (
    <>
      {stageIndex >= 5 ? <circle cx="80" cy="82" r="61" fill="none" stroke={`url(#${ids.accent})`} strokeWidth="4" strokeDasharray="3 11" opacity=".7" /> : null}
      {stageIndex >= 4 ? <path d="M42 98 20 118l30-2 8 23m60-41 22 20-30-2-8 23" fill={`url(#${ids.soft})`} stroke="rgba(255,255,255,.7)" strokeWidth="2" strokeLinejoin="round" /> : null}
      <path d="M80 18C66 40 43 63 43 92c0 28 16 47 37 47s37-19 37-47C117 63 94 40 80 18Z" fill={`url(#${ids.body})`} stroke="rgba(255,255,255,.78)" strokeWidth="3" />
      <path d="M80 27 67 84l13 49 13-49Z" fill={`url(#${ids.soft})`} opacity={stageIndex >= 2 ? ".72" : ".3"} />
      {stageIndex >= 1 ? <path d="M52 82 80 55l28 27-28 46Z" fill="none" stroke="rgba(227,250,255,.75)" strokeWidth="2.5" /> : null}
      {stageIndex >= 2 ? <g fill="rgba(236,253,255,.58)"><path d="m53 83 27-27-13 37Z" /><path d="m107 83-27-27 13 37Z" /></g> : null}
      {stageIndex >= 3 ? <path d="m54 61 9-22 17 16 17-16 9 22-10 9H64Z" fill={`url(#${ids.accent})`} stroke="rgba(255,255,255,.8)" strokeWidth="2.5" /> : null}
      {stageIndex >= 4 ? <g stroke="rgba(229,251,255,.88)" strokeWidth="3" strokeLinecap="round"><path d="M36 60h18M45 51v18m61-9h18m-9-9v18" /></g> : null}
      <ellipse cx="65" cy="64" rx="10" ry="21" fill="rgba(255,255,255,.27)" transform="rotate(26 65 64)" />
      <Face mood={mood} y={96} />
    </>
  );
}

function ForestPet({ stageIndex, mood, ids }: PetDrawingProps) {
  if (stageIndex === 0) {
    return (
      <>
        <ellipse cx="80" cy="126" rx="35" ry="9" fill="rgba(36,74,53,.13)" />
        <path d="M80 55c-20 7-31 27-25 49 5 20 15 34 25 34s20-14 25-34c6-22-5-42-25-49Z" fill={`url(#${ids.body})`} stroke="rgba(255,255,255,.65)" strokeWidth="3" />
        <path className="pet-sprout" d="M80 58c-5-20 5-30 17-31 0 13-5 24-17 31Zm-1 0C67 45 56 44 49 50c8 11 18 14 30 8Z" fill={`url(#${ids.accent})`} stroke="rgba(255,255,255,.55)" strokeWidth="2" />
        <Face mood={mood} y={96} />
      </>
    );
  }

  return (
    <>
      {stageIndex >= 4 ? <circle cx="80" cy="50" r="38" fill={`url(#${ids.soft})`} opacity=".65" /> : null}
      {stageIndex >= 2 ? (
        <g fill="none" stroke={`url(#${ids.body})`} strokeWidth={stageIndex >= 4 ? 12 : 9} strokeLinecap="round">
          <path d="M50 91 27 75m83 16 23-16" />
          {stageIndex >= 3 ? <path d="M38 83 28 61m94 22 10-22" /> : null}
        </g>
      ) : null}
      <path d="M55 57c5-17 45-17 50 0l7 59c2 19-12 26-32 26s-34-7-32-26Z" fill={`url(#${ids.body})`} stroke="rgba(255,255,255,.6)" strokeWidth="3" />
      <path d="M69 60c-7 21-8 48-2 76m25-75c5 23 5 49 0 75" fill="none" stroke="rgba(91,58,35,.24)" strokeWidth="5" strokeLinecap="round" />
      <path className="pet-sprout" d="M80 57c-5-23 6-36 21-36 0 17-7 29-21 36Zm-2 0C63 41 48 41 39 50c11 13 24 17 39 7Z" fill={`url(#${ids.accent})`} stroke="rgba(255,255,255,.6)" strokeWidth="2.5" />
      {stageIndex >= 2 ? <g fill={`url(#${ids.accent})`}><ellipse cx="27" cy="67" rx="13" ry="7" transform="rotate(35 27 67)" /><ellipse cx="133" cy="67" rx="13" ry="7" transform="rotate(-35 133 67)" /></g> : null}
      {stageIndex >= 3 ? <path d="M79 31c-4-13 6-21 12-17 5 4 1 13-12 17Z" fill="#ffe78e" stroke="rgba(255,255,255,.65)" strokeWidth="2" /> : null}
      {stageIndex >= 5 ? <path d="M45 51c7-30 63-30 70 0-12-7-24-8-35 0-12-8-23-7-35 0Z" fill={`url(#${ids.accent})`} stroke="#fff0ad" strokeWidth="3" /> : null}
      <Face mood={mood} y={92} />
    </>
  );
}

function CloudPet({ stageIndex, mood, ids }: PetDrawingProps) {
  return (
    <>
      {stageIndex >= 5 ? <ellipse cx="80" cy="80" rx="62" ry="49" fill="none" stroke={`url(#${ids.accent})`} strokeWidth="4" strokeDasharray="2 10" opacity=".72" /> : null}
      {stageIndex >= 4 ? <path d="M49 119 38 142m25-20-5 25m53-28 11 23m-25-20 5 25" stroke={`url(#${ids.accent})`} strokeWidth="6" strokeLinecap="round" /> : null}
      {stageIndex >= 3 ? <><path d="M36 106c12 21 76 21 88 0" fill="none" stroke="rgba(255,151,182,.78)" strokeWidth="9" strokeLinecap="round" /><path d="M38 108c15 14 69 14 84 0" fill="none" stroke="rgba(255,224,121,.85)" strokeWidth="5" strokeLinecap="round" /></> : null}
      <g fill={`url(#${ids.body})`} stroke="rgba(255,255,255,.76)" strokeWidth="3">
        <circle cx="54" cy="88" r={stageIndex === 0 ? 27 : 31} />
        <circle cx="82" cy={stageIndex === 0 ? 77 : 69} r={stageIndex === 0 ? 31 : 39} />
        {stageIndex >= 1 ? <circle cx="113" cy="88" r="29" /> : null}
        <rect x="38" y="83" width={stageIndex === 0 ? 73 : 94} height="43" rx="22" />
      </g>
      <ellipse cx="66" cy="60" rx="13" ry="8" fill="rgba(255,255,255,.34)" transform="rotate(-18 66 60)" />
      {stageIndex >= 1 ? <g fill={`url(#${ids.accent})`} opacity=".85"><path d="m45 127-7 15h9l-4 13 16-20h-10l5-8Z" /><path d="m105 128-5 13h8l-3 12 14-18h-9l4-7Z" /></g> : null}
      {stageIndex >= 2 ? <g fill="#fff5b0"><path d="m29 56 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" /><path d="m129 46 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" /></g> : null}
      {stageIndex >= 4 ? <path d="M102 43c-13-17 5-30 18-20-13 1-15 14-8 22Z" fill="#fff3ad" opacity=".9" /> : null}
      {stageIndex >= 5 ? <path d="m67 43 6-14 8 11 10-13 6 16" fill="none" stroke="#fff4bb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}
      <Face mood={mood} y={91} />
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
  fuego: { body: ["#ffdf71", "#ff8a4c", "#ef426f"], soft: ["#fff5b5", "#ffb13b"], accent: ["#ff6868", "#ffcf4d"] },
  agua: { body: ["#e5fbff", "#86dffa", "#6196ee"], soft: ["#ffffff", "#b7ecff"], accent: ["#8ce9ff", "#8c9cff"] },
  bosque: { body: ["#d8b07a", "#a56d43", "#704932"], soft: ["#b9ef92", "#67bb72"], accent: ["#d8f69a", "#5ebf73"] },
  nube: { body: ["#ffffff", "#dceeff", "#b7c9f0"], soft: ["#ffffff", "#d9f6ff"], accent: ["#f4b2ff", "#8edcff"] },
};

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
  const colors = COLORS[kind];
  const stageIndex = PET_STAGES.findIndex((item) => item.id === stage);
  const scale = [0.7, 0.78, 0.86, 0.93, 1, 1.04][stageIndex] ?? 1;
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
        <ellipse cx="80" cy="142" rx="43" ry="8" fill="rgba(15,44,68,.12)" />
        <g style={{ transform: `translate(80px, 84px) scale(${scale}) translate(-80px, -84px)`, transformOrigin: "80px 84px" }}>
          <Drawing stageIndex={stageIndex} mood={mood} ids={ids} />
        </g>
      </svg>
    </div>
  );
}
