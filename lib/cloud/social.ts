import { getCloudClient, getSignedInUserId } from "./client";
import { toDayString } from "@/lib/dates";
import { computeGardenLife, type GardenLife, type PetState, type SocialSession } from "@/lib/social/domain";
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
  name: string;
  hatched_day: string;
  died_on: string | null;
};

export type FriendConnection = {
  friendship: FriendshipRow;
  friend: SocialProfile;
  activePet: PetRow | null;
  pastPets: PetRow[];
};

/** Una pandilla compartida con un amigo: sus cuatro criaturas viven dentro de `life.pets`. */
export type GardenCard = {
  pet: PetRow;
  friend: SocialProfile;
  life: GardenLife;
  currentUserId: string;
};

/** Una criatura suelta lista para pintar: su estado y, si existe, la pandilla a la que pertenece. */
export type CreatureEntry = { state: PetState; garden?: GardenCard };

export function creatureEntries(gardens: GardenCard[]): CreatureEntry[] {
  return gardens.flatMap((garden) => garden.life.pets.map((state) => ({ state, garden })));
}

export type SocialSnapshot = {
  incoming: FriendConnection[];
  outgoing: FriendConnection[];
  friends: FriendConnection[];
  pets: GardenCard[];
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
      ? client.from("pets").select("id, friendship_id, name, hatched_day, died_on").in("friendship_id", acceptedIds)
      : Promise.resolve({ data: [], error: null }),
    client.from("meditation_sessions").select("user_id, day, minutes, source").in("user_id", memberIds),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (petsResult.error) throw petsResult.error;
  if (sessionsResult.error) throw sessionsResult.error;

  const profiles = new Map(
    ((profilesResult.data ?? []) as SocialProfile[]).map((profile) => [profile.user_id, profile]),
  );
  const pets = (petsResult.data ?? []) as PetRow[];
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
    const friendshipPets = pets
      .filter((pet) => pet.friendship_id === friendship.id)
      .sort((left, right) => right.hatched_day.localeCompare(left.hatched_day));
    return [{
      friendship,
      friend,
      activePet: friendshipPets.find((pet) => pet.died_on === null) ?? null,
      pastPets: friendshipPets.filter((pet) => pet.died_on !== null),
    }];
  });

  const petCards: GardenCard[] = [];
  for (const connection of connections.filter((item) => item.friendship.status === "accepted" && item.activePet)) {
    const pet = connection.activePet!;
    const life = computeGardenLife({
      sessions,
      ownerIds: [userId, connection.friend.user_id],
      hatchedDay: pet.hatched_day,
      todayDay,
      seed: pet.id,
    });
    petCards.push({ pet, friend: connection.friend, life, currentUserId: userId });
  }

  return {
    incoming: connections.filter(
      (item) => item.friendship.status === "pending" && item.friendship.addressee_id === userId,
    ),
    outgoing: connections.filter(
      (item) => item.friendship.status === "pending" && item.friendship.requester_id === userId,
    ),
    friends: connections.filter((item) => item.friendship.status === "accepted"),
    pets: petCards,
  };
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

export async function createSharedPet(friendshipId: string, name: string) {
  const { client } = await requireClient();
  const { error } = await client.rpc("create_shared_pet", {
    target_friendship_id: friendshipId,
    target_pet_name: name.trim(),
  });
  if (error) throw error;
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
