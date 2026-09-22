"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ChoicePanel from "@/components/ChoicePanel";
import { useCloud } from "@/components/CloudProvider";
import ItemIcon from "@/components/ItemIcon";
import PetAvatar from "@/components/PetAvatar";
import PetCreatureCard, { petName } from "@/components/PetCreatureCard";
import TimeBackground from "@/components/TimeBackground";
import { loadSocialSnapshot, wearItem, type PetCard } from "@/lib/cloud/social";
import { PET_STAGES } from "@/lib/social/domain";
import { pendingOrders, SLOTS, wornOn, type Slot } from "@/lib/social/catalog";
import { splitReveal } from "@/lib/social/reveal";

export default function PetsPage() {
  const cloud = useCloud();
  const [cards, setCards] = useState<PetCard[]>([]);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFriendshipId(new URLSearchParams(window.location.search).get("con"));
  }, []);

  const refresh = useCallback(async () => {
    if (!cloud.user) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      setCards((await loadSocialSnapshot()).pets);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo abrir vuestra mascota.");
    } finally {
      setLoading(false);
    }
  }, [cloud.user]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const visible = friendshipId ? cards.filter((card) => card.pet.friendship_id === friendshipId) : cards;

  if (cloud.loading) {
    return <><TimeBackground /><main className="app-shell"><div className="app-frame"><div className="glass-panel p-5 muted">Despertando a vuestra mascota...</div></div></main></>;
  }

  return (
    <>
      <TimeBackground />
      <main className="app-shell">
        <div className="app-frame soft-reveal">
          <div className="flex items-center justify-between gap-3">
            <Link href={friendshipId ? "/friends" : "/"} className="glass-button glass-button-muted px-3 py-2 text-sm">
              {friendshipId ? "← Amigos" : "← Jardín"}
            </Link>
            <h1 className="glass-title text-lg font-semibold truncate">
              {visible[0] ? `${petName(visible[0])} con ${visible[0].friend.display_name}` : "Vuestra mascota"}
            </h1>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          {!loading && visible.length === 0 ? (
            <div className="glass-panel p-4 grid gap-3 justify-items-center">
              <PetAvatar kind={null} stage="bebe" mood="dormida" eggPhase={0} size="large" name="Huevo" />
              <p className="text-sm muted text-center">El huevo aparece al aceptar una amistad y nace con cinco días meditando los dos.</p>
              <Link href="/friends" className="glass-button glass-button-primary block w-full text-center py-2.5">Añadir amigo</Link>
            </div>
          ) : null}

          {visible.map((card) => <PetSheet key={card.pet.id} card={card} onChanged={refresh} />)}
        </div>
      </main>
    </>
  );
}

function PetSheet({ card, onChanged }: { card: PetCard; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reveal = splitReveal(card);
  const orders = pendingOrders(card.choices);

  async function wear(slot: Slot, itemId: string | null) {
    setBusy(true);
    setError(null);
    try {
      await wearItem(card.pet.id, slot, itemId);
      await onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cambiar el baúl.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PetCreatureCard card={card} items={reveal.shown} hiddenCount={reveal.fresh.length} size="large" />
      <ChoicePanel card={card} onChanged={onChanged} />

      {card.owned.length > 0 || orders.length > 0 ? (
        <section className="glass-panel p-3" aria-label="Baúl">
          <div className="text-xs muted">Baúl</div>
          {error ? <p className="form-error mt-2">{error}</p> : null}
          <div className="grid gap-3 mt-2">
            {SLOTS.map((slot) => {
              const items = card.owned.filter((item) => item.slot === slot);
              if (items.length === 0) return null;
              return (
                <div key={slot}>
                  <div className="text-[11px] muted">{slot[0].toUpperCase() + slot.slice(1)}</div>
                  <div className="pet-items-grid mt-1">
                    {items.map((item) => {
                      const worn = card.pet.outfit[slot] === item.id;
                      return (
                        <button key={item.id} type="button" disabled={busy} aria-pressed={worn} className={`pet-item-tile ${worn ? "is-active" : ""}`} onClick={() => void wear(slot, worn ? null : item.id)}>
                          <ItemIcon item={item} />
                          <span>{item.label}</span>
                          <small>{worn ? "Puesta" : "Guardada"}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {orders.map((order) => (
              <p key={order.id} className="text-xs muted">
                Pedido en camino: “{"order" in order.payload ? order.payload.order : ""}”
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {card.life.history.length > 0 ? <Album card={card} /> : null}
    </>
  );
}

/** Una miniatura por etapa alcanzada, vida a vida, con la última pieza de cada hueco que tenía ese día. */
function Album({ card }: { card: PetCard }) {
  return (
    <section className="glass-panel p-3" aria-label="Álbum">
      <div className="text-xs muted">Álbum</div>
      <div className="pet-album mt-2">
        {card.life.history.map((entry) => {
          const stage = PET_STAGES.find((item) => item.id === entry.stage);
          return (
            <div key={`${entry.life}-${entry.stage}`} className="pet-album-entry">
              <PetAvatar kind={card.identity?.element ?? null} stage={entry.stage} mood="feliz" items={wornOn(card.choices, entry.day)} size="small" name={petName(card)} />
              <div className="text-[11px] font-semibold">{stage?.label}</div>
              <div className="text-[10px] muted">{card.life.history.some((other) => other.life !== entry.life) ? `Vida ${entry.life} · ` : ""}{entry.day.slice(8, 10)}/{entry.day.slice(5, 7)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
