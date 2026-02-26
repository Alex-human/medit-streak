export default function StreakHeader({ streak }: { streak: number }) {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm muted">Racha actual</div>
          <div className="glass-title text-4xl font-semibold tracking-tight mt-1 tabular-nums">🔥 {streak} días</div>
        </div>
        <div className="glass-panel-soft px-3 py-2 text-xs muted">Consistencia</div>
      </div>
      <div className="text-xs muted mt-2">Días consecutivos con meditación completada.</div>
    </div>
  );
}
