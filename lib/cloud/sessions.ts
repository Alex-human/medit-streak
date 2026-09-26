import { getCloudClient, getSignedInUserId } from "./client";
import type { DayRecord, MeditationSession } from "@/lib/storage/sessions";
import { recoveredDays } from "@/lib/streak";

type CloudSessionRow = {
  client_id: string;
  day: string;
  minutes: number;
  source: "timer" | "manual" | "import";
  finished_at: string;
  updated_at: string;
};

function rowsToDays(rows: CloudSessionRow[]): DayRecord[] {
  const byDay = rows.reduce<Record<string, CloudSessionRow[]>>((days, row) => {
    (days[row.day] ??= []).push(row);
    return days;
  }, {});

  const records = Object.entries(byDay)
    .map(([day, dayRows]) => {
      const sessions: MeditationSession[] = dayRows
        .map((row) => ({
          id: row.client_id,
          minutes: row.minutes,
          createdAt: new Date(row.finished_at).getTime(),
          version: "0:cloud",
        }))
        .sort((left, right) => left.createdAt - right.createdAt);
      return {
        day,
        minutes: sessions.reduce((total, session) => total + session.minutes, 0),
        completed: sessions.length > 0,
        updatedAt: Math.max(...dayRows.map((row) => new Date(row.updated_at).getTime())),
        sessions,
        tombstones: {},
      };
    })
    .sort((left, right) => left.day.localeCompare(right.day));

  const timerTotals = rows.reduce<Record<string, number>>((totals, row) => {
    if (row.source === "timer") totals[row.day] = (totals[row.day] ?? 0) + row.minutes;
    return totals;
  }, {});
  const recovered = recoveredDays(records.map((record) => record.day), timerTotals).map((day) => ({
    day,
    minutes: 0,
    completed: true,
    updatedAt: new Date(`${day}T23:59:59Z`).getTime(),
    sessions: [],
    tombstones: {},
  }));

  return [...records, ...recovered].sort((left, right) => left.day.localeCompare(right.day));
}

async function currentUser() {
  const userId = await getSignedInUserId();
  if (!userId) throw new Error("Inicia sesión para sincronizar tus meditaciones.");
  return userId;
}

export async function getCloudDays() {
  const client = getCloudClient();
  if (!client) return [];
  const userId = await currentUser();
  const { data, error } = await client
    .from("meditation_sessions")
    .select("client_id, day, minutes, source, finished_at, updated_at")
    .eq("user_id", userId)
    .order("day", { ascending: true });
  if (error) throw error;
  return rowsToDays((data ?? []) as CloudSessionRow[]);
}

export async function addCloudSession(
  day: string,
  minutes: number,
  finishedAt: number,
  clientId: string,
  source: CloudSessionRow["source"],
) {
  const client = getCloudClient();
  if (!client) throw new Error("Supabase no está configurado.");
  const userId = await currentUser();
  const { error } = await client.from("meditation_sessions").upsert(
    {
      user_id: userId,
      client_id: clientId,
      day,
      minutes: Math.max(1, Math.round(minutes)),
      source,
      finished_at: new Date(finishedAt).toISOString(),
    },
    { onConflict: "user_id,client_id", ignoreDuplicates: true },
  );
  if (error) throw error;
  return (await getCloudDays()).find((record) => record.day === day) ?? null;
}

export async function updateCloudSession(day: string, clientId: string, minutes: number) {
  const client = getCloudClient();
  if (!client) throw new Error("Supabase no está configurado.");
  const userId = await currentUser();
  const { error } = await client
    .from("meditation_sessions")
    .update({ minutes: Math.max(1, Math.round(minutes)) })
    .eq("user_id", userId)
    .eq("client_id", clientId);
  if (error) throw error;
  return (await getCloudDays()).find((record) => record.day === day) ?? null;
}

export async function deleteCloudSession(day: string, clientId: string) {
  const client = getCloudClient();
  if (!client) throw new Error("Supabase no está configurado.");
  const userId = await currentUser();
  const { error } = await client
    .from("meditation_sessions")
    .delete()
    .eq("user_id", userId)
    .eq("client_id", clientId);
  if (error) throw error;
  return (await getCloudDays()).find((record) => record.day === day) ?? null;
}

export async function importLocalDays(records: DayRecord[], userId: string) {
  const client = getCloudClient();
  if (!client) return;
  const rows = records.flatMap((record) =>
    record.sessions
    .filter((session) => !session.id.endsWith(`-recovery-${record.day}`))
    .map((session) => ({
      user_id: userId,
      client_id: session.id,
      day: record.day,
      minutes: session.minutes,
      source: "import" as const,
      finished_at: new Date(session.createdAt).toISOString(),
    })),
  );
  if (rows.length === 0) return;
  const { error } = await client
    .from("meditation_sessions")
    .upsert(rows, { onConflict: "user_id,client_id", ignoreDuplicates: true });
  if (error) throw error;
}
