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

  useEffect(() => {
    if (!running) setSecondsLeft(minutes * 60);
  }, [minutes, running]);

  useEffect(() => {
    if (!running) return;
    if (secondsLeft <= 0) return;

    const id = setInterval(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearInterval(id);
  }, [running, secondsLeft]);

  useEffect(() => {
    if (running && secondsLeft === 0) {
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
    }
  }, [running, secondsLeft, onFinish]);

  const gongRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // se crea una vez en cliente
    gongRef.current = new Audio("/sounds/gong.mp3");
    gongRef.current.preload = "auto";
  }, []);

  const label = useMemo(() => formatSeconds(secondsLeft), [secondsLeft]);

  return (
    <div className="rounded-2xl p-4 bg-white/80 shadow-sm border border-neutral-200">
      <div className="flex items-center justify-center mb-3">
        <div className={running ? "anim-floaty text-5xl select-none" : "text-5xl select-none"}>
          🧘‍♂️
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="font-semibold">Cronómetro</div>
        <div className="text-3xl font-bold tabular-nums">{label}</div>
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              if (!running) {
                setMinutes(p);
                onMinutesChange?.(p);
              }
            }}
            className={[
              "px-3 py-2 rounded-xl border text-sm font-semibold",
              "transition active:scale-[0.98]",
              minutes === p
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white border-neutral-200 hover:bg-neutral-50",
              running ? "opacity-50 cursor-not-allowed" : "",
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
            onMinutesChange?.(next);
          }}
          className="w-24 px-3 py-2 rounded-xl border border-neutral-200 text-sm font-semibold bg-white"
          title="Minutos personalizados"
        />
      </div>

      <div className="flex gap-2 mt-4">
        {!running ? (
          <button
            onClick={() => setRunning(true)}
            className="flex-1 rounded-xl px-4 py-3 bg-neutral-900 text-white font-semibold transition active:scale-[0.99]"
          >
            Empezar
          </button>
        ) : (
          <button
            onClick={() => setRunning(false)}
            className="flex-1 rounded-xl px-4 py-3 bg-white border border-neutral-200 font-semibold hover:bg-neutral-50 transition active:scale-[0.99]"
          >
            Pausar
          </button>
        )}

        <button
          onClick={() => {
            setRunning(false);
            setSecondsLeft(minutes * 60);
          }}
          className="rounded-xl px-4 py-3 bg-white border border-neutral-200 font-semibold hover:bg-neutral-50 transition active:scale-[0.99]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
