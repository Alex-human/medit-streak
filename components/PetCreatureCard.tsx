"use client";

import PetAvatar from "./PetAvatar";
import { PET_DETAILS, PET_STAGES } from "@/lib/social/domain";
import type { CreatureEntry } from "@/lib/cloud/social";

function statusLine({ state, garden }: CreatureEntry) {
  if (!state.alive) {
    return state.rebirthInDays === 1 ? "Último día: 60 min la reviven" : `Revive con 60 min · huevo en ${state.rebirthInDays} días`;
  }
  if (!garden) return "Nace al criar con un amigo";

  const { life, currentUserId, friend } = garden;
  if (life.mood === "feliz") return "Hoy la cuidáis los dos";
  if (life.mood === "esperando") return life.ownersDoneToday.includes(currentUserId) ? `Falta ${friend.display_name}` : "Te toca a ti";
  if (life.mood === "recuperable") return "30 min hoy salvan la racha";
  if (life.mood === "peligro") return life.rescueDaysLeft === 0 ? "Último día: 60 min" : `${life.rescueDaysLeft} días · 60 min`;
  return "Esperando vuestra sesión";
}

export default function PetCreatureCard({ entry, size = "normal" }: { entry: CreatureEntry; size?: "normal" | "large" }) {
  const { state } = entry;
  const details = PET_DETAILS[state.kind];
  const stageIndex = Math.max(0, PET_STAGES.findIndex((item) => item.id === state.stage));
  const nextStage = PET_STAGES[stageIndex + 1];
  const currentStage = PET_STAGES[stageIndex];
  const progress = nextStage
    ? Math.max(0, Math.min(100, ((state.bondDays - currentStage.minBondDays) / (nextStage.minBondDays - currentStage.minBondDays)) * 100))
    : 100;

  return (
    <article className={`pet-creature pet-creature-${state.kind} ${state.alive ? "" : "is-fallen"}`}>
      <div className="pet-creature-stage">
        <PetAvatar kind={state.kind} stage={state.stage} mood={state.mood} eggPhase={state.eggPhase} size={size === "large" ? "large" : "normal"} />
      </div>

      <div className="pet-creature-foot">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="glass-title font-semibold leading-tight">{details.name}</h3>
          <span className="text-[10px] muted tabular-nums" aria-label={`${state.bondDays} días de vínculo`}>{state.bondDays} d</span>
        </div>

        <div className="pet-pips mt-1.5" role="img" aria-label={`Fase ${stageIndex + 1} de ${PET_STAGES.length}: ${currentStage.label}`}>
          {PET_STAGES.map((item, index) => (
            <span key={item.id} className={index < stageIndex ? "is-done" : ""}>
              {index === stageIndex ? <i style={{ width: `${progress}%` }} /> : null}
            </span>
          ))}
        </div>

        <p className="text-[11px] muted mt-1.5 leading-4">{statusLine(entry)}</p>
      </div>
    </article>
  );
}
