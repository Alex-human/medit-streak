"use client";

import { useState, type FormEvent } from "react";
import ItemIcon from "./ItemIcon";
import PetAvatar from "./PetAvatar";
import { confirmChoice, proposeChoice, type PetCard } from "@/lib/cloud/social";
import { PET_DETAILS, PET_KINDS, type PetKind } from "@/lib/social/domain";
import { catalogItem, isIdentity, itemsForPick, type ChoicePayload } from "@/lib/social/catalog";

const PICK_LABELS = { identidad: "Nombre y elemento", objeto: "Un objeto zen", rasgo: "Un rasgo elemental", libre: "Lo que queráis" } as const;

function describePayload(payload: ChoicePayload) {
  if (isIdentity(payload)) return `${payload.name} · ${PET_DETAILS[payload.element].title}`;
  if ("item" in payload && payload.item) return catalogItem(payload.item)?.label ?? payload.item;
  if ("order" in payload) return `Pedido: “${payload.order}”`;
  return "";
}

/** Las decisiones abiertas de la mascota: una propone, la otra confirma o contrapropone. */
export default function ChoicePanel({ card, onChanged }: { card: PetCard; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | null>(null);

  if (card.due.length === 0) return null;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setEditing(null);
      await onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la decisión.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass-panel p-3 grid gap-3" aria-label="Decisiones pendientes">
      {error ? <p className="form-error">{error}</p> : null}
      {card.due.map(({ milestone, row }) => {
        const mine = row?.proposed_by === card.currentUserId;
        const open = editing === milestone.day || (row === null && card.due.length === 1 && milestone.pick === "identidad");
        const propose = (payload: ChoicePayload) => run(() => proposeChoice(card.pet.id, card.life.life, milestone.day, payload, row));
        const cancel = row ? () => setEditing(null) : undefined;
        return (
          <div key={milestone.day} className="pet-choice">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-xs muted">{milestone.pick === "identidad" ? "Está a punto de nacer" : `Hito del día ${milestone.day}`}</div>
              <div className="text-xs font-semibold">{PICK_LABELS[milestone.pick]}</div>
            </div>

            {row && !open ? (
              <div className="mt-2">
                <p className="text-sm">
                  <strong>{mine ? "Has propuesto" : `${card.friend.display_name} propone`}:</strong> {describePayload(row.payload)}
                </p>
                <div className="flex gap-2 mt-2">
                  {mine ? (
                    <span className="text-xs muted self-center">Esperando a {card.friend.display_name}</span>
                  ) : (
                    <button type="button" disabled={busy} onClick={() => void run(() => confirmChoice(card, row))} className="glass-button glass-button-primary px-3 py-2 text-xs">
                      Me gusta
                    </button>
                  )}
                  <button type="button" disabled={busy} onClick={() => setEditing(milestone.day)} className="glass-button glass-button-muted px-3 py-2 text-xs">
                    {mine ? "Cambiar" : "Proponer otra"}
                  </button>
                </div>
              </div>
            ) : null}

            {row === null && !open ? (
              <button type="button" disabled={busy} onClick={() => setEditing(milestone.day)} className="glass-button glass-button-primary w-full py-2 text-xs mt-2">
                Proponer
              </button>
            ) : null}

            {open ? (
              milestone.pick === "identidad"
                ? <IdentityForm busy={busy} onSubmit={propose} onCancel={cancel} />
                : <ItemPicker pick={milestone.pick} busy={busy} onSubmit={propose} onCancel={cancel} />
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

function IdentityForm({ busy, onSubmit, onCancel }: { busy: boolean; onSubmit: (payload: ChoicePayload) => void; onCancel?: () => void }) {
  const [element, setElement] = useState<PetKind | null>(null);
  const [name, setName] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!element) return;
    onSubmit({ name: name.trim() || PET_DETAILS[element].name, element });
  }

  return (
    <form onSubmit={submit} className="grid gap-3 mt-2">
      <div className="pet-element-grid" role="radiogroup" aria-label="Elemento">
        {PET_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            role="radio"
            aria-checked={element === kind}
            className={`pet-element ${element === kind ? "is-active" : ""}`}
            onClick={() => setElement(kind)}
          >
            <PetAvatar kind={kind} stage="bebe" mood="feliz" size="small" name={PET_DETAILS[kind].name} />
            <span className="text-[11px] font-semibold">{PET_DETAILS[kind].title}</span>
          </button>
        ))}
      </div>
      <label className="text-xs muted">
        Nombre
        <input className="glass-input w-full mt-1.5" value={name} maxLength={24} placeholder={element ? PET_DETAILS[element].name : "Cómo se llamará"} onChange={(event) => setName(event.target.value)} />
      </label>
      <div className="flex gap-2">
        <button disabled={busy || !element} className="glass-button glass-button-primary flex-1 py-2.5 text-sm">Proponer</button>
        {onCancel ? <button type="button" onClick={onCancel} className="glass-button glass-button-muted px-4 text-sm">Volver</button> : null}
      </div>
    </form>
  );
}

function ItemPicker({ pick, busy, onSubmit, onCancel }: { pick: "objeto" | "rasgo" | "libre"; busy: boolean; onSubmit: (payload: ChoicePayload) => void; onCancel?: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [order, setOrder] = useState("");
  const items = itemsForPick(pick);

  return (
    <div className="grid gap-3 mt-2">
      <div className="pet-items-grid" role="listbox" aria-label="Piezas">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={selected === item.id}
            className={`pet-item-tile ${selected === item.id ? "is-active" : ""}`}
            onClick={() => { setSelected(item.id); setOrder(""); }}
          >
            <ItemIcon item={item} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <label className="text-xs muted">
        O un pedido personalizado
        <input className="glass-input w-full mt-1.5" value={order} maxLength={80} placeholder="Escribe lo que le queréis añadir" onChange={(event) => { setOrder(event.target.value); setSelected(null); }} />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy || (!selected && !order.trim())}
          onClick={() => onSubmit(selected ? { item: selected } : { order: order.trim() })}
          className="glass-button glass-button-primary flex-1 py-2.5 text-sm"
        >
          Proponer
        </button>
        {onCancel ? <button type="button" onClick={onCancel} className="glass-button glass-button-muted px-4 text-sm">Volver</button> : null}
      </div>
    </div>
  );
}
