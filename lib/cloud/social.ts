import { getCloudClient, getSignedInUserId } from "./client";
import { toDayString } from "@/lib/dates";
import { computePetLife, type PetLife, type SocialSession } from "@/lib/social/domain";
import {
  catalogItem,
  dueChoices,
  identityOf,
  ownedItems,
  type CatalogItem,
  type ChoicePayload,
  type ChoiceRow,
  type DueChoice,
  type Identity,
  type Outfit,
  type Slot,
} from "@/lib/social/catalog";
import type { SocialProfile } from "@/components/CloudProvider";

export type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
};

export type PetRow = {
  id: string;
  friendship_id: string;
  hatched_day: string;
  outfit: Outfit;
};

export type FriendConnection = {
  friendship: FriendshipRow;
  friend: SocialProfile;
  activePet: PetRow | null;
};

/** La mascota compartida con un amigo, con su vida calculada y las decisiones de la pareja. */
export type PetCard = {
  pet: PetRow;
  friend: SocialProfile;
  currentUserId: string;
  life: PetLife;
  identity: Identity | null;
  choices: ChoiceRow[];
  owned: CatalogItem[];
  due: DueChoice[];
};

export type SocialSnapshot = {
  incoming: FriendConnection[];
  outgoing: FriendConnection[];
  friends: FriendConnection[];
  pets: PetCard[];
};

function friendId(friendship: FriendshipRow, currentUserId: string) {
  return friendship.requester_id === currentUserId ? friendship.addressee_id : friendship.requester_id;
}

async function requireClient() {
  const client = getCloudClient();
  const userId = await getSignedInUserId();
  if (!client || !userId) throw new Error("Inicia sesión para ver a tus amigos.");
  return { client, userId };
}

