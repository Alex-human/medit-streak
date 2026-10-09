/** `streak` es null mientras las meditaciones no se han cargado: no saberlo no es llevar cero días. */
export default function StreakHeader({ streak }: { streak: number | null }) {
  return (
    <div className="glass-panel p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs muted">Racha actual</div>
          <div className="glass-title text-3xl font-semibold tracking-tight mt-1 tabular-nums">
            <span className="ui-icon" aria-hidden="true">
              🔥
            </span>{" "}
            {streak ?? "–"} días
          </div>
        </div>
        <div className="glass-panel-soft px-2.5 py-1.5 text-[11px] muted">Consistencia</div>
      </div>
      <div className="text-[11px] muted mt-1.5">Días consecutivos con meditación completada.</div>
    </div>
  );
}
