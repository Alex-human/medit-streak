"use client";

import TimerCard from "@/components/TimerCard";
import { setMinutes, upsertDay } from "@/lib/storage/sessions";
import { toDayString } from "@/lib/dates";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TimerPage() {
  const router = useRouter();
  const [selectedMinutes, setSelectedMinutes] = useState(10);

  const [isNight, setIsNight] = useState(false);

    useEffect(() => {
      const h = new Date().getHours();
      setIsNight(h >= 20 || h < 7);
    }, []);


  function onFinish() {
    const today = toDayString(new Date());
    const now = Date.now();

    // guardamos minutos + completado=true en una sola escritura (sin toggles)
    setMinutes(today, selectedMinutes);
    upsertDay({
      day: today,
      minutes: selectedMinutes,
      completed: true,
      updatedAt: now,
    });

    router.push("/");
  }

  return (
    <main className={`min-h-screen p-4 ${isNight ? "bg-night" : "bg-day"}`}>
      <div className="max-w-md mx-auto space-y-4">
        <a href="/" className="text-sm underline text-neutral-700">
          ← Volver
        </a>

        <div className="text-2xl font-bold tracking-tight">Cronómetro</div>

        <TimerCard
          onFinish={onFinish}
          onMinutesChange={(m) => setSelectedMinutes(m)}
        />

        <div className="text-xs text-neutral-500">
          Al terminar, marca “hoy” como meditado y vuelve al inicio.
        </div>
      </div>
    </main>
  );
}
