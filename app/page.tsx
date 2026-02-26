"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarGrid from "@/components/CalendarGrid";
import StreakHeader from "@/components/StreakHeader";
import TimeBackground from "@/components/TimeBackground";
import { computeStreak } from "@/lib/streak";
import { getAllDays, type DayRecord } from "@/lib/storage/sessions";
import { useRouter } from "next/navigation";

function startOfMonthLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function HomePage() {
  const router = useRouter();
  const [monthDate, setMonthDate] = useState<Date>(() => startOfMonthLocal(new Date()));
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      setRecords(getAllDays());
      setHydrated(true);
    };

    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const streak = useMemo(() => computeStreak(records), [records]);

  const monthStats = useMemo(() => {
    const key = monthKey(monthDate);
    const inMonth = records.filter((r) => r.day.startsWith(key));
    const completed = inMonth.filter((r) => r.completed);

    const sessions = completed.length;
    const minutes = completed.reduce((acc, r) => acc + (r.minutes || 0), 0);
    const avg = sessions > 0 ? Math.round(minutes / sessions) : 0;

    return { sessions, minutes, avg };
  }, [records, monthDate]);

  function onDayClick() {
    setNotice("Para marcar un día, usa el cronómetro y termina la sesión.");
    window.setTimeout(() => setNotice(null), 2500);
  }

  return (
    <>
      <TimeBackground />
      <main className="app-shell">
        <div className="app-frame soft-reveal">
          <div className="glass-panel p-4">
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="glass-title text-3xl font-semibold">Medit Streak</div>
                <div className="text-sm muted mt-1">Respira, vuelve al presente, y suma continuidad.</div>
              </div>
              <div className="glass-chip">Offline</div>
            </div>
          </div>

          <StreakHeader streak={hydrated ? streak : 0} />

          <div className="glass-panel p-4">
            <div className="text-sm muted">Este mes</div>
            <div className="mt-2 grid grid-cols-3 gap-2.5">
              <div className="glass-panel-soft p-3">
                <div className="text-[11px] muted">Sesiones</div>
                <div className="text-2xl font-semibold tabular-nums">{hydrated ? monthStats.sessions : 0}</div>
              </div>
              <div className="glass-panel-soft p-3">
                <div className="text-[11px] muted">Minutos</div>
                <div className="text-2xl font-semibold tabular-nums">{hydrated ? monthStats.minutes : 0}</div>
              </div>
              <div className="glass-panel-soft p-3">
                <div className="text-[11px] muted">Media</div>
                <div className="text-2xl font-semibold tabular-nums">{hydrated ? monthStats.avg : 0}</div>
                <div className="text-[10px] muted">min/sesión</div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMonthDate((prev) => addMonths(prev, -1))}
              className="glass-button glass-button-muted"
              aria-label="Mes anterior"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setMonthDate(startOfMonthLocal(new Date()))}
              className="glass-button glass-button-primary flex-1"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setMonthDate((prev) => addMonths(prev, 1))}
              className="glass-button glass-button-muted"
              aria-label="Mes siguiente"
            >
              →
            </button>
          </div>

          {notice && (
            <div className="glass-panel p-4">
              <div className="font-semibold">No se puede marcar manualmente</div>
              <div className="text-sm muted mt-1">{notice}</div>
              <button
                type="button"
                onClick={() => router.push("/timer")}
                className="glass-button glass-button-primary mt-3"
              >
                Ir al cronómetro
              </button>
            </div>
          )}

          <CalendarGrid monthDate={monthDate} records={hydrated ? records : []} onDayClick={onDayClick} />

          <button
            type="button"
            onClick={() => router.push("/timer")}
            className="glass-button glass-button-primary block w-full text-center py-3"
          >
            Ir al cronómetro
          </button>

          <div className="text-xs muted text-center">Para marcar “hoy”, completa el cronómetro.</div>
        </div>
      </main>
    </>
  );
}
