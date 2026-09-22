"use client";

import PetAvatar from "./PetAvatar";
import { EGG_DAYS, PET_STAGES } from "@/lib/social/domain";
import type { CatalogItem } from "@/lib/social/catalog";
import type { PetCard } from "@/lib/cloud/social";

export function petName(card: PetCard) {
  return card.identity?.name ?? "Huevo";
}

function statusLine({ life, currentUserId, friend }: PetCard) {
  if (life.phase === "fallen") {
    return life.rebirthInDays === 1 ? "Último día: 60 min la reviven" : `Revive con 60 min · huevo en ${life.rebirthInDays} días`;
  }
  if (life.identityDue) return life.bondDays >= EGG_DAYS ? "Quiere nacer: falta el nombre" : "Mañana nace: elegid nombre y elemento";
  if (life.mood === "feliz") return "Hoy la cuidáis los dos";
  if (life.mood === "esperando") return life.ownersDoneToday.includes(currentUserId) ? `Falta ${friend.display_name}` : "Te toca a ti";
  if (life.mood === "recuperable") return "30 min hoy salvan la racha";
  if (life.mood === "peligro") return life.rescueDaysLeft === 0 ? "Último día: 60 min" : `${life.rescueDaysLeft} días · 60 min`;
  return "Esperando vuestra sesión";
}

/** La mascota con lo que lleva puesto. `items` son las piezas que esta persona ya ha estrenado. */
export default function PetCreatureCard({ card, items, hiddenCount = 0, size = "normal" }: { card: PetCard; items: CatalogItem[]; hiddenCount?: number; size?: "normal" | "large" }) {
  const { life, identity } = card;
  const stageIndex = PET_STAGES.findIndex((item) => item.id === life.stage);
  const nextStage = PET_STAGES[stageIndex + 1];
  const currentStage = PET_STAGES[stageIndex];
  const progress = nextStage
    ? Math.max(0, Math.min(100, ((life.bondDays - currentStage.minBondDays) / (nextStage.minBondDays - currentStage.minBondDays)) * 100))
    : 100;

  return (
    <article className={`pet-creature pet-creature-${identity?.element ?? "huevo"} ${life.phase === "fallen" ? "is-fallen" : ""}`}>
      <div className="pet-creature-stage">
        <PetAvatar
          kind={identity?.element ?? null}
          stage={life.stage}
          mood={life.mood}
          eggPhase={life.eggPhase}
          items={items}
          ancestral={life.ancestral}
          name={petName(card)}
          size={size}
        />
      </div>

      <div className="pet-creature-foot">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="glass-title font-semibold leading-tight truncate">{petName(card)}</h3>
          <span className="text-[10px] muted tabular-nums shrink-0" aria-label={`${life.bondDays} días de vínculo`}>
            {life.life > 1 ? `vida ${life.life} · ` : ""}{life.bondDays} d
          </span>
        </div>

        <div className="pet-pips mt-1.5" role="img" aria-label={`Fase ${stageIndex + 1} de ${PET_STAGES.length}: ${currentStage.label}`}>
          {PET_STAGES.map((item, index) => (
            <span key={item.id} className={index < stageIndex ? "is-done" : ""}>
              {index === stageIndex ? <i style={{ width: `${progress}%` }} /> : null}
            </span>
          ))}
        </div>

        <p className="text-[11px] muted mt-1.5 leading-4">
          {statusLine(card)}
          {hiddenCount > 0 ? ` · Estreno en tu próxima meditación` : ""}
        </p>
      </div>
    </article>
  );
}
