import type { DragEvent } from "react";
import type { Creature } from "./types";

type CreatureCardProps = {
  creature: Creature;
  isActive: boolean;
  dropStatus: "valid" | "invalid" | "neutral";
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onSelect: () => void;
  onDrop: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
};

function dropStatusClass(status: CreatureCardProps["dropStatus"]): string {
  if (status === "valid") {
    return "ring-2 ring-emerald-400";
  }

  if (status === "invalid") {
    return "ring-2 ring-red-400";
  }

  return "";
}

export function CreatureCard({ creature, isActive, dropStatus, onDragStart, onDragEnd, onSelect, onDrop, onDragOver }: CreatureCardProps) {
  const energyPercent = creature.maxEnergy > 0 ? (creature.energy / creature.maxEnergy) * 100 : 0;
  const energyLabel = `${creature.energy}/${creature.maxEnergy}`;

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center gap-2">
        <div className="flex justify-center">
          <div className="flex gap-1">
            {Array.from({ length: creature.mugicCounterMax }).map((_, index) => {
              const filled = index < creature.mugicUsed;
              return (
                <span
                  key={`${creature.id}-mugic-${index}`}
                  className={`h-2.5 w-2.5 rounded-full ${filled ? "bg-fuchsia-400" : "bg-slate-600"}`}
                />
              );
            })}
          </div>
        </div>

        <div
          className={`relative flex h-[196px] min-w-[133px] max-w-[133px] flex-col overflow-hidden rounded-lg border border-slate-600 bg-slate-800 p-2 transition-all duration-300 ${isActive ? "shadow-[0_0_0_2px_rgba(56,189,248,0.8)]" : ""
            } ${creature.isDefeated ? "grayscale opacity-60" : ""} ${dropStatusClass(dropStatus)}`}
          draggable={Boolean(onDragStart)}
          onDragStart={() => onDragStart?.()}
          onDragEnd={() => onDragEnd?.()}
          onClick={onSelect}
          onDrop={(event) => {
            event.preventDefault();
            onDrop();
          }}
          onDragOver={onDragOver}
        >
          <img
            src={creature.imageUrl}
            alt={creature.name}
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="pointer-events-none absolute inset-2 rounded-md border border-slate-700/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/20 to-slate-950/60" />

          <div className="relative z-10 mb-2 flex items-center justify-between gap-2">
            <p className="line-clamp-1 text-xs font-semibold text-slate-100">{creature.name}</p>
            {creature.isDefeated ? <span className="text-[10px] text-red-300">X</span> : null}
          </div>

          <div className="relative z-10 mt-auto flex items-center justify-end">
            <div className="text-[10px] text-slate-200">
              {creature.battlegearEquipped ? "⚙" : "-"}
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex h-20 w-12 items-end overflow-hidden rounded border border-slate-500 bg-slate-900/70">
        <div
          className="w-full rounded-none bg-sky-500/85 transition-all duration-500"
          style={{ height: `${Math.max(0, Math.min(100, energyPercent))}%` }}
        />
        <span className="pointer-events-none absolute inset-0 grid place-items-center px-1 text-center text-[10px] font-semibold text-slate-100">
          {energyLabel}
        </span>
      </div>
    </div>
  );
}
