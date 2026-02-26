"use client";

import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
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
  const noticeTimeoutRef = useRef<number | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number; at: number } | null>(null);

  useEffect(() => {
    const refresh = () => {
      setRecords(getAllDays());
      setHydrated(true);
    };

    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current !== null) {
        window.clearTimeout(noticeTimeoutRef.current);
      }
    };
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
    if (noticeTimeoutRef.current !== null) {
      window.clearTimeout(noticeTimeoutRef.current);
    }
    noticeTimeoutRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimeoutRef.current = null;
    }, 2500);
  }

  function onTouchStart(e: TouchEvent<HTMLElement>) {
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
      router.push("/timer");
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

          {notice && (
            <div className="glass-panel p-3">
              <div className="font-semibold">No se puede marcar manualmente</div>
              <div className="text-xs muted mt-1">{notice}</div>
              <div className="text-[11px] muted mt-2">Desliza de derecha a izquierda para ir al cronómetro.</div>
            </div>
          )}

          <CalendarGrid monthDate={monthDate} records={hydrated ? records : []} onDayClick={onDayClick} />

          <button
            type="button"
            onClick={() => router.push("/timer")}
            className="glass-button glass-button-primary block w-full text-center py-2.5"
          >
            Ir al cronómetro
          </button>

          <div className="glass-panel-soft px-3 py-2 text-[11px] muted text-center">
            Desliza de derecha a izquierda para abrir el cronómetro.
          </div>
        </div>
      </main>
    </>
  );
}
