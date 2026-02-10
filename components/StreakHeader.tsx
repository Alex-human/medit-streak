export default function StreakHeader({ streak }: { streak: number }) {
  return (
    <div className="rounded-2xl p-4 bg-white/80 shadow-sm border border-neutral-200">
      <div className="text-sm text-neutral-600">Racha</div>
      <div className="text-3xl font-bold tracking-tight">🔥 {streak} días</div>
      <div className="text-xs text-neutral-500 mt-1">
        Días consecutivos con meditación completada.
      </div>
    </div>
  );
}
