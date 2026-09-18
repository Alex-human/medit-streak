"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCloud } from "./CloudProvider";
import PetAvatar from "./PetAvatar";
import PetCarousel from "./PetCarousel";
import { creatureEntries, loadSocialSnapshot, type GardenCard } from "@/lib/cloud/social";
import { PET_KINDS } from "@/lib/social/domain";

export default function PetShelf({ celebrate, onCelebrationClose }: { celebrate: boolean; onCelebrationClose: () => void }) {
  const { user } = useCloud();
  const [gardens, setGardens] = useState<GardenCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      setGardens((await loadSocialSnapshot()).pets);
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

  const entries = useMemo(() => creatureEntries(gardens), [gardens]);

  if (!user) return null;

  return (
    <>
      <section className="pet-shelf" aria-label="Tus mascotas">
        {loading ? <div className="pet-shelf-loading" aria-label="Cargando mascotas" /> : null}
        {!loading && error ? <p className="form-error">{error}</p> : null}
        {!loading && !error && entries.length === 0 ? (
          <div className="pet-empty glass-panel p-3">
            <div className="pet-empty-row">
              {PET_KINDS.map((kind) => <PetAvatar key={kind} kind={kind} stage="origen" mood="dormida" size="tiny" />)}
            </div>
            <Link href="/friends" className="glass-button glass-button-primary px-4 py-2 text-xs">Añadir amigo</Link>
          </div>
        ) : null}
        {entries.length > 0 ? <PetCarousel entries={entries} /> : null}
      </section>

      {celebrate && !loading && entries.length > 0 ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="Tus mascotas después de meditar">
          <div className="absolute inset-0 celebration-backdrop" />
          <section className="relative celebration-panel glass-popover p-4 soft-reveal">
            <div className="glass-chip inline-flex">Meditación completada</div>
            <div className="mt-3"><PetCarousel entries={entries} label="Tus mascotas después de meditar" /></div>
            <button type="button" onClick={onCelebrationClose} className="glass-button glass-button-primary w-full mt-4 py-3">Volver al jardín</button>
          </section>
        </div>
      ) : null}
    </>
  );
}
