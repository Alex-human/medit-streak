<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Despliegue

- Todo cambio de la web (Next.js) debe quedar publicado en Vercel (proyecto `medit-streak`): al terminar, commit a `main` y push a `origin` (`Alex-human/medit-streak`) para que Vercel despliegue, y comprobar que el despliegue termina bien.
- La app iOS (Capacitor, `ios/`) está en pausa por decisión de Alex: no ejecutar `ios:sync`, no tocar `ios/` ni preparar TestFlight salvo que lo pida.
- Incluir en el commit solo los archivos del cambio; dejar fuera lo ajeno (por ejemplo `ios/` o `active/`).
