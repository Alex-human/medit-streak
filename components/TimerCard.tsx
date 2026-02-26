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
  const gongRef = useRef<HTMLAudioElement | null>(null);
  const finishCalledRef = useRef(false);

  const getRemainingSeconds = useCallback((endAt: number) => {
    return Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  }, []);

  // iOS/PWA: "desbloquea" el audio en un gesto del usuario (click/tap).
  const unlockGong = useCallback(() => {
    const gong = gongRef.current;
    if (!gong) return;

    try {
      // Asegura que el elemento tiene el recurso listo
      gong.load();

      // Truco típico iOS: reproducir en mute dentro del gesto, pausar, y desmutear
      gong.muted = true;
      gong.currentTime = 0;

      const p = gong.play();
      if (p && typeof (p as Promise<void>).then === "function") {
        void (p as Promise<void>)
          .then(() => {
            gong.pause();
            gong.currentTime = 0;
            gong.muted = false;
          })
          .catch(() => {
            gong.muted = false;
          });
      } else {
        gong.pause();
        gong.currentTime = 0;
        gong.muted = false;
      }
    } catch {
      // no-op
    }
  }, []);

  const completeFinish = useCallback(() => {
    if (finishCalledRef.current) return;
    finishCalledRef.current = true;
    onFinish?.();
  }, [onFinish]);

  const playGongAndFinish = useCallback(() => {
    const gong = gongRef.current;
    if (!gong) {
      completeFinish();
      return;
    }

    finishCalledRef.current = false;

    try {
      gong.currentTime = 0;

      const onEnded = () => {
        gong.removeEventListener("ended", onEnded);
        completeFinish();
      };
      gong.addEventListener("ended", onEnded);

      const p = gong.play();
      if (p && typeof (p as Promise<void>).catch === "function") {
        void (p as Promise<void>).catch(() => {
          gong.removeEventListener("ended", onEnded);
          completeFinish();
        });
      }
    } catch {
      completeFinish();
    }
  }, [completeFinish]);

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
        playGongAndFinish();
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
  }, [running, getRemainingSeconds, playGongAndFinish]);

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
              // IMPORTANTE: desbloquea audio en el gesto del usuario (iOS/PWA)
              unlockGong();

              finishCalledRef.current = false;
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