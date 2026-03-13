import type { DragEvent } from "react";
import { CreatureCard } from "./creature-card";
import type { Creature, PlayerBattleState, PlayerSide } from "./types";

type PlayerPanelProps = {
  side: PlayerSide;
  isCurrentTurn: boolean;
  player: PlayerBattleState;
  activeCreatureId: string | null;
  creatureSlots: Array<Creature | null>;
  isInteractive?: boolean;
  showCloseDeckButton?: boolean;
  onCloseDeck?: () => void;
  onSelectCreature: (creatureId: string) => void;
  onDropCreature: (creatureId: string) => void;
  onDragOverCreature: (event: DragEvent<HTMLDivElement>, creatureId: string) => void;
  onDragStartCreature: (creatureId: string) => void;
  onDragEndCreature: () => void;
  onDropCreatureSlot: (slotIndex: number) => void;
  onDragOverCreatureSlot: (event: DragEvent<HTMLDivElement>, slotIndex: number) => void;
  getCreatureSlotDropStatus: (slotIndex: number) => "valid" | "invalid" | "neutral";
  onDropMugicSlot: () => void;
  onDragOverMugicSlot: (event: DragEvent<HTMLDivElement>) => void;
  getDropStatus: (creature: Creature) => "valid" | "invalid" | "neutral";
};

export function PlayerPanel({
  side,
  isCurrentTurn,
  player,
  activeCreatureId,
  creatureSlots,
  isInteractive = true,
  showCloseDeckButton = false,
  onCloseDeck,
  onSelectCreature,
  onDropCreature,
  onDragOverCreature,
  onDragStartCreature,
  onDragEndCreature,
  onDropCreatureSlot,
  onDragOverCreatureSlot,
  getCreatureSlotDropStatus,
  onDropMugicSlot,
  onDragOverMugicSlot,
  getDropStatus,
}: PlayerPanelProps) {
  const isOpponentSide = side === "top";
  const hasPlacedCreatures = creatureSlots.some((creature) => Boolean(creature));
  const progressionRows: number[][] = [];
  let nextIndex = 0;
  let rowSize = 1;

  while (nextIndex < creatureSlots.length) {
    const row: number[] = [];

    for (let offset = 0; offset < rowSize && nextIndex < creatureSlots.length; offset += 1) {
      row.push(nextIndex);
      nextIndex += 1;
    }

    progressionRows.push(row);
    rowSize += 1;
  }
  const displayRows = progressionRows;

  return (
    <section className={`rounded-xl border border-slate-700 bg-slate-900/80 p-3 ${isCurrentTurn ? "shadow-[0_0_0_2px_rgba(34,197,94,0.45)]" : ""}`}>
      <div className={`mb-3 flex flex-wrap items-center justify-between gap-3 ${isOpponentSide ? "sm:flex-row-reverse" : ""}`}>
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-700 text-xl">{player.avatar}</div>
          <div>
            <p className="text-sm font-semibold text-slate-100">{player.name}</p>
            <p className="text-xs text-slate-400">{side === "top" ? "Oponente" : "Jogador atual"}</p>
          </div>
        </div>
        {showCloseDeckButton ? (
          <button
            type="button"
            onClick={onCloseDeck}
            className="rounded-md border border-amber-300/70 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-100 hover:bg-amber-500/20"
          >
            Fechar baralho
          </button>
        ) : null}
      </div>

      <div className={`flex flex-wrap gap-3 pb-1 ${isOpponentSide ? "" : "flex-row-reverse"}`}>
        <div className="flex min-w-[58px] flex-col gap-1 rounded-lg border border-slate-700 bg-slate-800/70 p-2">
          {Array.from({ length: 6 }).map((_, index) => {
            const filled = index < player.mugicDeck.length;
            return (
              <div
                key={`${player.id}-slot-${index}`}
                onDrop={isInteractive ? (event) => {
                  event.preventDefault();
                  onDropMugicSlot();
                } : undefined}
                onDragOver={isInteractive ? onDragOverMugicSlot : undefined}
                style={{
                  clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                }}
                className={`${filled ? "bg-fuchsia-300" : "bg-fuchsia-400"} h-9 w-9 p-[2px]`}
              >
                <div
                  style={{
                    clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
                  }}
                  className={`${filled ? "bg-fuchsia-500/35" : "bg-transparent"} h-full w-full`}
                />
              </div>
            );
          })}
          <span className="mt-1 text-center text-[10px] text-slate-300">Mugic</span>
        </div>

        <div className="space-y-2">
          {!hasPlacedCreatures ? (
            <p className="text-xs text-slate-300">Sem criaturas</p>
          ) : null}

          {displayRows.map((row, rowIndex) => {
            const slots = isOpponentSide ? row : [...row].reverse();

            return (
              <div
                key={`${player.id}-progression-row-${rowIndex}`}
                className={`flex gap-2 ${isOpponentSide ? "justify-start" : "justify-end"}`}
              >
                {slots.map((slotIndex) => {
                  const creature = creatureSlots[slotIndex];

                  if (creature) {
                    return (
                      <CreatureCard
                        key={creature.id}
                        creature={creature}
                        isActive={activeCreatureId === creature.id}
                        dropStatus={getDropStatus(creature)}
                        onDragStart={isInteractive ? () => onDragStartCreature(creature.id) : undefined}
                        onDragEnd={isInteractive ? onDragEndCreature : undefined}
                        onSelect={isInteractive ? () => onSelectCreature(creature.id) : () => undefined}
                        onDrop={isInteractive ? () => onDropCreature(creature.id) : () => undefined}
                        onDragOver={isInteractive ? (event) => onDragOverCreature(event, creature.id) : () => undefined}
                      />
                    );
                  }

                  const slotStatus = getCreatureSlotDropStatus(slotIndex);
                  const slotClass =
                    slotStatus === "valid"
                      ? "border-emerald-400 bg-emerald-500/10"
                      : slotStatus === "invalid"
                        ? "border-red-400 bg-red-500/10"
                        : "border-slate-600 bg-slate-900/70";

                  return (
                    <div
                      key={`${player.id}-empty-slot-${slotIndex}`}
                      onDrop={isInteractive ? (event) => {
                        event.preventDefault();
                        onDropCreatureSlot(slotIndex);
                      } : undefined}
                      onDragOver={isInteractive ? (event) => onDragOverCreatureSlot(event, slotIndex) : undefined}
                      className={`grid h-[196px] min-w-[133px] max-w-[133px] place-items-center rounded-lg border border-dashed text-xs text-slate-300 ${slotClass}`}
                    >
                      Vazio
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
