"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCloud } from "@/components/CloudProvider";
import PetAvatar from "@/components/PetAvatar";
import PetCarousel from "@/components/PetCarousel";
import TimeBackground from "@/components/TimeBackground";
import { creatureEntries, loadSocialSnapshot, type CreatureEntry, type GardenCard } from "@/lib/cloud/social";
import { PET_KINDS, PET_STAGES } from "@/lib/social/domain";

const PREVIEW_ENTRIES: CreatureEntry[] = PET_KINDS.map((kind) => ({
  state: { kind, alive: true, bornDay: "", diedDay: null, bondDays: 0, stage: "origen", mood: "dormida" },
}));

export default function PetsPage() {
  const cloud = useCloud();
  const [gardens, setGardens] = useState<GardenCard[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!cloud.user) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      setGardens((await loadSocialSnapshot()).pets);
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

  const real = useMemo(() => creatureEntries(gardens), [gardens]);
  const entries = real.length > 0 ? real : PREVIEW_ENTRIES;
  const active = entries[Math.min(activeIndex, entries.length - 1)] ?? entries[0];
  const activeStageIndex = Math.max(0, PET_STAGES.findIndex((stage) => stage.id === active.state.stage));

  if (cloud.loading) {
    return <><TimeBackground /><main className="app-shell"><div className="app-frame"><div className="glass-panel p-5 muted">Despertando a la pandilla...</div></div></main></>;
  }

  return (
    <>
      <TimeBackground />
      <main className="app-shell">
        <div className="app-frame soft-reveal">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="glass-button glass-button-muted px-3 py-2 text-sm">← Jardín</Link>
            <h1 className="glass-title text-lg font-semibold">Vuestro jardín</h1>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <PetCarousel entries={entries} size="large" onActiveChange={setActiveIndex} label="Vuestras criaturas" />

          <div className="pet-phase-strip" aria-label={`Fases de ${active.state.kind}`}>
            {PET_STAGES.map((stage, index) => (
              <div
                key={stage.id}
                className={`pet-phase ${index === activeStageIndex && real.length > 0 ? "is-current" : ""}`}
                title={stage.label}
              >
                <PetAvatar kind={active.state.kind} stage={stage.id} mood={active.state.alive ? "feliz" : "fallecida"} size="tiny" />
                <span className="pet-phase-number">{index + 1}</span>
              </div>
            ))}
          </div>

          {!loading && real.length === 0 ? (
            <Link href="/friends" className="glass-button glass-button-primary block w-full text-center py-2.5">Añadir amigo</Link>
          ) : null}
        </div>
      </main>
    </>
  );
}
