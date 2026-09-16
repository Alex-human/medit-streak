"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
};

const CloudContext = createContext<CloudContextValue | null>(null);

function migrationKey(userId: string) {
  return `medit_streak_cloud_migrated_v1:${userId}`;
}

export default function CloudProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(cloudConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshProfileFor = useCallback(async (nextUser: User | null) => {
    const client = getCloudClient();
    if (!client || !nextUser) {
      setProfile(null);
      return;
    }
    const { data, error: profileError } = await client
      .from("profiles")
      .select("user_id, handle, display_name")
      .eq("user_id", nextUser.id)
      .single();
    if (profileError) throw profileError;
    setProfile(data as SocialProfile);
  }, []);

  const hydrate = useCallback(async (nextUser: User | null) => {
    setUser(nextUser);
    setError(null);
    if (!nextUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      await refreshProfileFor(nextUser);
      const key = migrationKey(nextUser.id);
      if (localStorage.getItem(key) !== "done") {
        await importLocalDays(await getLocalDays());
        localStorage.setItem(key, "done");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo iniciar la sincronización.");
    } finally {
      setLoading(false);
    }
  }, [refreshProfileFor]);

  useEffect(() => {
    const client = getCloudClient();
    if (!client) {
      setLoading(false);
      return;
    }

    let active = true;
    void client.auth.getSession().then(({ data }) => {
      if (active) void hydrate(data.session?.user ?? null);
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
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
      refreshProfile: async () => refreshProfileFor(user),
    }),
    [error, loading, profile, refreshProfileFor, user],
  );

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}

export function useCloud() {
  const value = useContext(CloudContext);
  if (!value) throw new Error("useCloud debe usarse dentro de CloudProvider.");
  return value;
}
