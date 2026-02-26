"use client";

import { useEffect, useState } from "react";
import { getTimePhase, type TimePhase } from "@/lib/timePhase";

export default function TimeBackground() {
  const [phase, setPhase] = useState<TimePhase>(() => getTimePhase(new Date()));

  useEffect(() => {
    const syncPhase = () => setPhase(getTimePhase(new Date()));

    syncPhase();
    const id = window.setInterval(syncPhase, 60_000);
    window.addEventListener("focus", syncPhase);
    window.addEventListener("visibilitychange", syncPhase);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", syncPhase);
      window.removeEventListener("visibilitychange", syncPhase);
    };
  }, []);

  return (
    <div className={`time-scene time-phase-${phase}`} aria-hidden="true">
      <div className="time-gradient" />
      <div className="time-haze" />
      <div className="time-orb" />
      <div className="time-particles" />
      <div className="time-waves" />
    </div>
  );
}
