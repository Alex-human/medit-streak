"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useCloud } from "./CloudProvider";
import PetAvatar from "./PetAvatar";
import PetCollectionCard from "./PetCollectionCard";
import PetKindRail from "./PetKindRail";
import { loadSocialSnapshot, type PetCardData } from "@/lib/cloud/social";
import type { PetKind } from "@/lib/social/domain";

export default function PetShelf({ celebrate, onCelebrationClose }: { celebrate: boolean; onCelebrationClose: () => void }) {
  const { user } = useCloud();
  const [pets, setPets] = useState<PetCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emptySelected, setEmptySelected] = useState<PetKind>("fuego");

  const refresh = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      setPets((await loadSocialSnapshot()).pets);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar tus mascotas.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  if (!user) return null;

  return (
    <>
      <section className="pet-shelf glass-panel p-3" aria-label="Tus mascotas">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs muted">Tus mascotas</div>
            <div className="glass-title text-lg font-semibold mt-0.5">El jardín de hoy</div>
          </div>
          <div className="flex gap-2">
            <Link href="/pets" className="glass-button glass-button-primary px-3 py-2 text-xs">Mascotas</Link>
            <Link href="/friends" className="glass-button glass-button-muted px-3 py-2 text-xs">Amigos</Link>
          </div>
        </div>

        {loading ? <div className="pet-shelf-loading mt-3" aria-label="Cargando mascotas" /> : null}
        {!loading && error ? <p className="form-error mt-3">{error}</p> : null}
        {!loading && !error && pets.length === 0 ? (
          <div className="pet-empty pet-empty-pandilla mt-3">
            <PetAvatar kind={emptySelected} stage="origen" mood="dormida" size="small" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">La pandilla espera a vuestro vínculo.</p>
              <p className="text-[11px] muted mt-1">Las cuatro criaturas nacerán juntas al criar con un amigo.</p>
              <PetKindRail selected={emptySelected} onSelect={setEmptySelected} stage="origen" mood="dormida" compact />
              <div className="flex gap-3 mt-2">
                <Link href="/pets" className="text-xs underline underline-offset-4">Ver evoluciones</Link>
                <Link href="/friends" className="text-xs underline underline-offset-4">Añadir amigo</Link>
              </div>
            </div>
          </div>
        ) : null}
        {pets.length > 0 ? <div className="pet-row mt-3">{pets.map((card) => <PetCollectionCard key={card.pet.id} card={card} />)}</div> : null}
      </section>

      {celebrate && !loading && pets.length > 0 ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="Tus mascotas después de meditar">
          <div className="absolute inset-0 celebration-backdrop" />
          <section className="relative celebration-panel glass-popover p-5 soft-reveal">
            <div className="text-center">
              <div className="glass-chip inline-flex">Meditación completada</div>
              <h2 className="glass-title text-2xl font-semibold mt-3">Tu calma ha llegado hasta ellas</h2>
            </div>
            <div className="celebration-row mt-4">{pets.map((card) => <PetCollectionCard key={card.pet.id} card={card} celebration />)}</div>
            <button type="button" onClick={onCelebrationClose} className="glass-button glass-button-primary w-full mt-5 py-3">Volver al jardín</button>
          </section>
        </div>
      ) : null}
    </>
  );
}
