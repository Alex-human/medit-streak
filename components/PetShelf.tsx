"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useCloud } from "./CloudProvider";
import ChoicePanel from "./ChoicePanel";
import PetAvatar from "./PetAvatar";
import PetCreatureCard from "./PetCreatureCard";
import { loadSocialSnapshot, type PetCard } from "@/lib/cloud/social";
import { equippedItems } from "@/lib/social/catalog";
import { markRevealed, splitReveal } from "@/lib/social/reveal";

export default function PetShelf({ celebrate, onCelebrationClose }: { celebrate: boolean; onCelebrationClose: () => void }) {
  const { user } = useCloud();
  const [cards, setCards] = useState<PetCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      setCards((await loadSocialSnapshot()).pets);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar vuestra mascota.");
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

  // La celebración llega tras guardar una sesión: vuelve a cargar para enseñar el vínculo ya sumado.
  useEffect(() => {
    if (celebrate) void refresh();
  }, [celebrate, refresh]);

  if (!user) return null;
  // Las tarjetas solo existen tras cargar en el cliente, así que leer el estreno local aquí no afecta a la hidratación.
  const reveals = cards.map(splitReveal);

  function closeCelebration() {
    cards.forEach(markRevealed);
    onCelebrationClose();
  }

  return (
    <>
      <section className="pet-shelf grid gap-3" aria-label="Vuestra mascota">
        {loading ? <div className="pet-shelf-loading" aria-label="Cargando mascota" /> : null}
        {!loading && error ? <p className="form-error">{error}</p> : null}
        {!loading && !error && cards.length === 0 ? (
          <div className="pet-empty glass-panel p-3">
            <PetAvatar kind={null} stage="bebe" mood="dormida" eggPhase={0} size="small" name="Huevo" />
            <Link href="/friends" className="glass-button glass-button-primary px-4 py-2 text-xs">Añadir amigo</Link>
          </div>
        ) : null}
        {cards.map((card, index) => (
          <div key={card.pet.id} className="grid gap-2">
            <PetCreatureCard card={card} items={reveals[index].shown} hiddenCount={reveals[index].fresh.length} />
            <ChoicePanel card={card} onChanged={refresh} />
          </div>
        ))}
      </section>

      {celebrate && !loading && cards.length > 0 ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="Vuestra mascota después de meditar">
          <div className="absolute inset-0 celebration-backdrop" />
          <section className="relative celebration-panel glass-popover p-4 soft-reveal grid gap-3">
            <div className="glass-chip inline-flex justify-self-start">Meditación completada</div>
            {cards.map((card, index) => (
              <div key={card.pet.id} className="grid gap-2">
                <PetCreatureCard card={card} items={equippedItems(card.pet.outfit, card.owned)} />
                {reveals[index].fresh.length > 0 ? (
                  <p className="text-sm text-center"><strong>Estreno:</strong> {reveals[index].fresh.map((item) => item.label).join(", ")}</p>
                ) : null}
              </div>
            ))}
            <button type="button" onClick={closeCelebration} className="glass-button glass-button-primary w-full py-3">Volver al jardín</button>
          </section>
        </div>
      ) : null}
    </>
  );
}
