"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCloud } from "@/components/CloudProvider";
import PetCarousel from "@/components/PetCarousel";
import TimeBackground from "@/components/TimeBackground";
import { creatureEntries, loadSocialSnapshot, type CreatureEntry, type GardenCard } from "@/lib/cloud/social";
import { PET_KINDS } from "@/lib/social/domain";

const PREVIEW_ENTRIES: CreatureEntry[] = PET_KINDS.map((kind) => ({
  state: { kind, alive: true, bornDay: "", diedDay: null, bondDays: 0, stage: "origen", mood: "dormida" },
}));

export default function PetsPage() {
  const cloud = useCloud();
  const [gardens, setGardens] = useState<GardenCard[]>([]);
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

  const visible = useMemo(
    () => (friendshipId ? gardens.filter((garden) => garden.pet.friendship_id === friendshipId) : gardens),
    [gardens, friendshipId],
  );
  const real = useMemo(() => creatureEntries(visible), [visible]);
  const entries = real.length > 0 ? real : PREVIEW_ENTRIES;
  const friendName = visible[0]?.friend.display_name;

  if (cloud.loading) {
    return <><TimeBackground /><main className="app-shell"><div className="app-frame"><div className="glass-panel p-5 muted">Despertando a la pandilla...</div></div></main></>;
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
              {friendName ? `Tus mascotas con ${friendName}` : "Tus mascotas"}
            </h1>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <PetCarousel entries={entries} size="large" label="Vuestras criaturas" />

          {!loading && real.length === 0 ? (
            <Link href="/friends" className="glass-button glass-button-primary block w-full text-center py-2.5">Añadir amigo</Link>
          ) : null}
        </div>
      </main>
    </>
  );
}
