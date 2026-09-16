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
import { getStreakRecovery, STREAK_RECOVERY_MINUTES } from "@/lib/streak";
import { PET_RESCUE_MINUTES } from "@/lib/social/domain";
import { getAllDays } from "@/lib/storage/repository";
import { saveCompletedTimer } from "@/lib/timerCompletion";

export default function TimerPage() {
  const router = useRouter();
  const cloud = useCloud();
  const [recoveryAvailable, setRecoveryAvailable] = useState(false);
  const [petRescueAvailable, setPetRescueAvailable] = useState(false);

  useEffect(() => {
    let active = true;

    const syncRecovery = async () => {
      const records = await getAllDays();
      if (!active) return;
      setRecoveryAvailable(getStreakRecovery(records, toDayString(new Date())).available);
      if (cloud.user) {
        try {
          const snapshot = await loadSocialSnapshot();
          if (active) setPetRescueAvailable(snapshot.pets.some((card) => card.life.mood === "peligro"));
        } catch {
          if (active) setPetRescueAvailable(false);
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

  const targetMinutes = petRescueAvailable ? PET_RESCUE_MINUTES : recoveryAvailable ? STREAK_RECOVERY_MINUTES : 10;

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

          {recoveryAvailable && !petRescueAvailable ? (
            <div className="recovery-panel p-4">
              <div className="text-xs muted">Racha recuperable</div>
              <div className="glass-title text-lg font-semibold mt-1">
                Completa 30 min para recuperar ayer.
              </div>
            </div>
          ) : null}

          {petRescueAvailable ? (
            <div className="danger-panel p-4">
              <div className="text-xs muted">Una mascota está en peligro</div>
              <div className="glass-title text-lg font-semibold mt-1">
                Completa 60 min para salvar tus mascotas.
              </div>
            </div>
          ) : null}

          <TimerCard
            initialMinutes={targetMinutes}
            highlightedMinutes={petRescueAvailable ? PET_RESCUE_MINUTES : recoveryAvailable ? STREAK_RECOVERY_MINUTES : undefined}
            onFinish={onFinish}
          />

          <div className="glass-panel p-4 text-sm muted">
            {petRescueAvailable
              ? "Una hora completada hoy protege todas tus mascotas que estén en peligro."
              : recoveryAvailable
                ? "Al terminar 30 min, se marcarán hoy y ayer."
              : "Al terminar, se marcará “hoy” como meditado y volverás al inicio."}
          </div>
        </div>
      </main>
    </>
  );
}
