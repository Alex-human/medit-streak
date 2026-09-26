import type { PetMood } from "@/lib/social/domain";

/** Ojos grandes y brillantes: la cara sigue siendo mona en todas las evoluciones. Las aves llevan pico en vez de boca. */
export default function Face({ mood, y = 92, x = 80, beak = false }: { mood: PetMood; y?: number; x?: number; beak?: boolean }) {
  const sleeping = mood === "dormida";
  const worried = mood === "peligro" || mood === "recuperable";

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
      {beak ? (
        <path d={`M${x - 6} ${y + 7}h12l-6 8Z`} fill="#ffc94d" stroke="rgba(170,100,20,.55)" strokeWidth="1.3" strokeLinejoin="round" />
      ) : (
        <path
          d={worried ? `M${x - 6} ${y + 18}c4-4.5 8-4.5 12 0` : sleeping ? `M${x - 4} ${y + 16}h8` : `M${x - 7.5} ${y + 13}c4.5 7.5 10.5 7.5 15 0`}
          fill="none"
          stroke="rgba(18,40,55,.8)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
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
