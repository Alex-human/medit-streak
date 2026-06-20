"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TimerCard from "@/components/TimerCard";
import TimeBackground from "@/components/TimeBackground";
import { toDayString } from "@/lib/dates";
import { getStreakRecovery, STREAK_RECOVERY_MINUTES } from "@/lib/streak";
import { addSession, getAllDays } from "@/lib/storage/sessions";

export default function TimerPage() {
  const router = useRouter();
  const [recoveryAvailable, setRecoveryAvailable] = useState(false);

  useEffect(() => {
    let active = true;

    const syncRecovery = async () => {
      const records = await getAllDays();
      if (!active) return;
      setRecoveryAvailable(getStreakRecovery(records, toDayString(new Date())).available);
    };

    void syncRecovery();
    window.addEventListener("focus", syncRecovery);

    return () => {
      active = false;
      window.removeEventListener("focus", syncRecovery);
    };
  }, []);

  async function onFinish({
    minutes,
    finishedAt,
    sessionId,
  }: {
    minutes: number;
    finishedAt: number;
    sessionId: string;
  }) {
    const day = toDayString(new Date(finishedAt));
    const records = await getAllDays();
    const recovery = getStreakRecovery(records, day);
    const shouldRecoverStreak = recovery.available && minutes >= STREAK_RECOVERY_MINUTES;

    await addSession(day, minutes, finishedAt, sessionId);

    if (shouldRecoverStreak) {
      await addSession(
        recovery.missedDay,
        STREAK_RECOVERY_MINUTES,
        finishedAt,
        `${sessionId}-recovery-${recovery.missedDay}`,
      );
    }

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

          {recoveryAvailable ? (
            <div className="recovery-panel p-4">
              <div className="text-xs muted">Racha recuperable</div>
              <div className="glass-title text-lg font-semibold mt-1">
                Completa 30 min para recuperar ayer.
              </div>
            </div>
          ) : null}

          <TimerCard
            initialMinutes={recoveryAvailable ? STREAK_RECOVERY_MINUTES : 10}
            highlightedMinutes={recoveryAvailable ? STREAK_RECOVERY_MINUTES : undefined}
            onFinish={onFinish}
          />

          <div className="glass-panel p-4 text-sm muted">
            {recoveryAvailable
              ? "Al terminar 30 min, se marcarán hoy y ayer."
              : "Al terminar, se marcará “hoy” como meditado y volverás al inicio."}
          </div>
        </div>
      </main>
    </>
  );
}