export async function loadSocialSnapshot(): Promise<SocialSnapshot> {
  const { client, userId } = await requireClient();
  const { data: friendshipData, error: friendshipError } = await client
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .order("created_at", { ascending: true });
  if (friendshipError) throw friendshipError;

  const friendships = (friendshipData ?? []) as FriendshipRow[];
  if (friendships.length === 0) return { incoming: [], outgoing: [], friends: [], pets: [] };

  const profileIds = [...new Set(friendships.flatMap((row) => [row.requester_id, row.addressee_id]))];
  const accepted = friendships.filter((row) => row.status === "accepted");
  const acceptedIds = accepted.map((row) => row.id);
  const memberIds = [...new Set([userId, ...accepted.map((row) => friendId(row, userId))])];

  const [profilesResult, petsResult, sessionsResult] = await Promise.all([
    client.from("profiles").select("user_id, handle, display_name").in("user_id", profileIds),
    acceptedIds.length > 0
      ? client.from("pets").select("id, friendship_id, hatched_day, outfit").in("friendship_id", acceptedIds).is("died_on", null)
      : Promise.resolve({ data: [], error: null }),
    client.from("meditation_sessions").select("user_id, day, minutes, source").in("user_id", memberIds),
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (petsResult.error) throw petsResult.error;
  if (sessionsResult.error) throw sessionsResult.error;

  const pets = (petsResult.data ?? []) as PetRow[];
  const { data: choiceData, error: choiceError } = pets.length > 0
    ? await client.from("pet_choices").select("*").in("pet_id", pets.map((pet) => pet.id)).order("proposed_at", { ascending: true })
    : { data: [], error: null };
  if (choiceError) throw choiceError;
  const choices = (choiceData ?? []) as ChoiceRow[];

  const profiles = new Map(((profilesResult.data ?? []) as SocialProfile[]).map((profile) => [profile.user_id, profile]));
  const sessions = (sessionsResult.data ?? []).map((row) => ({
    userId: row.user_id as string,
    day: row.day as string,
    minutes: row.minutes as number,
    source: row.source as SocialSession["source"],
  }));
  const todayDay = toDayString(new Date());

  const connections = friendships.flatMap<FriendConnection>((friendship) => {
    const friend = profiles.get(friendId(friendship, userId));
    if (!friend) return [];
    return [{ friendship, friend, activePet: pets.find((pet) => pet.friendship_id === friendship.id) ?? null }];
  });

  const cards: PetCard[] = [];
  for (const connection of connections) {
    const pet = connection.activePet;
    if (!pet) continue;
    const petChoices = choices.filter((choice) => choice.pet_id === pet.id);
    const identity = identityOf(petChoices);
    const life = computePetLife({
      sessions,
      ownerIds: [userId, connection.friend.user_id],
      startDay: pet.hatched_day,
      identityDay: identity ? toDayString(new Date(identity.confirmedAt)) : null,
      todayDay,
    });
    cards.push({
      pet,
      friend: connection.friend,
      currentUserId: userId,
      life,
      identity: identity?.identity ?? null,
      choices: petChoices,
      owned: ownedItems(petChoices),
      due: dueChoices(life, petChoices),
    });
  }

  return {
    incoming: connections.filter((item) => item.friendship.status === "pending" && item.friendship.addressee_id === userId),
    outgoing: connections.filter((item) => item.friendship.status === "pending" && item.friendship.requester_id === userId),
    friends: connections.filter((item) => item.friendship.status === "accepted"),
    pets: cards,
  };
}

/**
 * Propone (o contrapropone) la decisión de un hito: una fila por mascota, vida e hito.
 * Una decisión ya confirmada no se puede pisar: la propuesta solo sustituye a otra abierta.
 */
export async function proposeChoice(petId: string, life: number, milestoneDay: number, payload: ChoicePayload, current: ChoiceRow | null) {
  const { client, userId } = await requireClient();
  const proposal = { payload, proposed_by: userId, proposed_at: new Date().toISOString(), confirmed_by: null, confirmed_at: null };
  if (current) {
    const { data, error } = await client.from("pet_choices").update(proposal).eq("id", current.id).is("confirmed_at", null).select("id");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Esa decisión ya se cerró. Vuelve a mirarla.");
    return;
  }
  const { error } = await client.from("pet_choices").insert({ pet_id: petId, life, milestone_day: milestoneDay, ...proposal });
  if (error) throw error.code === "23505" ? new Error("Ya hay una propuesta para este hito. Vuelve a mirarla.") : error;
}

/**
 * Confirma la propuesta del otro tal y como la vio (misma proposed_at) y, si es una pieza,
 * la deja puesta en su hueco a partir de lo que la base devuelve, no de la fila en pantalla.
 */
export async function confirmChoice(card: PetCard, row: ChoiceRow) {
  const { client, userId } = await requireClient();
  const { data, error } = await client
    .from("pet_choices")
    .update({ confirmed_by: userId, confirmed_at: new Date().toISOString() })
    .eq("id", row.id)
    .eq("proposed_at", row.proposed_at)
    .is("confirmed_at", null)
    .select("payload");
  if (error) throw error;
  const payload = data?.[0]?.payload as ChoicePayload | undefined;
  if (!payload) throw new Error("Esa propuesta ya cambió. Vuelve a mirarla.");

  const item = "item" in payload && payload.item ? catalogItem(payload.item) : null;
  if (item) await wearItem(card.pet.id, item.slot, item.id);
}

/** Pone una pieza en su hueco (null lo vacía) sobre el atuendo actual de la base, no sobre el que vio la pantalla. */
export async function wearItem(petId: string, slot: Slot, itemId: string | null) {
  const { client } = await requireClient();
  const { data, error } = await client.from("pets").select("outfit").eq("id", petId).single();
  if (error) throw error;
  const outfit: Outfit = { ...(data.outfit as Outfit) };
  if (itemId === null) delete outfit[slot];
  else outfit[slot] = itemId;
  const { error: writeError } = await client.from("pets").update({ outfit }).eq("id", petId);
  if (writeError) throw writeError;
}

export async function requestFriend(handle: string) {
  const { client } = await requireClient();
  const { error } = await client.rpc("request_friendship_by_handle", { target_handle: handle.trim().replace(/^@/, "") });
  if (error) throw error;
}

export async function respondToFriendship(friendshipId: string, accept: boolean) {
  const { client } = await requireClient();
  const { error } = await client.rpc("respond_to_friendship", {
    target_friendship_id: friendshipId,
    accept_request: accept,
  });
  if (error) throw error;
}

export async function removeFriendship(friendshipId: string) {
  const { client } = await requireClient();
  const { error } = await client.rpc("remove_friendship", { target_friendship_id: friendshipId });
  if (error) throw error;
}

/**
 * Pone el huevo de una amistad si todavía no existe. Los dos amigos pueden llamarla a la
 * vez: el índice único deja vivo uno solo, y la carrera perdida se ignora.
 */
export async function ensureSharedPet(friendshipId: string) {
  const { client } = await requireClient();
  const { error } = await client.rpc("create_shared_pet", { target_friendship_id: friendshipId, target_pet_name: "Huevo" });
  if (error && !error.message.includes("mascota viva")) throw error;
}

export async function updateMyProfile(handle: string, displayName: string) {
  const { client, userId } = await requireClient();
  const normalizedHandle = handle.trim().toLowerCase().replace(/^@/, "").replace(/[^a-z0-9_]/g, "_");
  const { error } = await client
    .from("profiles")
    .update({ handle: normalizedHandle, display_name: displayName.trim() || "Meditador" })
    .eq("user_id", userId);
  if (error) throw error;
}
