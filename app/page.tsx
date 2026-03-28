"use client";

import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import CalendarGrid from "@/components/CalendarGrid";
import StreakHeader from "@/components/StreakHeader";
import TimeBackground from "@/components/TimeBackground";
import { computeStreak } from "@/lib/streak";
import { getAllDays, toggleComplete, type DayRecord } from "@/lib/storage/sessions";
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

function formatDayLabel(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, date));
}

export default function HomePage() {
  const router = useRouter();
  const [monthDate, setMonthDate] = useState<Date>(() => startOfMonthLocal(new Date()));
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [detailDay, setDetailDay] = useState<string | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number; at: number } | null>(null);
  const navigatingRef = useRef(false);

  function goToTimer() {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    router.push("/timer");
  }

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

  const defaultMinutes = useMemo(() => {
    const latestCompleted = [...records]
      .filter((record) => record.completed && record.minutes > 0)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];

    return latestCompleted?.minutes ?? 10;
  }, [records]);

  const detailStats = useMemo(() => {
    if (!detailDay) return null;

    const selectedRecord = records.find((record) => record.day === detailDay);
    const selectedMonth = detailDay.slice(0, 7);
    const monthCompleted = records.filter((record) => record.completed && record.day.startsWith(selectedMonth));
    const monthMinutes = monthCompleted.reduce((acc, record) => acc + (record.minutes || 0), 0);
    const monthAverage = monthCompleted.length > 0 ? Math.round(monthMinutes / monthCompleted.length) : 0;

    return {
      day: detailDay,
      label: formatDayLabel(detailDay),
      completed: selectedRecord?.completed ?? false,
      dayMinutes: selectedRecord?.completed ? selectedRecord.minutes : 0,
      monthAverage,
    };
  }, [detailDay, records]);

  function onDayClick(day: string) {
    toggleComplete(day, defaultMinutes);
    setRecords(getAllDays());
  }

  function onDayLongPress(day: string) {
    setDetailDay(day);
  }

  function onTouchStart(e: TouchEvent<HTMLElement>) {
    const target = e.target as HTMLElement | null;
    if (target?.closest("button, a, input, textarea, select")) return;
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    swipeStartRef.current = {
      x: t.clientX,
      y: t.clientY,
      at: Date.now(),
    };
  }

  function onTouchEnd(e: TouchEvent<HTMLElement>) {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || e.changedTouches.length === 0) return;

    const end = e.changedTouches[0];
    const dx = end.clientX - start.x;
    const dy = end.clientY - start.y;
    const elapsed = Date.now() - start.at;

    const isLeftSwipe = dx <= -72;
    const isMostlyHorizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
    const isQuickEnough = elapsed <= 900;

    if (isLeftSwipe && isMostlyHorizontal && isQuickEnough) {
      goToTimer();
    }
  }

  return (
    <>
      <TimeBackground />
      <main className="app-shell app-shell-fit touch-pan-y" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="app-frame app-frame-fit soft-reveal">
          <div className="glass-panel p-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="glass-title text-2xl font-semibold">Medit Streak</div>
                <div className="text-xs muted mt-1">Respira, vuelve al presente, y suma continuidad.</div>
              </div>
              <div className="glass-chip">Offline</div>
            </div>
          </div>

          <StreakHeader streak={hydrated ? streak : 0} />

          <div className="glass-panel p-3">
            <div className="text-xs muted">Este mes</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="glass-panel-soft p-2.5">
                <div className="text-[11px] muted">Sesiones</div>
                <div className="text-xl font-semibold tabular-nums">{hydrated ? monthStats.sessions : 0}</div>
              </div>
              <div className="glass-panel-soft p-2.5">
                <div className="text-[11px] muted">Minutos</div>
                <div className="text-xl font-semibold tabular-nums">{hydrated ? monthStats.minutes : 0}</div>
              </div>
              <div className="glass-panel-soft p-2.5">
                <div className="text-[11px] muted">Media</div>
                <div className="text-xl font-semibold tabular-nums">{hydrated ? monthStats.avg : 0}</div>
                <div className="text-[10px] muted">min/sesión</div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-1.5 flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => setMonthDate((prev) => addMonths(prev, -1))}
              className="glass-button glass-button-muted"
              aria-label="Mes anterior"
            >
              <span className="ui-icon" aria-hidden="true">
                ←
              </span>
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
              <span className="ui-icon" aria-hidden="true">
                →
              </span>
            </button>
          </div>

          <CalendarGrid
            monthDate={monthDate}
            records={hydrated ? records : []}
            onDayClick={onDayClick}
            onDayLongPress={onDayLongPress}
          />

          <button
            type="button"
            onClick={goToTimer}
            className="glass-button glass-button-primary block w-full text-center py-2.5"
          >
            Ir al cronómetro
          </button>

          <div className="glass-panel-soft px-3 py-2 text-[11px] muted text-center">
            Desliza de derecha a izquierda para abrir el cronómetro.
          </div>
        </div>
      </main>

      {detailStats && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center px-4"
          onClick={() => setDetailDay(null)}
          role="presentation"
        >
          <div className="absolute inset-0 bg-[rgba(7,14,28,0.12)] backdrop-blur-[3px]" />
          <div
            className="relative w-full max-w-sm glass-popover p-4 soft-reveal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle del ${detailStats.label}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs muted">Detalle del día</div>
                <div className="glass-title text-xl font-semibold capitalize mt-1">{detailStats.label}</div>
              </div>
              <div className="glass-chip">{detailStats.completed ? "Completado" : "Sin marcar"}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="glass-panel-soft p-3">
                <div className="text-[11px] muted">Meditaste</div>
                <div className="text-2xl font-semibold tabular-nums mt-1">{detailStats.dayMinutes} min</div>
              </div>
              <div className="glass-panel-soft p-3">
                <div className="text-[11px] muted">Media del mes</div>
                <div className="text-2xl font-semibold tabular-nums mt-1">{detailStats.monthAverage} min</div>
              </div>
            </div>

            <div className="text-[11px] muted mt-3">Toca cualquier parte fuera de esta ventana para cerrarla.</div>
          </div>
        </div>
      )}
    </>
  );
}
