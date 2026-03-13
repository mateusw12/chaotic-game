"use client";

import { useState } from "react";
import type { ActionMode, AttackCard, BattlegearCard, Creature, MugicCard, PlayerSide } from "./types";

type HandPanelProps = {
  side: PlayerSide;
  currentTurn: PlayerSide;
  actionMode: ActionMode;
  creatures: Creature[];
  attacks: AttackCard[];
  mugics: MugicCard[];
  battlegears: BattlegearCard[];
  onDragStartCreature: (cardId: string) => void;
  onDropCreatureInHand: () => void;
  onDragOverCreatureInHand: () => void;
  onDragStartAttack: (cardId: string) => void;
  onDragStartMugic: (cardId: string) => void;
  onDragStartBattlegear: (cardId: string) => void;
  onDragEnd: () => void;
};

type HandTab = "creatures" | "attacks" | "mugics" | "battlegears";

function draggableEnabled(currentTurn: PlayerSide, side: PlayerSide): boolean {
  return currentTurn === side;
}

export function HandPanel({
  side,
  currentTurn,
  actionMode,
  creatures,
  attacks,
  mugics,
  battlegears,
  onDragStartCreature,
  onDropCreatureInHand,
  onDragOverCreatureInHand,
  onDragStartAttack,
  onDragStartMugic,
  onDragStartBattlegear,
  onDragEnd,
}: HandPanelProps) {
  const canDrag = draggableEnabled(currentTurn, side);
  const [activeTab, setActiveTab] = useState<HandTab>("creatures");

  const tabClass = (isActive: boolean) =>
    `rounded-md border px-2 py-1 text-xs transition-colors ${isActive
      ? "border-sky-300 bg-sky-500/30 text-sky-100"
      : "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
    }`;

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-100">Mão do Jogador</h4>
        <p className="text-xs text-slate-400">Modo: {actionMode}</p>
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => setActiveTab("creatures")} className={tabClass(activeTab === "creatures")}>Criaturas ({creatures.length})</button>
        <button type="button" onClick={() => setActiveTab("attacks")} className={tabClass(activeTab === "attacks")}>Attacks ({attacks.length}/20)</button>
        <button type="button" onClick={() => setActiveTab("mugics")} className={tabClass(activeTab === "mugics")}>Mugic ({mugics.length}/6)</button>
        <button type="button" onClick={() => setActiveTab("battlegears")} className={tabClass(activeTab === "battlegears")}>Battlegear ({battlegears.length}/6)</button>
      </div>

      {activeTab === "creatures" ? (
        <div
          onDrop={(event) => {
            event.preventDefault();
            onDropCreatureInHand();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            onDragOverCreatureInHand();
          }}
          className="flex max-h-[32rem] flex-wrap gap-3 overflow-y-auto rounded border border-slate-700 p-3"
        >
          {creatures.map((creature) => (
            <button
              key={creature.id}
              type="button" title={creature.name} draggable={canDrag}
              onDragStart={() => onDragStartCreature(creature.id)}
              onDragEnd={onDragEnd}
              className="h-[14rem] w-36 overflow-hidden rounded border border-sky-300/70 bg-sky-500/20 text-xs text-sky-100"
            >
              <img src={creature.imageUrl} alt={creature.name} className="h-70 w-full object-cover" />
              <div className="line-clamp-2 px-1.5 py-1.5">{creature.name}</div>
            </button>
          ))}
        </div>
      ) : null}

      {activeTab === "attacks" ? (
        <div className="flex max-h-[32rem] flex-wrap gap-3 overflow-y-auto rounded border border-slate-700 p-3">
          {attacks.map((attack) => (
            <button
              key={attack.id}
              type="button" title={attack.name} draggable={canDrag}
              onDragStart={() => onDragStartAttack(attack.id)}
              onDragEnd={onDragEnd}
              className="h-[14rem] w-36 overflow-hidden rounded border border-red-300/70 bg-red-500/20 text-xs text-red-100"
            >
              <img src={attack.imageUrl} alt={attack.name} className="h-70 w-full object-cover" />
              <div className="line-clamp-2 px-1.5 py-1.5">{attack.name}</div>
            </button>
          ))}
        </div>
      ) : null}

      {activeTab === "mugics" ? (
        <div className="flex max-h-[32rem] flex-wrap gap-3 overflow-y-auto rounded border border-slate-700 p-3">
          {mugics.map((mugic) => (
            <button
              key={mugic.id}
              type="button" title={mugic.name} draggable={canDrag}
              onDragStart={() => onDragStartMugic(mugic.id)}
              onDragEnd={onDragEnd}
              className="h-[14rem] w-36 overflow-hidden rounded border border-fuchsia-300/70 bg-fuchsia-500/20 text-xs text-fuchsia-100"
            >
              <img src={mugic.imageUrl} alt={mugic.name} className="h-70 w-full object-cover" />
              <div className="line-clamp-2 px-1.5 py-1.5">{mugic.name}</div>
            </button>
          ))}
        </div>
      ) : null}

      {activeTab === "battlegears" ? (
        <div className="flex max-h-[32rem] flex-wrap gap-3 overflow-y-auto rounded border border-slate-700 p-3">
          {battlegears.map((gear) => (
            <button
              key={gear.id}
              type="button" title={gear.name} draggable={canDrag}
              onDragStart={() => onDragStartBattlegear(gear.id)}
              onDragEnd={onDragEnd}
              className="h-[14rem] w-36 overflow-hidden rounded border border-emerald-300/70 bg-emerald-500/20 text-xs text-emerald-100"
            >
              <img src={gear.imageUrl} alt={gear.name} className="h-70 w-full object-cover" />
              <div className="line-clamp-2 px-1.5 py-1.5">{gear.name}</div>
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-1 text-[11px] text-slate-400">Use o scroll dentro do container para ver todas as cartas.</div>
    </section>
  );
}
