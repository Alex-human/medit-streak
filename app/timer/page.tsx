"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import TimerCard from "@/components/TimerCard";
import TimeBackground from "@/components/TimeBackground";
import { toDayString } from "@/lib/dates";
import { upsertDay } from "@/lib/storage/sessions";
import { useState } from "react";

export default function TimerPage() {
  const router = useRouter();
  const [selectedMinutes, setSelectedMinutes] = useState(10);

  function onFinish() {
    const today = toDayString(new Date());
    upsertDay({
      day: today,
      minutes: selectedMinutes,
      completed: true,
      updatedAt: Date.now(),
    });
    router.push("/");
  }

  return (
    <>
      <TimeBackground />
      <main className="app-shell">
        <div className="app-frame soft-reveal">
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="glass-button glass-button-muted">
                <span className="ui-icon" aria-hidden="true">
                  ←
                </span>{" "}
                Volver
              </Link>
              <div className="glass-chip">Sesión</div>
            </div>

            <div className="glass-title text-3xl font-semibold mt-4">Cronómetro</div>
            <div className="text-sm muted mt-1">Silencio guiado por tiempo real, incluso en segundo plano.</div>
          </div>

          <TimerCard onFinish={onFinish} onMinutesChange={(m) => setSelectedMinutes(m)} />

          <div className="glass-panel p-4 text-sm muted">
            Al terminar, se marcará “hoy” como meditado y volverás al inicio.
          </div>
        </div>
      </main>
    </>
  );
}
