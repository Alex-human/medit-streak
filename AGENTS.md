<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Despliegue

- La web se sirve como estática en Cloudflare: https://medit-streak.autoreply-panel.workers.dev (Worker `medit-streak`, configuración en `wrangler.jsonc`). Todo cambio de la web: commit a `main`, push a `origin` (`Alex-human/medit-streak`) y `npm run deploy` (exportación estática + `wrangler deploy` con la sesión local de Cloudflare); después comprobar que la URL responde con el cambio. El push no despliega solo.
- La app debe seguir siendo exportable como estática (`npm run build:native`): sin rutas API, middleware ni acciones de servidor, porque el hosting no ejecuta servidor.
- Vercel quedó retirado: el 23-11-2026 pausó toda la cuenta Hobby por la CPU de otro proyecto. `vercel.json` solo redirige la URL antigua `medit-streak.vercel.app` a la nueva. El login de Google exige que la URL de la web esté en Supabase → Authentication → URL Configuration → Redirect URLs (acceso por Vercel → Storage → `medit-streak-social` → Open in Supabase).
- La app iOS (Capacitor, `ios/`) está en pausa por decisión de Alex: no ejecutar `ios:sync`, no tocar `ios/` ni preparar TestFlight salvo que lo pida.
- Incluir en el commit solo los archivos del cambio; dejar fuera lo ajeno (por ejemplo `ios/` o `active/`).
