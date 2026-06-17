"use client";

import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import CalendarGrid from "@/components/CalendarGrid";
import StreakHeader from "@/components/StreakHeader";
import TimeBackground from "@/components/TimeBackground";
import { toDayString } from "@/lib/dates";
import { computeStreak } from "@/lib/streak";
import {
  addSession,
  deleteSession,
  getAllDays,
  updateSession,
  type DayRecord,
  type MeditationSession,
} from "@/lib/storage/sessions";
import { useRouter } from "next/navigation";

function startOfMonthLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function dateFromDayString(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
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
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateFromDayString(day));
}

function formatSessionTime(createdAt: number) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

type SessionEditorState = {
  day: string;
  sessionId: string;
  minutes: string;
  createdAt: number;
};

export default function HomePage() {
  const router = useRouter();
  const [monthDate, setMonthDate] = useState<Date | null>(null);
  const [todayDay, setTodayDay] = useState<string | null>(null);
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [detailDay, setDetailDay] = useState<string | null>(null);
  const [manualDay, setManualDay] = useState<string | null>(null);
  const [manualMinutes, setManualMinutes] = useState("10");
  const [manualConfirmed, setManualConfirmed] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const manualSavingRef = useRef(false);
  const [editingSession, setEditingSession] = useState<SessionEditorState | null>(null);
  const [editConfirmed, setEditConfirmed] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const editSavingRef = useRef(false);
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState<string | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number; at: number } | null>(null);
  const navigatingRef = useRef(false);

  function goToTimer() {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    router.push("/timer");
  }

  function goToToday() {
    const now = new Date();
    setTodayDay(toDayString(now));
    setMonthDate(startOfMonthLocal(now));
  }

  useEffect(() => {
    let active = true;
    const syncToday = () => {
      const now = new Date();
      const nextToday = toDayString(now);
      const nextMonth = startOfMonthLocal(now);

      if (!active) return;
      setTodayDay(nextToday);
      setMonthDate((current) => current ?? nextMonth);
    };
    const refresh = async () => {
      const next = await getAllDays();
      if (!active) return;
      setRecords(next);
      setHydrated(true);
    };

    syncToday();
    void refresh();
    const interval = window.setInterval(syncToday, 60_000);
    window.addEventListener("focus", syncToday);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", syncToday);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const streak = useMemo(() => {
    if (!todayDay) return 0;
    return computeStreak(records, dateFromDayString(todayDay));
  }, [records, todayDay]);

  const monthStats = useMemo(() => {
    if (!monthDate) return { sessions: 0, minutes: 0, avg: 0 };

    const key = monthKey(monthDate);
    const inMonth = records.filter((r) => r.day.startsWith(key));
    const sessionsList = inMonth.flatMap((record) => record.sessions);
    const sessions = sessionsList.length;
    const minutes = sessionsList.reduce((acc, session) => acc + session.minutes, 0);
    const avg = sessions > 0 ? Math.round(minutes / sessions) : 0;

    return { sessions, minutes, avg };
  }, [records, monthDate]);

  const defaultMinutes = useMemo(() => {
    const latestSession = [...records]
      .flatMap((record) => record.sessions)
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    return latestSession?.minutes ?? 10;
  }, [records]);

  const detailStats = useMemo(() => {
    if (!detailDay) return null;

    const selectedRecord = records.find((record) => record.day === detailDay);
    const selectedMonth = detailDay.slice(0, 7);
    const monthSessions = records
      .filter((record) => record.day.startsWith(selectedMonth))
      .flatMap((record) => record.sessions);
    const monthMinutes = monthSessions.reduce((acc, session) => acc + session.minutes, 0);
    const monthAverage = monthSessions.length > 0 ? Math.round(monthMinutes / monthSessions.length) : 0;

    return {
      day: detailDay,
      label: formatDayLabel(detailDay),
      completed: selectedRecord?.completed ?? false,
      dayMinutes: selectedRecord?.minutes ?? 0,
      sessions: selectedRecord?.sessions ?? [],
      monthAverage,
    };
  }, [detailDay, records]);

  function openManualDay(day: string) {
    if (day !== toDayString(new Date())) return;

    setManualDay(day);
    setManualMinutes(String(defaultMinutes));
    setManualConfirmed(false);
    setManualError(null);
    manualSavingRef.current = false;
    setManualSaving(false);
  }

  function closeManualDay(force = false) {
    if (manualSavingRef.current && !force) return;
    setManualDay(null);
    setManualConfirmed(false);
    setManualError(null);
    manualSavingRef.current = false;
    setManualSaving(false);
  }

  function openSessionEditor(day: string, session: MeditationSession) {
    setEditingSession({
      day,
      sessionId: session.id,
      minutes: String(session.minutes),
      createdAt: session.createdAt,
    });
    setEditConfirmed(false);
    editSavingRef.current = false;
    setEditSaving(false);
  }

  function closeSessionEditor(force = false) {
    if (editSavingRef.current && !force) return;
    setEditingSession(null);
    setEditConfirmed(false);
    editSavingRef.current = false;
    setEditSaving(false);
  }

  function onDayClick(day: string) {
    if (day !== toDayString(new Date())) return;

    openManualDay(day);
  }

  function onDayLongPress(day: string) {
    setDetailDay(day);
  }

  async function confirmManualSession() {
    if (!manualDay || !manualConfirmed || manualSavingRef.current) return;
    if (manualDay !== toDayString(new Date())) {
      setManualError("Solo puedes registrar meditaciones del día de hoy.");
      return;
    }

    const parsedMinutes = Number(manualMinutes);
    const minutes = Number.isFinite(parsedMinutes) ? Math.max(1, Math.round(parsedMinutes)) : NaN;
    if (!Number.isFinite(minutes)) return;

    manualSavingRef.current = true;
    setManualSaving(true);
    setManualError(null);

    try {
      const day = manualDay;
      await addSession(day, minutes);
      const next = await getAllDays();
      setRecords(next);
      closeManualDay(true);
      setManualMinutes(String(minutes));
      setManualConfirmed(false);
    } catch {
      setManualError("No se pudo guardar la sesión. Inténtalo de nuevo.");
    } finally {
      manualSavingRef.current = false;
      setManualSaving(false);
    }
  }

  async function confirmSessionEdit() {
    if (!editingSession || !editConfirmed || editSavingRef.current) return;

    const parsedMinutes = Number(editingSession.minutes);
    const minutes = Number.isFinite(parsedMinutes) ? Math.max(1, Math.round(parsedMinutes)) : NaN;
    if (!Number.isFinite(minutes)) return;

    editSavingRef.current = true;
    setEditSaving(true);

    try {
      await updateSession(editingSession.day, editingSession.sessionId, minutes);
      const next = await getAllDays();
      setRecords(next);
      closeSessionEditor(true);
    } finally {
      editSavingRef.current = false;
      setEditSaving(false);
    }
  }

  async function removeSession(day: string, sessionId: string, closeEditor = false) {
    if (pendingDeleteSessionId === sessionId) return;

    setPendingDeleteSessionId(sessionId);

    try {
      await deleteSession(day, sessionId);
      const next = await getAllDays();
      setRecords(next);

      if (closeEditor && editingSession?.sessionId === sessionId) {
        closeSessionEditor();
      }
    } finally {
      setPendingDeleteSessionId(null);
    }
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
              onClick={() => setMonthDate((prev) => addMonths(prev ?? new Date(), -1))}
              className="glass-button glass-button-muted"
              aria-label="Mes anterior"
            >
              <span className="ui-icon" aria-hidden="true">
                ←
              </span>
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="glass-button glass-button-primary flex-1"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setMonthDate((prev) => addMonths(prev ?? new Date(), 1))}
              className="glass-button glass-button-muted"
              aria-label="Mes siguiente"
            >
              <span className="ui-icon" aria-hidden="true">
                →
              </span>
            </button>
          </div>

          {monthDate && todayDay ? (
            <CalendarGrid
              monthDate={monthDate}
              records={hydrated ? records : []}
              todayDay={todayDay}
              onDayClick={onDayClick}
              onDayLongPress={onDayLongPress}
            />
          ) : (
            <div className="glass-panel p-4 text-sm muted">Cargando calendario...</div>
          )}

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
                <div className="text-[11px] muted">Minutos del día</div>
                <div className="text-2xl font-semibold tabular-nums mt-1">{detailStats.dayMinutes} min</div>
              </div>
              <div className="glass-panel-soft p-3">
                <div className="text-[11px] muted">Media del mes</div>
                <div className="text-2xl font-semibold tabular-nums mt-1">{detailStats.monthAverage} min</div>
              </div>
            </div>

            <div className="mt-3 glass-panel-soft p-3">
              <div className="text-[11px] muted">Sesiones de ese día</div>
              {detailStats.sessions.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {detailStats.sessions.map((session, index) => (
                    <div key={session.id} className="rounded-2xl border border-white/15 bg-white/8 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">Sesión {index + 1}</div>
                          <div className="text-[11px] muted">{formatSessionTime(session.createdAt)}</div>
                        </div>
                        <div className="text-lg font-semibold tabular-nums">{session.minutes} min</div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openSessionEditor(detailStats.day, session)}
                          className="glass-button glass-button-muted px-3 py-1.5 text-xs"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeSession(detailStats.day, session.id)}
                          disabled={pendingDeleteSessionId === session.id}
                          className={[
                            "glass-button px-3 py-1.5 text-xs",
                            pendingDeleteSessionId === session.id ? "opacity-55 cursor-not-allowed" : "",
                          ].join(" ")}
                        >
                          {pendingDeleteSessionId === session.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm muted mt-2">No hay sesiones registradas en este día.</div>
              )}
            </div>

            <div className="text-[11px] muted mt-3">Toca cualquier parte fuera de esta ventana para cerrarla.</div>
          </div>
        </div>
      )}

      {manualDay && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center px-4"
          onClick={() => closeManualDay()}
          role="presentation"
        >
          <div className="absolute inset-0 bg-[rgba(7,14,28,0.16)] backdrop-blur-[4px]" />
          <div
            className="relative w-full max-w-sm glass-popover p-4 soft-reveal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Registrar meditación del ${formatDayLabel(manualDay)}`}
          >
            <div className="text-xs muted">Registrar meditación</div>
            <div className="glass-title text-xl font-semibold capitalize mt-1">{formatDayLabel(manualDay)}</div>

            <div className="mt-4">
              <label className="text-[11px] muted block mb-2" htmlFor="manual-minutes">
                Minutos meditados
              </label>
              <input
                id="manual-minutes"
                type="number"
                inputMode="numeric"
                min={1}
                max={180}
                value={manualMinutes}
                placeholder={String(defaultMinutes)}
                disabled={manualSaving}
                onChange={(e) => setManualMinutes(e.target.value)}
                className="glass-input w-full text-base font-semibold"
              />
              <div className="text-[11px] muted mt-2">Sugerencia: {defaultMinutes} min si quieres usar tu duración habitual.</div>
            </div>

            <label className="mt-4 glass-panel-soft p-3 flex items-start gap-3 cursor-pointer">
              <span className="glass-check">
                <input
                  type="checkbox"
                  checked={manualConfirmed}
                  onChange={(e) => setManualConfirmed(e.target.checked)}
                  disabled={manualSaving}
                  className="sr-only"
                />
                <span className={manualConfirmed ? "glass-check-indicator glass-check-indicator-checked" : "glass-check-indicator"} />
              </span>
              <span className="text-sm leading-6">
                Confirmo que soy honesto conmigo mismo y he meditado de verdad.
              </span>
            </label>

            {manualError ? <div className="text-[11px] text-red-700 mt-3">{manualError}</div> : null}

            <button
              type="button"
              onClick={() => void confirmManualSession()}
              disabled={manualSaving || !manualConfirmed || !manualMinutes || Number(manualMinutes) <= 0}
              className={[
                "glass-button glass-button-primary w-full mt-4 py-3",
                manualSaving || !manualConfirmed || !manualMinutes || Number(manualMinutes) <= 0 ? "opacity-55 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {manualSaving ? "Guardando..." : "Confirmar sesión"}
            </button>
          </div>
        </div>
      )}

      {editingSession && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-4"
          onClick={() => closeSessionEditor()}
          role="presentation"
        >
          <div className="absolute inset-0 bg-[rgba(7,14,28,0.16)] backdrop-blur-[4px]" />
          <div
            className="relative w-full max-w-sm glass-popover p-4 soft-reveal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Editar meditación del ${formatDayLabel(editingSession.day)}`}
          >
            <div className="text-xs muted">Editar sesión</div>
            <div className="glass-title text-xl font-semibold capitalize mt-1">{formatDayLabel(editingSession.day)}</div>
            <div className="text-[11px] muted mt-1">Sesión registrada a las {formatSessionTime(editingSession.createdAt)}</div>

            <div className="mt-4">
              <label className="text-[11px] muted block mb-2" htmlFor="edit-minutes">
                Minutos meditados
              </label>
              <input
                id="edit-minutes"
                type="number"
                inputMode="numeric"
                min={1}
                max={180}
                value={editingSession.minutes}
                disabled={editSaving || pendingDeleteSessionId === editingSession.sessionId}
                onChange={(e) =>
                  setEditingSession((current) => (current ? { ...current, minutes: e.target.value } : current))
                }
                className="glass-input w-full text-base font-semibold"
              />
            </div>

            <label className="mt-4 glass-panel-soft p-3 flex items-start gap-3 cursor-pointer">
              <span className="glass-check">
                <input
                  type="checkbox"
                  checked={editConfirmed}
                  onChange={(e) => setEditConfirmed(e.target.checked)}
                  disabled={editSaving || pendingDeleteSessionId === editingSession.sessionId}
                  className="sr-only"
                />
                <span className={editConfirmed ? "glass-check-indicator glass-check-indicator-checked" : "glass-check-indicator"} />
              </span>
              <span className="text-sm leading-6">
                Confirmo que soy honesto conmigo mismo y he meditado de verdad.
              </span>
            </label>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void removeSession(editingSession.day, editingSession.sessionId, true)}
                disabled={editSaving || pendingDeleteSessionId === editingSession.sessionId}
                className={[
                  "glass-button glass-button-muted py-3",
                  editSaving || pendingDeleteSessionId === editingSession.sessionId ? "opacity-55 cursor-not-allowed" : "",
                ].join(" ")}
              >
                {pendingDeleteSessionId === editingSession.sessionId ? "Eliminando..." : "Eliminar sesión"}
              </button>
              <button
                type="button"
                onClick={() => void confirmSessionEdit()}
                disabled={editSaving || !editConfirmed || !editingSession.minutes || Number(editingSession.minutes) <= 0}
                className={[
                  "glass-button glass-button-primary py-3",
                  editSaving || !editConfirmed || !editingSession.minutes || Number(editingSession.minutes) <= 0
                    ? "opacity-55 cursor-not-allowed"
                    : "",
                ].join(" ")}
              >
                {editSaving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
