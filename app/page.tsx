"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarGrid from "@/components/CalendarGrid";
import StreakHeader from "@/components/StreakHeader";
import { computeStreak } from "@/lib/streak";
import { getAllDays, DayRecord } from "@/lib/storage/sessions";
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
  return `${y}-${m}`; // "YYYY-MM"
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


  function onDayClick(_day: string) {
    setNotice("Para marcar un día, tienes que usar el cronómetro y terminar la sesión.");
    window.setTimeout(() => setNotice(null), 2500);
  }

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold tracking-tight">Medit Streak</div>
          <div className="text-xs text-neutral-500">Offline base</div>
        </div>

        <StreakHeader streak={hydrated ? streak : 0} />

        <div className="rounded-2xl p-4 bg-white/80 shadow-sm border border-neutral-200">
          <div className="text-sm text-neutral-600">Este mes</div>
          <div className="mt-1 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-3">
              <div className="text-xs text-neutral-500">Sesiones</div>
              <div className="text-xl font-bold">{hydrated ? monthStats.sessions : 0}</div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-3">
              <div className="text-xs text-neutral-500">Minutos</div>
              <div className="text-xl font-bold">{hydrated ? monthStats.minutes : 0}</div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-3">
              <div className="text-xs text-neutral-500">Media</div>
              <div className="text-xl font-bold">{hydrated ? monthStats.avg : 0}</div>
              <div className="text-[11px] text-neutral-500">min/sesión</div>
            </div>
          </div>
        </div>

        {/* Navegación de meses */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMonthDate((prev) => addMonths(prev, -1))}
            className="rounded-xl px-3 py-2 bg-white border border-neutral-200 font-semibold hover:bg-neutral-50 transition active:scale-[0.99]"
            aria-label="Mes anterior"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => setMonthDate(startOfMonthLocal(new Date()))}
            className="flex-1 rounded-xl px-3 py-2 bg-white border border-neutral-200 font-semibold hover:bg-neutral-50 transition active:scale-[0.99]"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => setMonthDate((prev) => addMonths(prev, 1))}
            className="rounded-xl px-3 py-2 bg-white border border-neutral-200 font-semibold hover:bg-neutral-50 transition active:scale-[0.99]"
            aria-label="Mes siguiente"
          >
            →
          </button>
        </div>

        {notice && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <div className="font-semibold">No se puede marcar manualmente</div>
            <div className="text-blue-800 mt-1">{notice}</div>
            <button
              type="button"
              onClick={() => router.push("/timer")}
              className="mt-2 underline font-semibold"
            >
              Ir al cronómetro
            </button>
          </div>
        )}

        <CalendarGrid
          monthDate={monthDate}
          records={hydrated ? records : []}
          onDayClick={onDayClick}
        />

        <button
          type="button"
          onClick={() => router.push("/timer")}
          className="block w-full text-center rounded-xl px-4 py-3 bg-neutral-900 text-white font-semibold transition active:scale-[0.99]"
        >
          Ir al cronómetro
        </button>

        <div className="text-xs text-neutral-500">
          Para marcar “hoy”, completa el cronómetro.
        </div>
      </div>
    </main>
  );
}
