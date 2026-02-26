"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  const [showCustomInput, setShowCustomInput] = useState(false);
  const gongRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);

          // sonar gong (si falla por restricciones del navegador, no rompe)
          const gong = gongRef.current;
          if (gong) {
            try {
              gong.currentTime = 0;
              void gong.play();
            } catch {}
          }

          onFinish?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [running, onFinish]);

  const label = useMemo(() => formatSeconds(secondsLeft), [secondsLeft]);

  return (
    <div className="glass-panel p-4">
      <audio ref={gongRef} src="/sounds/gong.mp3" preload="auto" />

      <div className="flex items-center justify-center mb-4">
        <div className={running ? "anim-floaty text-6xl select-none ui-icon" : "text-6xl select-none ui-icon"}>
          🧘‍♂️
        </div>
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
              if (!running) {
                setMinutes(p);
                setSecondsLeft(p * 60);
                setShowCustomInput(false);
                onMinutesChange?.(p);
              }
            }}
            className={[
              "glass-button text-sm",
              minutes === p && !showCustomInput ? "glass-button-primary" : "glass-button-muted",
              running ? "opacity-45 cursor-not-allowed" : "",
            ].join(" ")}
            disabled={running}
          >
            {p} min
          </button>
        ))}

        <button
          type="button"
          disabled={running}
          onClick={() => {
            if (running) return;
            setShowCustomInput((prev) => !prev);
          }}
          className={[
            "glass-button text-sm",
            showCustomInput ? "glass-button-primary" : "glass-button-muted",
            running ? "opacity-45 cursor-not-allowed" : "",
          ].join(" ")}
        >
          Custom
        </button>

        {showCustomInput && (
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
            className="glass-input w-28 text-base font-semibold"
            title="Minutos personalizados"
          />
        )}
      </div>

      <div className="flex gap-2 mt-5">
        {!running ? (
          <button
            onClick={() => {
              if (secondsLeft <= 0) setSecondsLeft(minutes * 60);
              setRunning(true);
            }}
            className="glass-button glass-button-primary flex-1 py-3"
          >
            Empezar
          </button>
        ) : (
          <button
            onClick={() => setRunning(false)}
            className="glass-button glass-button-muted flex-1 py-3"
          >
            Pausar
          </button>
        )}

        <button
          onClick={() => {
            setRunning(false);
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
