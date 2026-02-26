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

  const getRemainingSeconds = useCallback((endAt: number) => {
    return Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  }, []);

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

        const gong = gongRef.current;
        if (gong) {
          try {
            gong.currentTime = 0;
            void gong.play();
          } catch {
            // No-op when autoplay policies block sound.
          }
        }

        onFinish?.();
      }
    };

    const id = setInterval(tick, 250);
    window.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    window.addEventListener("pageshow", tick);

    return () => {
      clearInterval(id);
      window.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
      window.removeEventListener("pageshow", tick);
    };
  }, [running, getRemainingSeconds, onFinish]);

  const label = useMemo(() => formatSeconds(secondsLeft), [secondsLeft]);

  return (
    <div className="glass-panel p-4">
      <audio ref={gongRef} src="/sounds/gong.mp3" preload="auto" />

      <div className="flex items-center justify-center mb-4">
        <div className={running ? "anim-floaty text-6xl select-none ui-icon" : "text-6xl select-none ui-icon"}>🧘‍♂️</div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm muted">Cronómetro</div>
        <div className="glass-title text-4xl font-semibold tabular-nums">{label}</div>
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
          className="glass-input w-24 text-sm font-semibold"
          title="Minutos personalizados"
        />
      </div>

      <div className="flex gap-2 mt-5">
        {!running ? (
          <button
            onClick={() => {
              const durationSeconds = secondsLeft > 0 ? secondsLeft : minutes * 60;
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
