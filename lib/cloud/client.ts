import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const cloudConfigured = Boolean(url && publishableKey);

let browserClient: SupabaseClient | null = null;

/**
 * Cuando la sesión no se puede cargar en ese instante, supabase-js manda la clave pública como credencial
 * y la base responde «sin filas» en vez de un error. Aquí todos los datos exigen sesión, así que esa
 * petición se corta con un 401: quien llama falla y reintenta en lugar de creer que no hay nada guardado.
 */
const sessionOnlyFetch: typeof fetch = (input, init) => {
  const { pathname } = new URL(input instanceof Request ? input.url : String(input));
  const anonymous = new Headers(init?.headers).get("Authorization") === `Bearer ${publishableKey}`;
  if (anonymous && pathname.startsWith("/rest/v1/")) {
    return Promise.resolve(
      new Response(JSON.stringify({ code: "session_unavailable", message: "La sesión no está disponible en este momento." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
  return fetch(input, init);
};

export function getCloudClient() {
  if (!cloudConfigured || !url || !publishableKey) return null;
  if (!browserClient) {
    browserClient = createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: { fetch: sessionOnlyFetch },
    });
  }
  return browserClient;
}

export async function getSignedInUserId() {
  const client = getCloudClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.user.id ?? null;
}
