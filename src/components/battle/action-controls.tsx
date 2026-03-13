import type { ActionMode, PlayerSide } from "./types";

type ActionControlsProps = {
  actionMode: ActionMode;
  currentTurn: PlayerSide;
  onSetMode: (mode: ActionMode) => void;
  onEndTurn: () => void;
  onCancelAction: () => void;
};

function buttonClass(isActive: boolean): string {
  return `rounded-md border px-3 py-2 text-sm transition-colors ${isActive
    ? "border-sky-300 bg-sky-500/35 text-sky-100"
    : "border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
    }`;
}

export function ActionControls({ actionMode, currentTurn, onSetMode, onEndTurn, onCancelAction }: ActionControlsProps) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-100">Ações</h4>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass(actionMode === "attack")} onClick={() => onSetMode("attack")}>Attack</button>
        <button type="button" className={buttonClass(actionMode === "mugic")} onClick={() => onSetMode("mugic")}>Use Mugic</button>
        <button type="button" className={buttonClass(actionMode === "battlegear")} onClick={() => onSetMode("battlegear")}>Equip Battlegear</button>
        <button type="button" className={buttonClass(false)} onClick={onEndTurn}>End Turn</button>
        <button type="button" className={buttonClass(false)} onClick={onCancelAction}>Cancel Action</button>
      </div>
    </section>
  );
}
