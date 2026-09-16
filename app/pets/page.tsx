"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useCloud } from "@/components/CloudProvider";
import PetAvatar from "@/components/PetAvatar";
import PetCollectionCard from "@/components/PetCollectionCard";
import PetKindRail from "@/components/PetKindRail";
import TimeBackground from "@/components/TimeBackground";
import { loadSocialSnapshot, type PetCardData } from "@/lib/cloud/social";
import { PET_DETAILS, PET_KINDS, PET_STAGES, type PetKind } from "@/lib/social/domain";

export default function PetsPage() {
  const cloud = useCloud();
  const [selectedKind, setSelectedKind] = useState<PetKind>("fuego");
  const [stageIndex, setStageIndex] = useState(0);
  const [collections, setCollections] = useState<PetCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!cloud.user) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      setCollections((await loadSocialSnapshot()).pets);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo abrir vuestro jardín.");
    } finally {
      setLoading(false);
    }
  }, [cloud.user]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  if (cloud.loading) {
    return <><TimeBackground /><main className="app-shell"><div className="app-frame"><div className="glass-panel p-5 muted">Despertando a la pandilla...</div></div></main></>;
  }

  const stage = PET_STAGES[stageIndex];
  const details = PET_DETAILS[selectedKind];

  return (
    <>
      <TimeBackground />
      <main className="app-shell">
        <div className="app-frame soft-reveal">
          <header className="glass-panel p-4 pet-page-header">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="glass-button glass-button-muted px-3 py-2 text-sm">← Jardín</Link>
              <span className="glass-chip">4 criaturas · 6 etapas</span>
            </div>
            <p className="pet-eyebrow mt-5">Vuestra pandilla elemental</p>
            <h1 className="glass-title text-3xl font-semibold mt-1">Conócelas antes de que crezcan</h1>
            <p className="text-sm muted mt-2 max-w-xl">Cambiad de criatura y recorred sus seis evoluciones. En el jardín real avanzan solo cuando los dos cuidáis la racha.</p>
          </header>

          <section className={`pet-lab pet-lab-${selectedKind}`} aria-label="Previsualizador de mascotas">
            <div className="pet-lab-glow" aria-hidden="true" />
            <div className="pet-lab-copy">
              <span className="pet-stage-counter">0{stageIndex + 1} / 06</span>
              <p className="pet-eyebrow">{details.title}</p>
              <h2 className="pet-lab-name">{details.name}</h2>
              <p className="text-sm muted leading-6">{details.description}</p>
            </div>
            <div className="pet-lab-avatar">
              <PetAvatar kind={selectedKind} stage={stage.id} mood="feliz" size="large" />
            </div>

            <div className="pet-lab-controls">
              <PetKindRail selected={selectedKind} onSelect={setSelectedKind} stage={stage.id} mood="feliz" />
              <div className="pet-evolution-track" aria-label="Elegir etapa de evolución">
                {PET_STAGES.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={stageIndex === index ? "is-selected" : ""}
                    aria-pressed={stageIndex === index}
                    onClick={() => setStageIndex(index)}
                  >
                    <span className="pet-evolution-dot">{index + 1}</span>
                    <span className="pet-evolution-label">{item.label}</span>
                    <span className="pet-evolution-days">{item.minBondDays === 0 ? "Nace" : `${item.minBondDays} d`}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="glass-panel-soft p-4 pet-rules">
            <div className="pet-rule"><span>🌱</span><div><strong>Crecen juntas</strong><p>Cada día que ambos meditáis suma vínculo y acerca la siguiente evolución.</p></div></div>
            <div className="pet-rule"><span>🛟</span><div><strong>Cinco días para salvarlas</strong><p>Si alguien rompe su racha, una sesión de 60 min evita que caiga una criatura.</p></div></div>
            <div className="pet-rule"><span>✨</span><div><strong>También pueden volver</strong><p>Si una muere, una sesión posterior de 60 min revive una. No dejéis que caigan las cuatro.</p></div></div>
          </section>

          <section className="glass-panel p-3">
            <div className="flex items-end justify-between gap-3 px-1">
              <div><p className="pet-eyebrow">Estado real</p><h2 className="glass-title text-xl font-semibold mt-1">Vuestro jardín</h2></div>
              {loading ? <span className="text-xs muted">Actualizando...</span> : null}
            </div>
            {error ? <p className="form-error mt-3">{error}</p> : null}
            {!loading && !error && collections.length === 0 ? (
              <div className="pet-garden-empty mt-3">
                <div className="pet-garden-empty-row">
                  {PET_KINDS.map((kind) => <PetAvatar key={kind} kind={kind} stage="origen" mood="dormida" size="tiny" />)}
                </div>
                <p className="text-sm font-semibold mt-2">Todavía no han nacido en vuestro jardín.</p>
                <p className="text-xs muted mt-1">Acepta una amistad y cread vuestra pandilla compartida.</p>
                <Link href="/friends" className="glass-button glass-button-primary inline-flex mt-3 px-4 py-2 text-xs">Ir a Amigos</Link>
              </div>
            ) : null}
            {collections.length > 0 ? <div className="pet-row mt-3">{collections.map((card) => <PetCollectionCard key={card.pet.id} card={card} />)}</div> : null}
          </section>
        </div>
      </main>
    </>
  );
}
