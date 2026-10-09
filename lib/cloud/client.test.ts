import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "sb_publishable_test";
const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
const userJwt = [{ alg: "HS256", typ: "JWT" }, { sub: "alex", exp: Math.floor(Date.now() / 1000) + 3600 }, { firma: "de prueba" }].map(base64url).join(".");

/** La base tal y como responde con RLS: filas para un usuario, vacío y sin error para la clave pública. */
const backend = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const { pathname } = new URL(String(input));
  if (pathname === "/auth/v1/user") return Response.json({ id: "alex" });
  const anonymous = new Headers(init?.headers).get("Authorization") === `Bearer ${KEY}`;
  return Response.json(anonymous ? [] : [{ day: "2026-10-08" }]);
});

async function freshClient() {
  vi.resetModules();
  const { getCloudClient } = await import("./client");
  return getCloudClient()!;
}

describe("cloud client", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", KEY);
    vi.stubGlobal("fetch", backend);
    backend.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("fails a data request made without a user session instead of returning the empty anonymous result", async () => {
    const client = await freshClient();

    const { data, error } = await client.from("meditation_sessions").select("day");

    expect(data).toBeNull();
    expect(error?.code).toBe("session_unavailable");
    expect(backend).not.toHaveBeenCalled();
  });

  it("lets data requests through with the user's session", async () => {
    const client = await freshClient();
    await client.auth.setSession({ access_token: userJwt, refresh_token: "rt" });

    const { data, error } = await client.from("meditation_sessions").select("day");

    expect(error).toBeNull();
    expect(data).toEqual([{ day: "2026-10-08" }]);
  });
});
