"use client";

import PetAvatar from "./PetAvatar";
import { PET_DETAILS, PET_KINDS, type PetKind, type PetMood, type PetStage } from "@/lib/social/domain";

export default function PetKindRail({
  selected,
  onSelect,
  stage,
  mood,
  fallenKinds = [],
  compact = false,
}: {
  selected: PetKind;
  onSelect: (kind: PetKind) => void;
  stage: PetStage;
  mood: PetMood;
  fallenKinds?: PetKind[];
  compact?: boolean;
}) {
  return (
    <div className={`pet-kind-rail ${compact ? "pet-kind-rail-compact" : ""}`} aria-label="Cambiar mascota">
      {PET_KINDS.map((kind) => {
        const fallen = fallenKinds.includes(kind);
        return (
          <button
            key={kind}
            type="button"
            className={`pet-kind-button ${selected === kind ? "is-selected" : ""} ${fallen ? "is-fallen" : ""}`}
            aria-pressed={selected === kind}
            aria-label={`${PET_DETAILS[kind].name}${fallen ? ", necesita revivir" : ""}`}
            onClick={() => onSelect(kind)}
          >
            <PetAvatar kind={kind} stage={stage} mood={fallen ? "fallecida" : mood} size="tiny" />
            {!compact ? <span>{PET_DETAILS[kind].name}</span> : null}
            {fallen ? <span className="pet-fallen-mark" aria-hidden="true">✦</span> : null}
          </button>
        );
      })}
    </div>
  );
}
