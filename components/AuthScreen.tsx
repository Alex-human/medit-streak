"use client";

import { useState } from "react";
import TimeBackground from "./TimeBackground";
import { useCloud } from "./CloudProvider";

export default function AuthScreen() {
  const { signInWithGoogle, error: syncError } = useCloud();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setWorking(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo abrir Google.");
      setWorking(false);
    }
  }

  return (
    <>
      <TimeBackground />
      <main className="app-shell min-h-[100dvh] flex items-center">
        <div className="app-frame w-full soft-reveal">
          <section className="glass-panel auth-panel p-5">
            <div className="auth-creature" aria-hidden="true">
              <span className="auth-creature-eye" />
              <span className="auth-creature-eye" />
            </div>
            <div className="glass-chip w-fit">Tu jardín compartido</div>
            <h1 className="glass-title text-3xl font-semibold mt-4">Medit Streak</h1>
            <p className="muted text-sm leading-6 mt-2">
              Medita, cuida tus rachas y haz crecer una criatura distinta con cada amistad.
            </p>

            <button
              type="button"
              onClick={() => void signIn()}
              disabled={working}
              className="glass-button glass-button-primary w-full mt-6 py-3.5 flex items-center justify-center gap-3"
            >
              <span className="google-mark" aria-hidden="true">G</span>
              {working ? "Abriendo Google..." : "Continuar con Google"}
            </button>
            {error || syncError ? <p className="form-error mt-3">{error ?? syncError}</p> : null}
            <p className="text-[11px] muted text-center mt-4">
              Tu historial de este dispositivo se importará una sola vez al entrar.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
