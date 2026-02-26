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
    <div className="rounded-2xl p-4 bg-white/80 shadow-sm border border-neutral-200">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold capitalize">{monthLabel}</div>
        <div className="text-xs text-neutral-500">Toca para marcar</div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs text-neutral-500 mb-2 select-none">
        {["L", "M", "X", "J", "V", "S", "D"].map((x) => (
          <div key={x} className="text-center">
            {x}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;

          const rec = map.get(day);
          const completed = rec?.completed ?? false;
          const isToday = day === todayStr;

          return (
            <button
              key={day}
              onClick={() => onDayClick(day)}
              className={[
                "h-10 rounded-xl border text-sm font-semibold",
                "transition active:scale-[0.98]",
                completed
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-50",
                isToday ? "ring-2 ring-blue-400 ring-offset-1" : "",
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
