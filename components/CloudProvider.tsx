"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { cloudConfigured, getCloudClient } from "@/lib/cloud/client";
import { importLocalDays } from "@/lib/cloud/sessions";
import { getAllDays as getLocalDays } from "@/lib/storage/sessions";

export type SocialProfile = {
  user_id: string;
  handle: string;
  display_name: string;
};

type CloudContextValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: SocialProfile | null;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  retrySync: () => Promise<void>;
};

const CloudContext = createContext<CloudContextValue | null>(null);

function migrationKey(userId: string) {
  return `medit_streak_cloud_migrated_v1:${userId}`;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function syncErrorMessage(cause: unknown) {
  const message = cause instanceof Error
    ? cause.message
    : typeof cause === "object" && cause !== null && "message" in cause && typeof cause.message === "string"
      ? cause.message
      : null;

  return message
    ? `No se pudo iniciar la sincronización. ${message}`
    : "No se pudo iniciar la sincronización.";
}

export default function CloudProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(cloudConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hydrateRunRef = useRef(0);

  const fetchProfileFor = useCallback(async (nextUser: User | null) => {
    const client = getCloudClient();
    if (!client || !nextUser) return null;
    const { data, error: profileError } = await client
      .from("profiles")
      .select("user_id, handle, display_name")
      .eq("user_id", nextUser.id)
      .single();
    if (profileError) throw profileError;
    return data as SocialProfile;
  }, []);

  const hydrate = useCallback(async (nextUser: User | null) => {
    const run = ++hydrateRunRef.current;
    setUser(nextUser);
    setError(null);
    if (!nextUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let lastCause: unknown = null;
    try {
      for (const retryDelay of [0, 250, 750]) {
        if (retryDelay > 0) await wait(retryDelay);
        if (run !== hydrateRunRef.current) return;

        try {
          const nextProfile = await fetchProfileFor(nextUser);
          if (run !== hydrateRunRef.current) return;

          const key = migrationKey(nextUser.id);
          if (localStorage.getItem(key) !== "done") {
            const localDays = await getLocalDays();
            if (run !== hydrateRunRef.current) return;
            await importLocalDays(localDays, nextUser.id);
            if (run !== hydrateRunRef.current) return;
            localStorage.setItem(key, "done");
          }
          if (run !== hydrateRunRef.current) return;
          setProfile(nextProfile);
          lastCause = null;
          break;
        } catch (cause) {
          lastCause = cause;
        }
      }

      if (lastCause) throw lastCause;
    } catch (cause) {
      if (run === hydrateRunRef.current) setError(syncErrorMessage(cause));
    } finally {
      if (run === hydrateRunRef.current) setLoading(false);
    }
  }, [fetchProfileFor]);

  useEffect(() => {
    const client = getCloudClient();
    if (!client) {
      return;
    }

    let active = true;
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      window.setTimeout(() => {
        if (active) void hydrate(session?.user ?? null);
      }, 0);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [hydrate]);

  const value = useMemo<CloudContextValue>(
    () => ({
      configured: cloudConfigured,
      loading,
      user,
      profile,
      error,
      signInWithGoogle: async () => {
        const client = getCloudClient();
        if (!client) throw new Error("Supabase no está configurado.");
        const { error: signInError } = await client.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
        if (signInError) throw signInError;
      },
      signOut: async () => {
        const client = getCloudClient();
        if (!client) return;
        const { error: signOutError } = await client.auth.signOut();
        if (signOutError) throw signOutError;
      },
      refreshProfile: async () => hydrate(user),
      retrySync: async () => hydrate(user),
    }),
    [error, hydrate, loading, profile, user],
  );

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}

export function useCloud() {
  const value = useContext(CloudContext);
  if (!value) throw new Error("useCloud debe usarse dentro de CloudProvider.");
  return value;
}
