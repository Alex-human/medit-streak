import {
  daysInMonth,
  formatMonthYear,
  startOfMonth,
  weekdayIndexMondayFirst,
  toDayString,
} from "@/lib/dates";
import type { DayRecord } from "@/lib/storage/sessions";

export default function CalendarGrid({
  monthDate,
  records,
  onDayClick,
}: {
  monthDate: Date;
  records: DayRecord[];
  onDayClick: (day: string) => void;
}) {
  const map = new Map(records.map((r) => [r.day, r]));
  const first = startOfMonth(monthDate);
  const total = daysInMonth(monthDate);
  const pad = weekdayIndexMondayFirst(first);

  const todayStr = toDayString(new Date());

  const cells: (string | null)[] = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= total; d++) {
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
    cells.push(toDayString(date));
  }

  const monthLabel = formatMonthYear(monthDate);

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold capitalize glass-title text-lg">{monthLabel}</div>
        <div className="text-xs muted">Toca para marcar</div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-[11px] muted mb-2 select-none">
        {["L", "M", "X", "J", "V", "S", "D"].map((x) => (
          <div key={x} className="text-center font-medium">
            {x}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="h-10" />;

          const rec = map.get(day);
          const completed = rec?.completed ?? false;
          const isToday = day === todayStr;

          return (
            <button
              key={day}
              onClick={() => onDayClick(day)}
              className={[
                "h-10 rounded-xl text-sm font-semibold tabular-nums",
                "transition duration-200 active:scale-[0.98]",
                completed
                  ? "border border-white/60 bg-white/32 shadow-[0_8px_18px_rgba(10,22,46,0.22)]"
                  : "border border-white/35 bg-white/12 hover:bg-white/20",
                isToday ? "ring-2 ring-cyan-200/80" : "",
              ].join(" ")}
              title={day}
            >
              {Number(day.slice(-2))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
