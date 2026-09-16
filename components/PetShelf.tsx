"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useCloud } from "./CloudProvider";
import PetAvatar from "./PetAvatar";
import { loadSocialSnapshot, type PetCardData } from "@/lib/cloud/social";

function moodCopy(card: PetCardData) {
  const friendName = card.friend.display_name;
  const meDone = card.life.ownersDoneToday.includes(card.currentUserId);
  if (card.life.mood === "feliz") return `Hoy la habéis cuidado los dos.`;
  if (card.life.mood === "esperando") return meDone ? `Esperando a ${friendName}.` : `${friendName} ya ha meditado. Te espera.`;
  if (card.life.mood === "recuperable") return "Recupérala hoy con 30 min.";
  if (card.life.mood === "peligro") return card.life.rescueDaysLeft === 0 ? "Último día: sálvala con 60 min." : `${card.life.rescueDaysLeft} días para salvarla con 60 min.`;
  if (card.life.mood === "fallecida") return "Su historia queda con vosotros.";
  return "Aún está descansando hoy.";
}

function PetCard({ card, celebration = false }: { card: PetCardData; celebration?: boolean }) {
  return (
    <article className={celebration ? "celebration-pet" : "pet-card"}>
      <PetAvatar
        seed={card.pet.id}
        stage={card.life.stage}
        mood={card.life.mood}
        size={celebration ? "large" : "normal"}
      />
      <div className={celebration ? "text-center" : "min-w-0 flex-1"}>
        <div className="flex items-center gap-2 justify-between">
          <h3 className="glass-title font-semibold truncate">{card.pet.name}</h3>
          <span className="pet-stage-label">{card.life.stage}</span>
        </div>
        <p className="text-[11px] muted mt-0.5 truncate">con {card.friend.display_name}</p>
        <p className="text-xs mt-2 leading-5">{moodCopy(card)}</p>
        <div className="pet-bond mt-2"><span style={{ width: `${Math.min(100, (card.life.bondDays / 21) * 100)}%` }} /></div>
        <p className="text-[10px] muted mt-1">{card.life.bondDays} días de vínculo</p>
      </div>
    </article>
  );
}

export default function PetShelf({ celebrate, onCelebrationClose }: { celebrate: boolean; onCelebrationClose: () => void }) {
  const { user } = useCloud();
  const [pets, setPets] = useState<PetCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      setPets((await loadSocialSnapshot()).pets.filter((card) => card.life.mood !== "fallecida"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar tus mascotas.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
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
          <Link href="/friends" className="glass-button glass-button-muted px-3 py-2 text-xs">
            Amigos
          </Link>
        </div>

        {loading ? <div className="pet-shelf-loading mt-3" aria-label="Cargando mascotas" /> : null}
        {!loading && error ? <p className="form-error mt-3">{error}</p> : null}
        {!loading && !error && pets.length === 0 ? (
          <div className="pet-empty mt-3">
            <PetAvatar seed="first-pet" stage="semilla" mood="dormida" size="small" />
            <div>
              <p className="text-sm font-semibold">Tu primera criatura está por nacer.</p>
              <Link href="/friends" className="text-xs underline underline-offset-4 mt-1 inline-block">Añade a un amigo</Link>
            </div>
          </div>
        ) : null}
        {pets.length > 0 ? <div className="pet-row mt-3">{pets.map((card) => <PetCard key={card.pet.id} card={card} />)}</div> : null}
      </section>

      {celebrate && !loading && pets.length > 0 ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-label="Tus mascotas después de meditar">
          <div className="absolute inset-0 celebration-backdrop" />
          <section className="relative celebration-panel glass-popover p-5 soft-reveal">
            <div className="text-center">
              <div className="glass-chip inline-flex">Meditación completada</div>
              <h2 className="glass-title text-2xl font-semibold mt-3">Tu calma ha llegado hasta ellas</h2>
            </div>
            <div className="celebration-row mt-4">{pets.map((card) => <PetCard key={card.pet.id} card={card} celebration />)}</div>
            <button type="button" onClick={onCelebrationClose} className="glass-button glass-button-primary w-full mt-5 py-3">Volver al jardín</button>
          </section>
        </div>
      ) : null}
    </>
  );
}
