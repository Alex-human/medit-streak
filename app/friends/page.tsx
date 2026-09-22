"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import AuthScreen from "@/components/AuthScreen";
import { useCloud } from "@/components/CloudProvider";
import PetAvatar from "@/components/PetAvatar";
import { splitReveal } from "@/lib/social/reveal";
import TimeBackground from "@/components/TimeBackground";
import {
  ensureSharedPet,
  loadSocialSnapshot,
  removeFriendship,
  requestFriend,
  respondToFriendship,
  updateMyProfile,
  type FriendConnection,
  type PetCard,
  type SocialSnapshot,
} from "@/lib/cloud/social";

const EMPTY: SocialSnapshot = { incoming: [], outgoing: [], friends: [], pets: [] };

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "M";
}

export default function FriendsPage() {
  const cloud = useCloud();
  const [snapshot, setSnapshot] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [friendHandle, setFriendHandle] = useState("");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const hatchedRef = useRef<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cloud.profile) return;
    const timer = window.setTimeout(() => {
      setHandle(cloud.profile?.handle ?? "");
      setDisplayName(cloud.profile?.display_name ?? "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [cloud.profile]);

  const refresh = useCallback(async () => {
    if (!cloud.user) return;
    setError(null);
    try {
      const next = await loadSocialSnapshot();
      setSnapshot(next);

      // Las mascotas nacen solas al aceptar la amistad: nadie tiene que bautizarlas.
      const pending = next.friends.filter(
        (connection) => !connection.activePet && !hatchedRef.current.has(connection.friendship.id),
      );
      if (pending.length > 0) {
        for (const connection of pending) hatchedRef.current.add(connection.friendship.id);
        await Promise.all(pending.map((connection) => ensureSharedPet(connection.friendship.id)));
        setSnapshot(await loadSocialSnapshot());
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar tus amistades.");
    } finally {
      setLoading(false);
    }
  }, [cloud.user]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function run(id: string, action: () => Promise<void>, success: string) {
    setWorkingId(id);
    setError(null);
    setNotice(null);
    try {
      await action();
      await refresh();
      setNotice(success);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo completar la acción.");
    } finally {
      setWorkingId(null);
    }
  }

  async function submitFriend(event: FormEvent) {
    event.preventDefault();
    const target = friendHandle.trim();
    if (!target) return;
    await run("new-friend", () => requestFriend(target), "Solicitud enviada.");
    setFriendHandle("");
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    await run("profile", async () => {
      await updateMyProfile(handle, displayName);
      await cloud.refreshProfile();
    }, "Perfil actualizado.");
  }

  if (cloud.loading) {
    return <><TimeBackground /><main className="app-shell"><div className="app-frame"><div className="glass-panel p-5 muted">Preparando tu jardín...</div></div></main></>;
  }
  if (cloud.configured && !cloud.user) return <AuthScreen />;
  if (!cloud.configured) {
    return <><TimeBackground /><main className="app-shell"><div className="app-frame"><div className="glass-panel p-5"><Link href="/" className="text-sm underline">← Volver</Link><h1 className="glass-title text-2xl font-semibold mt-4">Falta conectar la nube</h1><p className="muted text-sm mt-2">La interfaz está lista; configura Supabase para activar amigos y mascotas.</p></div></div></main></>;
  }

  return (
    <>
      <TimeBackground />
      <main className="app-shell">
        <div className="app-frame soft-reveal">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="glass-button glass-button-muted px-3 py-2 text-sm">← Jardín</Link>
            <h1 className="glass-title text-lg font-semibold">Amigos</h1>
          </div>

          {notice ? <div className="success-panel px-4 py-3 text-sm">{notice}</div> : null}
          {error ? <div className="error-panel px-4 py-3 text-sm">{error}</div> : null}

          <section className="glass-panel p-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs muted">Tu círculo</div>
                <h2 className="glass-title text-lg font-semibold mt-1">{snapshot.friends.length} {snapshot.friends.length === 1 ? "amistad" : "amistades"}</h2>
              </div>
              {loading ? <span className="text-xs muted">Actualizando...</span> : null}
            </div>
            {!loading && snapshot.friends.length === 0 ? <p className="text-sm muted mt-3">Todavía no hay amistades aceptadas. Busca a alguien por su alias.</p> : null}
            <div className="mt-3 space-y-3">
              {snapshot.friends.map((connection) => (
                <FriendCard
                  key={connection.friendship.id}
                  connection={connection}
                  card={snapshot.pets.find((card) => card.pet.id === connection.activePet?.id)}
                  onRemove={() => {
                    if (!window.confirm(`¿Eliminar tu amistad con ${connection.friend.display_name}? También se eliminará vuestra mascota.`)) return;
                    void run(connection.friendship.id, () => removeFriendship(connection.friendship.id), "Amistad eliminada.");
                  }}
                />
              ))}
            </div>
          </section>

          {snapshot.incoming.length > 0 ? (
            <section className="glass-panel p-4">
              <div className="text-xs muted">Solicitudes</div>
              <div className="mt-3 space-y-2">
                {snapshot.incoming.map((connection) => (
                  <div key={connection.friendship.id} className="friend-row">
                    <div className="friend-avatar">{initials(connection.friend.display_name)}</div>
                    <div className="min-w-0 flex-1"><p className="font-semibold truncate">{connection.friend.display_name}</p><p className="text-xs muted truncate">@{connection.friend.handle}</p></div>
                    <button onClick={() => void run(connection.friendship.id, () => respondToFriendship(connection.friendship.id, true), "Ya sois amigos.")} className="glass-button glass-button-primary px-3 py-2 text-xs">Aceptar</button>
                    <button aria-label="Rechazar solicitud" onClick={() => void run(connection.friendship.id, () => respondToFriendship(connection.friendship.id, false), "Solicitud rechazada.")} className="glass-button glass-button-muted px-3 py-2 text-xs">×</button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="glass-panel p-4">
            <div className="text-xs muted">Buscar a alguien</div>
            <form onSubmit={(event) => void submitFriend(event)} className="flex gap-2 mt-3">
              <label className="glass-field flex-1 min-w-0">
                <span aria-hidden="true">@</span>
                <input className="glass-field-input" placeholder="alias" aria-label="Alias de tu amigo" value={friendHandle} onChange={(event) => setFriendHandle(event.target.value)} />
              </label>
              <button disabled={!friendHandle.trim() || workingId === "new-friend"} className="glass-button glass-button-primary px-4">{workingId === "new-friend" ? "..." : "Enviar"}</button>
            </form>
          </section>

          {snapshot.outgoing.length > 0 ? (
            <section className="glass-panel-soft p-4"><div className="text-xs muted">Pendientes</div>{snapshot.outgoing.map((connection) => <p key={connection.friendship.id} className="text-sm mt-2">Esperando a <strong>{connection.friend.display_name}</strong> · @{connection.friend.handle}</p>)}</section>
          ) : null}

          <details className="glass-panel disclosure">
            <summary>
              <span>Tu identidad</span>
              <span className="disclosure-mark" aria-hidden="true">▾</span>
            </summary>
            <form onSubmit={(event) => void saveProfile(event)} className="grid gap-3 px-4 pb-4">
              <label className="text-xs muted">
                Nombre visible
                <input className="glass-input w-full mt-1.5" value={displayName} maxLength={40} onChange={(event) => setDisplayName(event.target.value)} />
              </label>
              <label className="text-xs muted">
                Alias para encontrarte
                <span className="glass-field mt-1.5">
                  <span aria-hidden="true">@</span>
                  <input className="glass-field-input" value={handle} minLength={3} maxLength={24} pattern="[a-z0-9_]+" aria-label="Tu alias" onChange={(event) => setHandle(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))} />
                </span>
              </label>
              <button disabled={workingId === "profile"} className="glass-button glass-button-muted py-2.5 text-sm">{workingId === "profile" ? "Guardando..." : "Guardar perfil"}</button>
            </form>
          </details>

          <button type="button" onClick={() => void cloud.signOut()} className="text-xs muted underline underline-offset-4 py-2">Cerrar sesión</button>
        </div>
      </main>
    </>
  );
}

function FriendCard({ connection, card, onRemove }: { connection: FriendConnection; card?: PetCard; onRemove: () => void }) {
  return (
    <article className="friend-card">
      <div className="flex items-center gap-3">
        <div className="friend-avatar">{initials(connection.friend.display_name)}</div>
        <div className="min-w-0 flex-1"><p className="font-semibold truncate">{connection.friend.display_name}</p><p className="text-xs muted truncate">@{connection.friend.handle}</p></div>
        <button type="button" onClick={onRemove} className="text-[11px] muted underline underline-offset-4">Eliminar</button>
      </div>

      <div className="friend-pet mt-3 flex items-center gap-3">
        <PetAvatar
          kind={card?.identity?.element ?? null}
          stage={card?.life.stage ?? "bebe"}
          mood={card?.life.mood ?? "dormida"}
          eggPhase={card ? card.life.eggPhase : 0}
          items={card ? splitReveal(card).shown : []}
          ancestral={card?.life.ancestral}
          name={card?.identity?.name ?? "Huevo"}
          size="small"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs muted">Vuestra mascota</p>
          <p className="font-semibold truncate">{card?.identity?.name ?? "Huevo"}</p>
        </div>
        <Link href={`/pets?con=${connection.friendship.id}`} className="glass-button glass-button-primary px-3 py-2 text-xs">
          Ver
        </Link>
      </div>
    </article>
  );
}
