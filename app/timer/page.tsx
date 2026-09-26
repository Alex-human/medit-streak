"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TimerCard from "@/components/TimerCard";
import TimeBackground from "@/components/TimeBackground";
import AuthScreen from "@/components/AuthScreen";
import { useCloud } from "@/components/CloudProvider";
import { loadSocialSnapshot } from "@/lib/cloud/social";
import { toDayString } from "@/lib/dates";
import { getStreakRecovery } from "@/lib/streak";
import { getAllDays } from "@/lib/storage/repository";
import { saveCompletedTimer } from "@/lib/timerCompletion";

export default function TimerPage() {
  const router = useRouter();
  const cloud = useCloud();
  const [streakMinutes, setStreakMinutes] = useState(0);
  const [petMinutes, setPetMinutes] = useState(0);

  useEffect(() => {
    let active = true;

    const syncRecovery = async () => {
      const records = await getAllDays();
      if (!active) return;
      setStreakMinutes(getStreakRecovery(records, toDayString(new Date()))?.minutes ?? 0);
      if (cloud.user) {
        try {
          const snapshot = await loadSocialSnapshot();
          const mine = snapshot.pets.flatMap((card) => card.life.alerts).filter((alert) => alert.userId === cloud.user?.id);
          if (active) setPetMinutes(Math.max(0, ...mine.map((alert) => alert.minutes)));
        } catch {
          if (active) setPetMinutes(0);
        }
      }
    };

    void syncRecovery();
    window.addEventListener("focus", syncRecovery);

    return () => {
      active = false;
      window.removeEventListener("focus", syncRecovery);
    };
  }, [cloud.user]);

  async function onFinish({
    minutes,
    finishedAt,
    sessionId,
  }: {
    minutes: number;
    finishedAt: number;
    sessionId: string;
  }) {
    await saveCompletedTimer(
      {
        id: sessionId,
        minutes,
        startedAt: finishedAt - minutes * 60_000,
        endAt: finishedAt,
        completedAt: finishedAt,
      },
      finishedAt,
    );

    sessionStorage.setItem("medit_show_pet_celebration", "1");
    router.push("/");
  }

  if (cloud.loading) {
    return <><TimeBackground /><main className="app-shell"><div className="app-frame"><div className="glass-panel p-5 muted">Preparando el cronómetro...</div></div></main></>;
  }
  if (cloud.configured && !cloud.user) return <AuthScreen />;

  // La racha propia y la de la mascota usan la misma escalera: basta con cumplir la que más pide.
  const rescueMinutes = Math.max(streakMinutes, petMinutes);

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

          {rescueMinutes > 0 ? (
            <div className={petMinutes > 0 ? "danger-panel p-4" : "recovery-panel p-4"}>
              <div className="text-xs muted">{petMinutes > 0 ? "Vuestra mascota te necesita" : "Racha recuperable"}</div>
              <div className="glass-title text-lg font-semibold mt-1">Completa {rescueMinutes} min para recuperar la racha.</div>
            </div>
          ) : null}

          <TimerCard initialMinutes={rescueMinutes || 10} highlightedMinutes={rescueMinutes || undefined} onFinish={onFinish} />

          <div className="glass-panel p-4 text-sm muted">
            {rescueMinutes > 0
              ? streakMinutes > 0
                ? `Al terminar ${rescueMinutes} min se marcan hoy y los días que te faltaban.`
                : `Al terminar ${rescueMinutes} min vuestra mascota recupera tu día.`
              : "Al terminar, se marcará “hoy” como meditado y volverás al inicio."}
          </div>
        </div>
      </main>
    </>
  );
}
