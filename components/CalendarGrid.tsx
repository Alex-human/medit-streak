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
      <div className="flex items-center justify-between mb-2.5">
        <div className="font-semibold capitalize glass-title text-base">{monthLabel}</div>
        <div className="text-[11px] muted">Toca para marcar</div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-[10px] muted mb-2 select-none">
        {["L", "M", "X", "J", "V", "S", "D"].map((x) => (
          <div key={x} className="text-center font-medium">
            {x}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="h-9" />;

          const rec = map.get(day);
          const completed = rec?.completed ?? false;
          const isToday = day === todayStr;

          return (
            <button
              key={day}
              onClick={() => onDayClick(day)}
              className={[
                "calendar-day h-9 text-xs font-semibold tabular-nums",
                "transition duration-200 active:scale-[0.98]",
                completed ? "calendar-day-completed" : isToday ? "calendar-day-today" : "calendar-day-empty",
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
