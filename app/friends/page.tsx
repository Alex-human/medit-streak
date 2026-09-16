"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import AuthScreen from "@/components/AuthScreen";
import { useCloud } from "@/components/CloudProvider";
import PetAvatar from "@/components/PetAvatar";
import TimeBackground from "@/components/TimeBackground";
import {
  createSharedPet,
  loadSocialSnapshot,
  removeFriendship,
  requestFriend,
  respondToFriendship,
  updateMyProfile,
  type FriendConnection,
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
  const [petNames, setPetNames] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
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
      setSnapshot(await loadSocialSnapshot());
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
          <header className="glass-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="glass-button glass-button-muted px-3 py-2 text-sm">← Jardín</Link>
              <button type="button" onClick={() => void cloud.signOut()} className="text-xs muted underline underline-offset-4">Cerrar sesión</button>
            </div>
            <h1 className="glass-title text-3xl font-semibold mt-4">Amigos</h1>
            <p className="text-sm muted mt-1">Cada amistad puede cuidar una criatura compartida.</p>
          </header>

          {notice ? <div className="success-panel px-4 py-3 text-sm">{notice}</div> : null}
          {error ? <div className="error-panel px-4 py-3 text-sm">{error}</div> : null}

          <section className="glass-panel p-4">
            <div className="text-xs muted">Tu identidad</div>
            <form onSubmit={(event) => void saveProfile(event)} className="mt-3 grid gap-3">
              <label className="text-xs muted">
                Nombre visible
                <input className="glass-input w-full mt-1.5" value={displayName} maxLength={40} onChange={(event) => setDisplayName(event.target.value)} />
              </label>
              <label className="text-xs muted">
                Alias para encontrarte
                <div className="relative mt-1.5"><span className="input-prefix">@</span><input className="glass-input w-full pl-8" value={handle} minLength={3} maxLength={24} pattern="[a-z0-9_]+" onChange={(event) => setHandle(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))} /></div>
              </label>
              <button disabled={workingId === "profile"} className="glass-button glass-button-muted py-2.5 text-sm">{workingId === "profile" ? "Guardando..." : "Guardar perfil"}</button>
            </form>
          </section>

          <section className="glass-panel p-4">
            <div className="text-xs muted">Añadir a alguien</div>
            <h2 className="glass-title text-lg font-semibold mt-1">Buscar por alias</h2>
            <form onSubmit={(event) => void submitFriend(event)} className="flex gap-2 mt-3">
              <div className="relative flex-1"><span className="input-prefix">@</span><input className="glass-input w-full pl-8" placeholder="alias" value={friendHandle} onChange={(event) => setFriendHandle(event.target.value)} /></div>
              <button disabled={!friendHandle.trim() || workingId === "new-friend"} className="glass-button glass-button-primary px-4">{workingId === "new-friend" ? "..." : "Enviar"}</button>
            </form>
          </section>

          {snapshot.incoming.length > 0 ? (
            <section className="glass-panel p-4">
              <div className="text-xs muted">Solicitudes</div>
              <div className="mt-3 space-y-2">
                {snapshot.incoming.map((connection) => (
                  <div key={connection.friendship.id} className="friend-row">
                    <div className="friend-avatar">{initials(connection.friend.display_name)}</div>
                    <div className="min-w-0 flex-1"><p className="font-semibold truncate">{connection.friend.display_name}</p><p className="text-xs muted">@{connection.friend.handle}</p></div>
                    <button onClick={() => void run(connection.friendship.id, () => respondToFriendship(connection.friendship.id, true), "Ya sois amigos.")} className="glass-button glass-button-primary px-3 py-2 text-xs">Aceptar</button>
                    <button aria-label="Rechazar solicitud" onClick={() => void run(connection.friendship.id, () => respondToFriendship(connection.friendship.id, false), "Solicitud rechazada.")} className="glass-button glass-button-muted px-3 py-2 text-xs">×</button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="glass-panel p-4">
            <div className="flex items-end justify-between"><div><div className="text-xs muted">Tu círculo</div><h2 className="glass-title text-lg font-semibold mt-1">{snapshot.friends.length} {snapshot.friends.length === 1 ? "amistad" : "amistades"}</h2></div>{loading ? <span className="text-xs muted">Actualizando...</span> : null}</div>
            {!loading && snapshot.friends.length === 0 ? <p className="text-sm muted mt-3">Todavía no hay amistades aceptadas. Envía tu alias o busca el de otra persona.</p> : null}
            <div className="mt-3 space-y-3">
              {snapshot.friends.map((connection) => (
                <FriendCard
                  key={connection.friendship.id}
                  connection={connection}
                  petName={petNames[connection.friendship.id] ?? ""}
                  onPetName={(value) => setPetNames((current) => ({ ...current, [connection.friendship.id]: value }))}
                  working={workingId === connection.friendship.id}
                  onCreate={() => void run(connection.friendship.id, () => createSharedPet(connection.friendship.id, petNames[connection.friendship.id] ?? ""), "La criatura ha nacido.")}
                  onRemove={() => {
                    if (!window.confirm(`¿Eliminar tu amistad con ${connection.friend.display_name}? También se eliminará vuestra mascota compartida.`)) return;
                    void run(connection.friendship.id, () => removeFriendship(connection.friendship.id), "Amistad eliminada.");
                  }}
                />
              ))}
            </div>
          </section>

          {snapshot.outgoing.length > 0 ? (
            <section className="glass-panel-soft p-4"><div className="text-xs muted">Pendientes</div>{snapshot.outgoing.map((connection) => <p key={connection.friendship.id} className="text-sm mt-2">Esperando a <strong>{connection.friend.display_name}</strong> · @{connection.friend.handle}</p>)}</section>
          ) : null}
        </div>
      </main>
    </>
  );
}

function FriendCard({ connection, petName, onPetName, working, onCreate, onRemove }: { connection: FriendConnection; petName: string; onPetName: (value: string) => void; working: boolean; onCreate: () => void; onRemove: () => void }) {
  return (
    <article className="friend-card">
      <div className="flex items-center gap-3">
        <div className="friend-avatar">{initials(connection.friend.display_name)}</div>
        <div className="min-w-0 flex-1"><p className="font-semibold truncate">{connection.friend.display_name}</p><p className="text-xs muted">@{connection.friend.handle}</p></div>
        <button type="button" onClick={onRemove} className="text-[11px] muted underline underline-offset-4">Eliminar</button>
      </div>
      {connection.activePet ? (
        <div className="friend-pet mt-3">
          <PetAvatar seed={connection.activePet.id} stage="semilla" mood="dormida" size="small" />
          <div><p className="text-sm font-semibold">{connection.activePet.name}</p><p className="text-[11px] muted">Vuestra criatura compartida</p></div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <input className="glass-input flex-1 min-w-0" maxLength={24} placeholder="Nombre de la mascota" value={petName} onChange={(event) => onPetName(event.target.value)} />
          <button type="button" disabled={working || !petName.trim()} onClick={onCreate} className="glass-button glass-button-primary px-3 text-xs">{working ? "Naciendo..." : "Criar"}</button>
        </div>
      )}
      {connection.pastPets.length > 0 ? <p className="text-[10px] muted mt-2">{connection.pastPets.length} {connection.pastPets.length === 1 ? "criatura en vuestro recuerdo" : "criaturas en vuestro recuerdo"}</p> : null}
    </article>
  );
}
