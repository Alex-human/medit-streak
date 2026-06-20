"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearActiveTimer,
  getActiveTimer,
  markActiveTimerCompleted,
  startActiveTimer,
  type ActiveTimerSession,
} from "@/lib/timerSession";

const PRESETS = [5, 10, 15, 30];

function normalizeMinutes(value: number) {
  return Number.isFinite(value) ? Math.max(1, Math.round(value)) : 10;
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function TimerCard({
  initialMinutes = 10,
  highlightedMinutes,
  onFinish,
  onMinutesChange,
}: {
  initialMinutes?: number;
  highlightedMinutes?: number;
  onFinish?: (payload: { minutes: number; finishedAt: number; sessionId: string }) => Promise<void> | void;
  onMinutesChange?: (minutes: number) => void;
}) {
  const normalizedInitialMinutes = normalizeMinutes(initialMinutes);
  const [minutes, setMinutes] = useState<number>(normalizedInitialMinutes);
  const [secondsLeft, setSecondsLeft] = useState<number>(minutes * 60);
  const [running, setRunning] = useState(false);
  const [finishStatus, setFinishStatus] = useState<"idle" | "saving" | "error">("idle");

  const endAtRef = useRef<number | null>(null);
  const activeTimerRef = useRef<ActiveTimerSession | null>(null);
  const finishCalledRef = useRef(false);

  // Fallback HTMLAudio (por si WebAudio falla por cualquier motivo)
  const gongRef = useRef<HTMLAudioElement | null>(null);

  // WebAudio (robusto en iOS/PWA si se "resume" en el gesto)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gongBufferRef = useRef<AudioBuffer | null>(null);
  const loadingBufferRef = useRef<Promise<void> | null>(null);

  const getRemainingSeconds = useCallback((endAt: number) => {
    return Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  }, []);

  const ensureAudioContextAndBuffer = useCallback(async () => {
    // Reutiliza promesa si ya está cargando
    if (loadingBufferRef.current) return loadingBufferRef.current;

    loadingBufferRef.current = (async () => {
      // 1) AudioContext
      if (!audioCtxRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new Ctx();
      }

      const ctx = audioCtxRef.current;

      // 2) Resume en gesto del usuario (clave en iOS)
      if (ctx.state !== "running") {
        try {
          await ctx.resume();
        } catch {
          // si falla, seguimos; quizá el fallback HTMLAudio funcione
        }
      }

      // 3) Cargar y decodificar mp3 si no está ya
      if (!gongBufferRef.current) {
        const res = await fetch("/sounds/gong.mp3", { cache: "no-store" });
        if (!res.ok) throw new Error("No se pudo cargar gong.mp3");
        const arr = await res.arrayBuffer();
        gongBufferRef.current = await ctx.decodeAudioData(arr);
      }
    })();

    try {
      await loadingBufferRef.current;
    } finally {
      // deja la promesa guardada para no recargar cada vez
    }

    return loadingBufferRef.current;
  }, []);

  const playGong = useCallback(async () => {
    // Intenta WebAudio primero
    try {
      await ensureAudioContextAndBuffer();
      const ctx = audioCtxRef.current;
      const buf = gongBufferRef.current;

      if (ctx && buf && ctx.state === "running") {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);

        await new Promise<void>((resolve) => {
          src.onended = () => resolve();
          src.start(0);
        });

        return;
      }
    } catch {
      // cae a fallback
    }

    // Fallback HTMLAudio
    const gong = gongRef.current;
    if (!gong) return;

    try {
      gong.currentTime = 0;
      const p = gong.play();
      if (p && typeof (p as Promise<void>).then === "function") {
        await p;
      }
      // Espera a ended si reproduce
      await new Promise<void>((resolve) => {
        const onEnded = () => {
          gong.removeEventListener("ended", onEnded);
          resolve();
        };
        gong.addEventListener("ended", onEnded);
      });
    } catch {
      // si ni así, simplemente no bloqueamos el finish
    }
  }, [ensureAudioContextAndBuffer]);

  useEffect(() => {
    if (running || finishStatus !== "idle" || activeTimerRef.current) return;

    setMinutes(normalizedInitialMinutes);
    setSecondsLeft(normalizedInitialMinutes * 60);
    onMinutesChange?.(normalizedInitialMinutes);
  }, [finishStatus, normalizedInitialMinutes, onMinutesChange, running]);

  const restoreFromActiveTimer = useCallback(() => {
    const active = getActiveTimer();
    activeTimerRef.current = active;

    if (!active) return null;

    setMinutes(active.minutes);
    onMinutesChange?.(active.minutes);

    const effectiveEnd = active.completedAt ?? active.endAt;
    const next = getRemainingSeconds(effectiveEnd);
    setSecondsLeft(next);

    if (active.completedAt || effectiveEnd <= Date.now()) {
      setFinishStatus(active.completedAt ? "error" : "idle");
      setRunning(false);
      endAtRef.current = null;
      return {
        timer: active,
        finishedAt: active.completedAt ?? active.endAt,
      };
    }

    endAtRef.current = active.endAt;
    finishCalledRef.current = false;
    setFinishStatus("idle");
    setRunning(true);
    return null;
  }, [getRemainingSeconds, onMinutesChange]);

  const handleFinish = useCallback(async (timer: ActiveTimerSession, finishedAt = Date.now()) => {
    if (finishCalledRef.current) return;
    finishCalledRef.current = true;

    const settledAt = Math.max(finishedAt, timer.endAt);
    setSecondsLeft(0);
    setRunning(false);
    setFinishStatus("saving");
    endAtRef.current = null;

    markActiveTimerCompleted(timer.id, settledAt);
    void playGong();

    try {
      await onFinish?.({
        minutes: timer.minutes,
        finishedAt: settledAt,
        sessionId: timer.id,
      });
      if (clearActiveTimer(timer.id)) {
        activeTimerRef.current = null;
        setFinishStatus("idle");
      } else {
        finishCalledRef.current = false;
        setFinishStatus("error");
      }
    } catch {
      finishCalledRef.current = false;
      setFinishStatus("error");
    }
  }, [onFinish, playGong]);

  useEffect(() => {
    const pending = restoreFromActiveTimer();
    if (pending) {
      void handleFinish(pending.timer, pending.finishedAt);
    }

    const sync = () => {
      const nextPending = restoreFromActiveTimer();
      if (nextPending) {
        void handleFinish(nextPending.timer, nextPending.finishedAt);
      }
    };

    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);

    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", sync);
    };
  }, [handleFinish, restoreFromActiveTimer]);

  useEffect(() => {
    if (!running) return;

    const tick = () => {
      const active = activeTimerRef.current;
      const endAt = active?.endAt ?? endAtRef.current;
      if (!active || !endAt) return;

      const next = getRemainingSeconds(endAt);
      setSecondsLeft(next);

      if (next === 0) {
        setRunning(false);
        endAtRef.current = null;
        void handleFinish(active, endAt);
      }
    };

    const id = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    window.addEventListener("pageshow", tick);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
      window.removeEventListener("pageshow", tick);
    };
  }, [running, getRemainingSeconds, handleFinish]);

  const label = useMemo(() => formatSeconds(secondsLeft), [secondsLeft]);
  const completionPending = finishStatus !== "idle" || Boolean(activeTimerRef.current?.completedAt);

  return (
    <div className="glass-panel p-4">
      <audio ref={gongRef} src="/sounds/gong.mp3" preload="auto" />

      <div className="flex items-center justify-center mb-4">
        <div
          className={
            running
              ? "anim-floaty text-6xl select-none ui-icon"
              : "text-6xl select-none ui-icon"
          }
        >
          🧘‍♂️
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm muted">Cronómetro</div>
        <div className="glass-title text-4xl font-semibold tabular-nums">
          {label}
        </div>
      </div>

      <div className="flex gap-2 mt-4 flex-wrap">
        {PRESETS.map((p) => {
          const isRecoveryTarget = highlightedMinutes === p;

          return (
            <button
              key={p}
              onClick={() => {
                if (running || completionPending) return;
                setMinutes(p);
                setSecondsLeft(p * 60);
                onMinutesChange?.(p);
              }}
              className={[
                "glass-button text-sm",
                minutes === p ? "glass-button-primary" : "glass-button-muted",
                isRecoveryTarget ? "glass-button-recovery" : "",
                running || completionPending ? "opacity-45 cursor-not-allowed" : "",
              ].join(" ")}
              disabled={running || completionPending}
              title={isRecoveryTarget ? "Recuperar racha con 30 min" : undefined}
            >
              {p} min
            </button>
          );
        })}

        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={180}
          value={minutes}
          disabled={running || completionPending}
          onChange={(e) => {
            const next = Math.max(1, Number(e.target.value));
            setMinutes(next);
            setSecondsLeft(next * 60);
            onMinutesChange?.(next);
          }}
          className="glass-input w-24 text-base font-semibold"
          title="Minutos personalizados"
        />
      </div>

      {finishStatus === "saving" ? (
        <div className="text-sm muted mt-4">Guardando tu sesión para que no se pierda.</div>
      ) : null}

      {finishStatus === "error" ? (
        <div className="text-sm text-red-700 mt-4">
          No se pudo guardar la sesión todavía. No se perderá: pulsa “Reintentar guardado”.
        </div>
      ) : null}

      <div className="flex gap-2 mt-5">
        {!running ? (
          finishStatus === "saving" ? (
            <button
              className="glass-button glass-button-primary flex-1 py-3 opacity-45 cursor-not-allowed"
              disabled
            >
              Guardando...
            </button>
          ) : finishStatus === "error" ? (
            <button
              onClick={() => {
                const active = activeTimerRef.current;
                if (!active) return;
                void handleFinish(active, active.completedAt ?? active.endAt);
              }}
              className="glass-button glass-button-primary flex-1 py-3"
            >
              Reintentar guardado
            </button>
          ) : (
            <button
              onClick={() => {
                if (completionPending) return;

                // Clave: prepara WebAudio en el gesto del usuario
                void ensureAudioContextAndBuffer();

                const durationSeconds =
                  secondsLeft > 0 ? secondsLeft : minutes * 60;
                const active = startActiveTimer(minutes, durationSeconds);
                activeTimerRef.current = active;
                finishCalledRef.current = false;
                setFinishStatus("idle");
                setSecondsLeft(durationSeconds);
                endAtRef.current = active.endAt;
                setRunning(true);
              }}
              className={[
                "glass-button glass-button-primary flex-1 py-3",
                completionPending ? "opacity-45 cursor-not-allowed" : "",
              ].join(" ")}
              disabled={completionPending}
            >
              Empezar
            </button>
          )
        ) : (
          <button
            onClick={() => {
              if (endAtRef.current) {
                setSecondsLeft(getRemainingSeconds(endAtRef.current));
              }
              clearActiveTimer(activeTimerRef.current?.id);
              activeTimerRef.current = null;
              endAtRef.current = null;
              finishCalledRef.current = false;
              setFinishStatus("idle");
              setRunning(false);
            }}
            className="glass-button glass-button-muted flex-1 py-3"
          >
            Pausar
          </button>
        )}

        <button
          onClick={() => {
            if (completionPending) return;
            clearActiveTimer(activeTimerRef.current?.id);
            activeTimerRef.current = null;
            finishCalledRef.current = false;
            setFinishStatus("idle");
            setRunning(false);
            endAtRef.current = null;
            setSecondsLeft(minutes * 60);
          }}
          className={[
            "glass-button glass-button-muted py-3",
            completionPending ? "opacity-45 cursor-not-allowed" : "",
          ].join(" ")}
          disabled={completionPending}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
