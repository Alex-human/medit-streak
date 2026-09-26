"use client";

import PetAvatar from "./PetAvatar";
import { EGG_DAYS, PET_STAGES } from "@/lib/social/domain";
import type { OwnedItem } from "@/lib/social/catalog";
import type { PetCard } from "@/lib/cloud/social";

export function petName(card: PetCard) {
  return card.identity?.name ?? "Huevo";
}

/** Una línea por persona con deberes hoy (los dos ven quién falta), o el resumen del día si no hay ninguno. */
function statusLines(card: PetCard): string[] {
  const { life, currentUserId, friend } = card;
  if (life.identityDue) return [life.bondDays >= EGG_DAYS ? "Quiere nacer: falta el nombre" : "Mañana nace: elegid nombre y elemento"];

  const name = friend.display_name;
  const lines = [currentUserId, friend.user_id].flatMap((userId) => {
    const me = userId === currentUserId;
    const alert = life.alerts.find((item) => item.userId === userId);
    if (alert?.daysLeft === 0) {
      return [me ? `Último día: haz ${alert.minutes} min de cronómetro o ${petName(card)} vuelve al huevo` : `Último día: ${name} tiene que hacer ${alert.minutes} min o ${petName(card)} vuelve al huevo`];
    }
    if (alert) {
      return [me ? `Hoy te tocan ${alert.minutes} min de cronómetro para recuperar la racha` : `Hoy ${name} tiene que hacer ${alert.minutes} min de cronómetro para recuperar la racha`];
    }
    if (!life.ownersDoneToday.includes(userId)) return [me ? "Hoy te falta meditar a ti" : `Hoy falta ${name} por meditar`];
    return [];
  });
  return lines.length > 0 ? lines : ["Hoy habéis meditado los dos"];
}

/** La mascota con lo que lleva puesto. `items` son las piezas que esta persona ya ha estrenado. */
export default function PetCreatureCard({ card, items, hiddenCount = 0, size = "normal" }: { card: PetCard; items: OwnedItem[]; hiddenCount?: number; size?: "normal" | "large" }) {
  const { life, identity } = card;
  const stageIndex = PET_STAGES.findIndex((item) => item.id === life.stage);
  const nextStage = PET_STAGES[stageIndex + 1];
  const currentStage = PET_STAGES[stageIndex];
  const progress = nextStage
    ? Math.max(0, Math.min(100, ((life.bondDays - currentStage.minBondDays) / (nextStage.minBondDays - currentStage.minBondDays)) * 100))
    : 100;

  return (
    <article className={`pet-creature pet-creature-${identity?.element ?? "huevo"}`}>
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

        <div className="text-[11px] muted mt-1.5 leading-4">
          {statusLines(card).map((line) => <p key={line}>{line}</p>)}
          {hiddenCount > 0 ? <p>Estreno en tu próxima meditación</p> : null}
        </div>
      </div>
    </article>
  );
}
