"use client";

import { useState } from "react";
import PetAvatar from "./PetAvatar";
import PetKindRail from "./PetKindRail";
import { fallenPetKinds, PET_DETAILS, PET_KINDS, PET_STAGES, type PetKind } from "@/lib/social/domain";
import type { PetCardData } from "@/lib/cloud/social";

function collectionCopy(card: PetCardData) {
  const friendName = card.friend.display_name;
  const meDone = card.life.ownersDoneToday.includes(card.currentUserId);
  if (card.life.fallenCount === 4) return "Toda la pandilla ha caído. Una sesión de 60 min trae a una de vuelta.";
  if (card.life.fallenCount > 0) return `${card.life.fallenCount === 1 ? "Una criatura necesita" : `${card.life.fallenCount} criaturas necesitan`} revivir. Meditad 60 min.`;
  if (card.life.mood === "feliz") return "Hoy la habéis cuidado los dos.";
  if (card.life.mood === "esperando") return meDone ? `Esperando a ${friendName}.` : `${friendName} ya ha meditado. Te espera.`;
  if (card.life.mood === "recuperable") return "La racha aún se salva hoy con 30 min.";
  if (card.life.mood === "peligro") return card.life.rescueDaysLeft === 0 ? "Último día: protégelas con 60 min." : `${card.life.rescueDaysLeft} días para protegerlas con 60 min.`;
  return "La pandilla descansa hasta vuestra próxima meditación.";
}

export default function PetCollectionCard({ card, celebration = false }: { card: PetCardData; celebration?: boolean }) {
  const fallenKinds = fallenPetKinds(card.pet.id, card.life.fallenCount);
  const firstLiving = PET_KINDS.find((kind) => !fallenKinds.includes(kind)) ?? "fuego";
  const [selectedKind, setSelectedKind] = useState<PetKind>(firstLiving);
  const selectedFallen = fallenKinds.includes(selectedKind);
  const stageIndex = Math.max(0, PET_STAGES.findIndex((item) => item.id === card.life.stage));
  const stage = PET_STAGES[stageIndex];
  const nextStage = PET_STAGES[stageIndex + 1];
  const progress = nextStage
    ? Math.max(0, Math.min(100, ((card.life.bondDays - stage.minBondDays) / (nextStage.minBondDays - stage.minBondDays)) * 100))
    : 100;

  return (
    <article className={celebration ? "celebration-pet pet-collection-card" : "pet-card pet-collection-card"}>
      <div className={`pet-collection-hero pet-collection-hero-${selectedKind}`}>
        <PetAvatar
          kind={selectedKind}
          stage={card.life.stage}
          mood={selectedFallen ? "fallecida" : card.life.mood}
          size={celebration ? "large" : "normal"}
        />
        <div className="pet-collection-identity">
          <p className="pet-eyebrow">{PET_DETAILS[selectedKind].title}</p>
          <h3 className="glass-title font-semibold">{PET_DETAILS[selectedKind].name}</h3>
          <p className="text-[11px] muted mt-0.5">Pandilla «{card.pet.name}» · con {card.friend.display_name}</p>
        </div>
      </div>

      <PetKindRail
        selected={selectedKind}
        onSelect={setSelectedKind}
        stage={card.life.stage}
        mood={card.life.mood}
        fallenKinds={fallenKinds}
        compact={celebration}
      />

      <div className="pet-collection-status">
        <div className="flex items-center justify-between gap-2">
          <span className="pet-stage-label">Etapa {stageIndex + 1} · {stage.label}</span>
          <span className="text-[10px] muted">{card.life.bondDays} días de vínculo</span>
        </div>
        <p className="text-xs mt-2 leading-5">{selectedFallen ? `${PET_DETAILS[selectedKind].name} espera una sesión de 60 min para volver.` : collectionCopy(card)}</p>
        <div className="pet-bond mt-2"><span style={{ width: `${progress}%` }} /></div>
        {nextStage ? <p className="text-[10px] muted mt-1">Siguiente evolución en {Math.max(0, nextStage.minBondDays - card.life.bondDays)} días de vínculo</p> : <p className="text-[10px] muted mt-1">Evolución completa</p>}
      </div>
    </article>
  );
}
