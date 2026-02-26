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
    <div className="glass-panel p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold capitalize glass-title text-base">{monthLabel}</div>
        <div className="text-[11px] muted">Toca para marcar</div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[10px] muted mb-1.5 select-none">
        {["L", "M", "X", "J", "V", "S", "D"].map((x) => (
          <div key={x} className="text-center font-medium">
            {x}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="h-8" />;

          const rec = map.get(day);
          const completed = rec?.completed ?? false;
          const isToday = day === todayStr;

          return (
            <button
              key={day}
              onClick={() => onDayClick(day)}
              className={[
                "h-8 rounded-lg text-xs font-semibold tabular-nums backdrop-blur-[10px]",
                "transition duration-200 active:scale-[0.98]",
                isToday
                  ? "border-2 border-white/75 bg-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_0_18px_rgba(255,255,255,0.32)]"
                  : completed
                    ? "border border-white/45 bg-black/25 shadow-[0_8px_18px_rgba(10,22,46,0.28)]"
                    : "border border-white/35 bg-white/15 hover:bg-white/22",
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
