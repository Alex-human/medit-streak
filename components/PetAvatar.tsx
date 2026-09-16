import type { CSSProperties } from "react";
import type { PetMood, PetStage } from "@/lib/social/domain";

function colorFor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return 178 + (hash % 92);
}

export default function PetAvatar({
  seed,
  stage,
  mood,
  size = "normal",
}: {
  seed: string;
  stage: PetStage;
  mood: PetMood;
  size?: "small" | "normal" | "large";
}) {
  const hue = colorFor(seed);
  const style = {
    "--pet-hue": hue,
    "--pet-saturation": mood === "fallecida" ? "8%" : "72%",
    "--pet-lightness": mood === "peligro" ? "62%" : "72%",
  } as CSSProperties;
  const sleeping = mood === "dormida";
  const sad = mood === "peligro" || mood === "recuperable" || mood === "fallecida";

  return (
    <div className={`pet-avatar pet-avatar-${size} pet-avatar-${mood}`} style={style} role="img" aria-label={`${stage}, ${mood}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <radialGradient id={`pet-body-${seed}`} cx="38%" cy="28%" r="72%">
            <stop offset="0%" stopColor="hsl(var(--pet-hue) var(--pet-saturation) 92%)" />
            <stop offset="64%" stopColor="hsl(var(--pet-hue) var(--pet-saturation) var(--pet-lightness))" />
            <stop offset="100%" stopColor="hsl(var(--pet-hue) var(--pet-saturation) 53%)" />
          </radialGradient>
        </defs>

        {stage !== "semilla" ? (
          <g className="pet-sprout">
            <path d="M61 29C51 20 51 10 57 5c9 8 12 16 8 25" fill="hsl(calc(var(--pet-hue) + 68) 64% 58%)" />
            <path d="M63 26c8-10 18-10 22-5-7 9-14 12-23 10" fill="hsl(calc(var(--pet-hue) + 44) 70% 66%)" />
          </g>
        ) : null}

        {stage === "guardián" ? (
          <g className="pet-crown">
            <path d="M39 30 48 15l12 13 12-15 10 18-7 8H45z" fill="rgba(255,245,180,.9)" stroke="rgba(255,255,255,.72)" strokeWidth="2" />
            <circle cx="49" cy="27" r="3" fill="white" />
            <circle cx="71" cy="27" r="3" fill="white" />
          </g>
        ) : null}

        {stage === "lumo" || stage === "guardián" ? (
          <path className="pet-tail" d="M91 71c19-6 19 13 7 18-7 3-12-1-8-5 4 2 9-1 9-5 0-5-5-7-10-3" fill="none" stroke="hsl(var(--pet-hue) var(--pet-saturation) 58%)" strokeWidth="8" strokeLinecap="round" />
        ) : null}

        <ellipse cx="60" cy={stage === "semilla" ? 67 : 70} rx={stage === "semilla" ? 32 : 37} ry={stage === "semilla" ? 35 : 39} fill={`url(#pet-body-${seed})`} stroke="rgba(255,255,255,.62)" strokeWidth="2.5" />
        <ellipse cx="48" cy="54" rx="10" ry="7" fill="rgba(255,255,255,.22)" transform="rotate(-28 48 54)" />

        {sleeping ? (
          <g stroke="rgba(19,35,58,.78)" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M43 70c4 3 8 3 12 0" />
            <path d="M66 70c4 3 8 3 12 0" />
          </g>
        ) : (
          <g fill="rgba(16,31,52,.84)">
            <ellipse cx="50" cy="69" rx="3.3" ry={sad ? 4.5 : 5.5} />
            <ellipse cx="72" cy="69" rx="3.3" ry={sad ? 4.5 : 5.5} />
            <circle cx="49" cy="67" r="1" fill="white" />
            <circle cx="71" cy="67" r="1" fill="white" />
          </g>
        )}

        <path
          d={sad ? "M54 88c4-4 9-4 13 0" : sleeping ? "M57 86h7" : "M54 84c4 6 10 6 14 0"}
          fill="none"
          stroke="rgba(16,31,52,.72)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {mood === "feliz" ? <g fill="rgba(255,117,157,.34)"><ellipse cx="39" cy="82" rx="7" ry="3" /><ellipse cx="82" cy="82" rx="7" ry="3" /></g> : null}
        {mood === "peligro" ? <path d="M91 34c0 8-10 8-10 0 0-4 5-10 5-10s5 6 5 10" fill="rgba(116,213,255,.9)" /> : null}
        {mood === "fallecida" ? <g stroke="rgba(29,39,52,.62)" strokeWidth="3"><path d="m45 65 8 8m0-8-8 8m20-8 8 8m0-8-8 8" /></g> : null}
      </svg>
    </div>
  );
}
