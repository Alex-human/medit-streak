"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PRESETS = [5, 10, 15, 20];

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function TimerCard({
  onFinish,
  onMinutesChange,
}: {
  onFinish?: () => void;
  onMinutesChange?: (minutes: number) => void;
}) {
  const [minutes, setMinutes] = useState<number>(10);
  const [secondsLeft, setSecondsLeft] = useState<number>(minutes * 60);
  const [running, setRunning] = useState(false);

  const endAtRef = useRef<number | null>(null);
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

  const completeFinish = useCallback(() => {
    if (finishCalledRef.current) return;
    finishCalledRef.current = true;
    onFinish?.();
  }, [onFinish]);

  const ensureAudioContextAndBuffer = useCallback(async () => {
    // Reutiliza promesa si ya está cargando
    if (loadingBufferRef.current) return loadingBufferRef.current;

    loadingBufferRef.current = (async () => {
      // 1) AudioContext
      if (!audioCtxRef.current) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
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

  const handleFinish = useCallback(async () => {
    finishCalledRef.current = false;
    await playGong();
    completeFinish();
  }, [playGong, completeFinish]);

  useEffect(() => {
    if (!running) return;

    const tick = () => {
      const endAt = endAtRef.current;
      if (!endAt) return;

      const next = getRemainingSeconds(endAt);
      setSecondsLeft(next);

      if (next === 0) {
        setRunning(false);
        endAtRef.current = null;
        void handleFinish();
      }
    };

    const id = window.setInterval(tick, 250);
    window.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    window.addEventListener("pageshow", tick);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
      window.removeEventListener("pageshow", tick);
    };
  }, [running, getRemainingSeconds, handleFinish]);

  const label = useMemo(() => formatSeconds(secondsLeft), [secondsLeft]);

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
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              if (running) return;
              setMinutes(p);
              setSecondsLeft(p * 60);
              onMinutesChange?.(p);
            }}
            className={[
              "glass-button text-sm",
              minutes === p ? "glass-button-primary" : "glass-button-muted",
              running ? "opacity-45 cursor-not-allowed" : "",
            ].join(" ")}
            disabled={running}
          >
            {p} min
          </button>
        ))}

        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={180}
          value={minutes}
          disabled={running}
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

      <div className="flex gap-2 mt-5">
        {!running ? (
          <button
            onClick={() => {
              // Clave: prepara WebAudio en el gesto del usuario
              void ensureAudioContextAndBuffer();

              const durationSeconds =
                secondsLeft > 0 ? secondsLeft : minutes * 60;
              setSecondsLeft(durationSeconds);
              endAtRef.current = Date.now() + durationSeconds * 1000;
              setRunning(true);
            }}
            className="glass-button glass-button-primary flex-1 py-3"
          >
            Empezar
          </button>
        ) : (
          <button
            onClick={() => {
              if (endAtRef.current) {
                setSecondsLeft(getRemainingSeconds(endAtRef.current));
              }
              endAtRef.current = null;
              setRunning(false);
            }}
            className="glass-button glass-button-muted flex-1 py-3"
          >
            Pausar
          </button>
        )}

        <button
          onClick={() => {
            setRunning(false);
            endAtRef.current = null;
            setSecondsLeft(minutes * 60);
          }}
          className="glass-button glass-button-muted py-3"
        >
          Reset
        </button>
      </div>
    </div>
  );
}