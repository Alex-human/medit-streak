"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PetCreatureCard from "./PetCreatureCard";
import { PET_DETAILS } from "@/lib/social/domain";
import type { CreatureEntry } from "@/lib/cloud/social";

/** Carrusel horizontal: se cambia de criatura deslizando, sin botones ni texto de ayuda. */
export default function PetCarousel({
  entries,
  size = "normal",
  label = "Tus mascotas",
}: {
  entries: CreatureEntry[];
  size?: "normal" | "large";
  label?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [active, setActive] = useState(0);

  const syncActive = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let closest = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    Array.from(rail.children).forEach((node, index) => {
      const child = node as HTMLElement;
      const distance = Math.abs(child.offsetLeft - rail.offsetLeft + child.clientWidth / 2 - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = index;
      }
    });
    setActive((current) => (current === closest ? current : closest));
  }, []);

  function onScroll() {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      syncActive();
    });
  }

  useEffect(() => {
    // Tras pintar: si se sincroniza dentro del efecto React encadena renders.
    const frame = window.requestAnimationFrame(syncActive);
    return () => {
      window.cancelAnimationFrame(frame);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [syncActive, entries.length]);

  function goTo(index: number) {
    const rail = railRef.current;
    const child = rail?.children[index] as HTMLElement | undefined;
    if (!rail || !child) return;
    const left = child.offsetLeft - rail.offsetLeft - (rail.clientWidth - child.clientWidth) / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }

  if (entries.length === 0) return null;

  return (
    <div className="pet-carousel" data-swipe-ignore="true">
      <div ref={railRef} onScroll={onScroll} className="pet-carousel-rail" role="group" aria-label={label}>
        {entries.map((entry, index) => (
          <div key={`${entry.garden?.pet.id ?? "demo"}-${entry.state.kind}`} className="pet-carousel-slide" aria-hidden={index === active ? undefined : true}>
            <PetCreatureCard entry={entry} size={size} />
          </div>
        ))}
      </div>

      {entries.length > 1 ? (
        <div className="pet-carousel-dots">
          {entries.map((entry, index) => (
            <button
              key={`${entry.garden?.pet.id ?? "demo"}-${entry.state.kind}-dot`}
              type="button"
              className={index === active ? "is-active" : ""}
              aria-label={PET_DETAILS[entry.state.kind].name}
              aria-current={index === active}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
