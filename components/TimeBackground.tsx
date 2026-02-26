"use client";

import { useEffect } from "react";
import { getTimePhase } from "@/lib/timePhase";

export default function TimeBackground() {
  useEffect(() => {
    const syncPhase = () => {
      const phase = getTimePhase(new Date());
      document.documentElement.setAttribute("data-time-phase", phase);
    };

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
    <div className="time-scene" aria-hidden="true">
      <div className="time-gradient" />
      <div className="time-haze" />
      <div className="time-orb" />
      <div className="time-particles" />
      <div className="time-waves" />
    </div>
  );
}
