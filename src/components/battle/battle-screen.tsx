"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import type { DeckDto, ListDeckOverviewResponseDto } from "@/dto/deck";
import { ActionControls } from "./action-controls";
import { ActiveLocationBanner } from "./active-location-banner";
import { battleReducer, calculateBattleXp } from "./battle-reducer";
import { HandPanel } from "./hand-panel";
import { PlayerPanel } from "./player-panel";
import { BattleService } from "@/lib/api/services/battle.service";
import type { ActionMode, BattleFormat, BattleSetupResponseDto, BattleState, Creature, PlayerBattleState, PlayerSide } from "./types";

type BattleScreenProps = {
  initialFormat?: BattleFormat;
  initialDeckId?: string | null;
};

function parseFormat(value: BattleFormat | undefined): BattleFormat {
  if (value === 1 || value === 3 || value === 6 || value === 10) {
    return value;
  }

  return 3;
}

function totalsPercent(player: PlayerBattleState): { health: number; energy: number } {
  const totalMaxHealth = player.creatures.reduce((sum, creature) => sum + creature.maxHealth, 0);
  const totalHealth = player.creatures.reduce((sum, creature) => sum + creature.health, 0);
  const totalMaxEnergy = player.creatures.reduce((sum, creature) => sum + creature.maxEnergy, 0);
  const totalEnergy = player.creatures.reduce((sum, creature) => sum + creature.energy, 0);

  return {
    health: totalMaxHealth > 0 ? (totalHealth / totalMaxHealth) * 100 : 0,
    energy: totalMaxEnergy > 0 ? (totalEnergy / totalMaxEnergy) * 100 : 0,
  };
}

function createEmptyCreatureSlots(size: number): Array<string | null> {
  return Array.from({ length: Math.max(0, size) }, () => null);
}

export function BattleScreen({ initialFormat = 3, initialDeckId = null }: BattleScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(true);
  const [setupMode, setSetupMode] = useState<"deck" | "collection">("collection");
  const [availableDecks, setAvailableDecks] = useState<DeckDto[]>([]);
  const [selectedDeckOptionId, setSelectedDeckOptionId] = useState<string | null>(initialDeckId);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [bottomCreatureSlots, setBottomCreatureSlots] = useState<Array<string | null>>([]);
  const [isOpponentRevealed, setIsOpponentRevealed] = useState(false);
  const [state, dispatch] = useReducer(battleReducer, {
    format: parseFormat(initialFormat),
    topPlayer: {
      id: "top-empty",
      name: "Oponente",
      avatar: "🛡️",
      creatures: [],
      attacksDeck: [],
      mugicDeck: [],
      battlegearDeck: [],
      locationsDeck: [],
      defeatedCreatures: 0,
    },
    bottomPlayer: {
      id: "bottom-empty",
      name: "Você",
      avatar: "⚔️",
      creatures: [],
      attacksDeck: [],
      mugicDeck: [],
      battlegearDeck: [],
      locationsDeck: [],
      defeatedCreatures: 0,
    },
    activeLocationIndex: 0,
    currentTurn: "bottom",
    turnNumber: 1,
    actionMode: "idle",
    selectedAttackBySide: {},
    lastCombatResult: null,
    dragItem: null,
    activeCreatureBySide: { top: null, bottom: null },
    winner: null,
  } as BattleState);

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      setIsLoadingOptions(true);

      try {
        const response = await fetch("/api/users/decks", {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json()) as ListDeckOverviewResponseDto;

        if (!response.ok || !payload.success || !payload.overview) {
          throw new Error(payload.message ?? "Não foi possível carregar decks.");
        }

        if (cancelled) {
          return;
        }

        const decks = payload.overview.decks ?? [];
        setAvailableDecks(decks);

        if (initialDeckId && decks.some((deck) => deck.id === initialDeckId)) {
          setSetupMode("deck");
          setSelectedDeckOptionId(initialDeckId);
          return;
        }

        if (decks.length > 0) {
          setSetupMode("collection");
          setSelectedDeckOptionId(decks[0].id);
        } else {
          setSetupMode("collection");
          setSelectedDeckOptionId(null);
        }
      } catch {
        if (!cancelled) {
          setAvailableDecks([]);
          setSetupMode("collection");
          setSelectedDeckOptionId(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOptions(false);
          setIsLoading(false);
        }
      }
    };

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [initialDeckId]);

  const handleLoadBattle = async () => {
    setIsLoading(true);
    setSetupError(null);

    try {
      const payload = await BattleService.getSetup({
        format: parseFormat(initialFormat),
        mode: setupMode,
        deckId: setupMode === "deck" ? selectedDeckOptionId : null,
      });

      if (!payload.success || !payload.state) {
        throw new Error(payload.message ?? "Não foi possível carregar a batalha.");
      }

      dispatch({ type: "INIT_BATTLE", state: payload.state });
      setBottomCreatureSlots(createEmptyCreatureSlots(payload.state.format));
      setShowSetupModal(false);
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : "Erro ao carregar batalha.");
      setShowSetupModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPlayerSide = state.currentTurn;
  const activeLocation = state.bottomPlayer.locationsDeck[state.activeLocationIndex];
  const defeatedCreatures = state.topPlayer.defeatedCreatures;
  const gainedXp = calculateBattleXp(defeatedCreatures, state.format);
  const placedBottomCreatureIds = new Set(bottomCreatureSlots.filter((id): id is string => Boolean(id)));
  const bottomCreatureById = new Map(state.bottomPlayer.creatures.map((creature) => [creature.id, creature]));
  const bottomPlacedCreatures = bottomCreatureSlots.map((creatureId) => (creatureId ? bottomCreatureById.get(creatureId) ?? null : null));
  const bottomHandCreatures = state.bottomPlayer.creatures.filter((creature) => !placedBottomCreatureIds.has(creature.id));
  const topCreatureSlots = state.topPlayer.creatures.map((creature) => creature);

  const canPerformAction = (side: PlayerSide, mode: ActionMode): boolean => {
    if (state.winner) {
      return false;
    }

    return state.currentTurn === side && state.actionMode === mode;
  };

  const creatureDropStatus = (panelSide: PlayerSide, creature: Creature): "valid" | "invalid" | "neutral" => {
    if (!state.dragItem) {
      return "neutral";
    }

    if (state.dragItem.type === "mugic") {
      if (!canPerformAction(state.dragItem.side, "mugic") || state.dragItem.side !== panelSide) {
        return "invalid";
      }

      if (creature.isDefeated || creature.mugicUsed >= creature.mugicCounterMax) {
        return "invalid";
      }

      return "valid";
    }

    if (state.dragItem.type === "battlegear") {
      if (!canPerformAction(state.dragItem.side, "battlegear") || state.dragItem.side !== panelSide) {
        return "invalid";
      }

      if (creature.isDefeated || Boolean(creature.battlegearEquipped)) {
        return "invalid";
      }

      return "valid";
    }

    return "invalid";
  };

  const creatureSlotDropStatus = (slotIndex: number): "valid" | "invalid" | "neutral" => {
    if (!state.dragItem) {
      return "neutral";
    }

    if (state.dragItem.type !== "creature" || state.dragItem.side !== "bottom") {
      return "invalid";
    }

    if (slotIndex < 0 || slotIndex >= bottomCreatureSlots.length) {
      return "invalid";
    }

    if (bottomCreatureSlots[slotIndex]) {
      return "invalid";
    }

    return "valid";
  };

  const arenaDropStatus = useMemo(() => {
    if (!state.dragItem) {
      return "neutral";
    }

    if (state.dragItem.type !== "attack") {
      return "invalid";
    }

    if (canPerformAction(state.dragItem.side, "attack")) {
      return "valid";
    }

    return "invalid";
  }, [state.dragItem, state.actionMode, state.currentTurn, state.winner]);

  if (isLoading && !showSetupModal) {
    return (
      <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-3 p-3 text-slate-100 md:p-4">
        <section className="rounded-xl border border-slate-700 bg-slate-900/80 p-6 text-center text-slate-200">
          Carregando batalha com deck real...
        </section>
      </main>
    );
  }

  if (setupError && !showSetupModal) {
    return (
      <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-3 p-3 text-slate-100 md:p-4">
        <section className="rounded-xl border border-red-500/60 bg-red-950/40 p-6 text-center text-red-200">
          {setupError}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-2 p-2 text-slate-200">
      <section className="relative left-1/2 grid w-screen -translate-x-1/2 grid-cols-[40%_1fr] items-start gap-2 px-2">
        <header className="grid gap-2 rounded-xl border border-slate-700 bg-slate-900/80 p-2 sm:grid-cols-[auto_1fr] sm:items-center">
          <h1 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Battle Screen</h1>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-sky-200/80">Turno</p>
              <p className="text-sm font-semibold text-sky-100">#{state.turnNumber}</p>
            </div>
            <div className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-emerald-200/80">Jogador atual</p>
              <p className="text-sm font-semibold text-emerald-100">{currentPlayerSide === "bottom" ? "Você" : "Oponente"}</p>
            </div>
          </div>
        </header>

        <ActionControls
          actionMode={state.actionMode}
          currentTurn={state.currentTurn}
          onSetMode={(mode) => dispatch({ type: "SET_ACTION_MODE", mode })}
          onEndTurn={() => dispatch({ type: "END_TURN" })}
          onCancelAction={() => dispatch({ type: "CANCEL_ACTION" })}
        />
      </section>

      <section className="relative left-1/2 grid w-screen -translate-x-1/2 items-start justify-items-start gap-2 px-2">
        <ActiveLocationBanner location={activeLocation ?? null} large />
      </section>

      <section className="relative left-1/2 grid w-screen -translate-x-1/2 items-start justify-items-start gap-2 px-2 md:grid-cols-[1fr_260px]">
        <footer className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-200">
          <p>{state.lastCombatResult ?? "Arraste cartas para começar."}</p>
          {state.winner ? (
            <p className="mt-1 font-semibold text-emerald-300">
              Vitória de {state.winner === "bottom" ? "Você" : "Oponente"}. XP ganho: {gainedXp}
            </p>
          ) : null}
        </footer>

        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3">
          <div
            className={`grid min-h-[150px] place-items-center rounded-xl border border-dashed p-3 transition-colors ${arenaDropStatus === "valid"
              ? "border-emerald-400 bg-emerald-500/10"
              : arenaDropStatus === "invalid"
                ? "border-red-400 bg-red-500/10"
                : "border-slate-600 bg-slate-800/60"
              }`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();

              if (!state.dragItem || state.dragItem.type !== "attack") {
                return;
              }

              dispatch({
                type: "DROP_ATTACK_IN_ARENA",
                side: state.dragItem.side,
                attackCardId: state.dragItem.cardId,
              });
            }}
          >
            <div className="text-center">
              <p className="text-sm font-semibold">Arena de combate</p>
              <p className="mt-1 text-xs text-slate-300">Arraste Attack para iniciar o combate e revelar cartas simultaneamente.</p>
              {state.selectedAttackBySide.bottom || state.selectedAttackBySide.top ? (
                <p className="mt-2 text-xs text-slate-200">
                  Último combate: {state.selectedAttackBySide.bottom?.name ?? "-"} vs {state.selectedAttackBySide.top?.name ?? "-"}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className={`relative left-1/2 grid w-screen -translate-x-1/2 gap-3 px-2 ${isOpponentRevealed ? "md:grid-cols-2" : ""}`}>
        <PlayerPanel
          side="bottom"
          player={state.bottomPlayer}
          activeCreatureId={state.activeCreatureBySide.bottom}
          creatureSlots={bottomPlacedCreatures}
          isCurrentTurn={state.currentTurn === "bottom"}
          showCloseDeckButton={!isOpponentRevealed}
          onCloseDeck={() => setIsOpponentRevealed(true)}
          onDragStartCreature={(creatureId) => dispatch({ type: "START_DRAG", item: { type: "creature", side: "bottom", cardId: creatureId } })}
          onDragEndCreature={() => dispatch({ type: "END_DRAG" })}
          onSelectCreature={(creatureId) => dispatch({ type: "SET_ACTIVE_CREATURE", side: "bottom", creatureId })}
          onDropCreature={(creatureId) => {
            if (!state.dragItem) {
              return;
            }

            if (state.dragItem.type === "mugic") {
              dispatch({ type: "DROP_MUGIC_ON_CREATURE", side: "bottom", creatureId, mugicId: state.dragItem.cardId });
              return;
            }

            if (state.dragItem.type === "battlegear") {
              dispatch({ type: "DROP_BATTLEGEAR_ON_CREATURE", side: "bottom", creatureId, battlegearId: state.dragItem.cardId });
            }
          }}
          onDropCreatureSlot={(slotIndex) => {
            if (!state.dragItem || state.dragItem.type !== "creature" || state.dragItem.side !== "bottom") {
              return;
            }

            if (slotIndex < 0 || slotIndex >= bottomCreatureSlots.length || bottomCreatureSlots[slotIndex]) {
              return;
            }

            const creatureId = state.dragItem.cardId;

            setBottomCreatureSlots((previous) => {
              const next = [...previous];
              const previousIndex = next.findIndex((slotCreatureId) => slotCreatureId === creatureId);

              if (previousIndex >= 0) {
                next[previousIndex] = null;
              }

              next[slotIndex] = creatureId;
              return next;
            });

            dispatch({ type: "SET_ACTIVE_CREATURE", side: "bottom", creatureId });
            dispatch({ type: "END_DRAG" });
          }}
          onDragOverCreatureSlot={(event) => event.preventDefault()}
          getCreatureSlotDropStatus={creatureSlotDropStatus}
          onDropMugicSlot={() => {
            if (!state.dragItem || state.dragItem.type !== "mugic") {
              return;
            }

            const placedCreatureIds = bottomCreatureSlots.filter((creatureId): creatureId is string => Boolean(creatureId));

            const targetCreatureId = state.activeCreatureBySide.bottom
              && placedCreatureIds.includes(state.activeCreatureBySide.bottom)
              ? state.activeCreatureBySide.bottom
              : placedCreatureIds[0] ?? null;

            if (!targetCreatureId) {
              return;
            }

            const targetCreature = state.bottomPlayer.creatures.find((creature) => creature.id === targetCreatureId);

            if (!targetCreature || targetCreature.isDefeated) {
              return;
            }

            dispatch({ type: "DROP_MUGIC_ON_CREATURE", side: "bottom", creatureId: targetCreatureId, mugicId: state.dragItem.cardId });
          }}
          onDragOverCreature={(event) => event.preventDefault()}
          onDragOverMugicSlot={(event) => event.preventDefault()}
          getDropStatus={(creature) => creatureDropStatus("bottom", creature)}
        />

        {isOpponentRevealed ? (
          <PlayerPanel
            side="top"
            player={state.topPlayer}
            activeCreatureId={state.activeCreatureBySide.top}
            creatureSlots={topCreatureSlots}
            isCurrentTurn={state.currentTurn === "top"}
            isInteractive={false}
            onDragStartCreature={() => undefined}
            onDragEndCreature={() => undefined}
            onSelectCreature={() => undefined}
            onDropCreature={() => undefined}
            onDragOverCreature={() => undefined}
            onDropCreatureSlot={() => undefined}
            onDragOverCreatureSlot={() => undefined}
            getCreatureSlotDropStatus={() => "neutral"}
            onDropMugicSlot={() => undefined}
            onDragOverMugicSlot={() => undefined}
            getDropStatus={() => "neutral"}
          />
        ) : null}

      </section>

      <section className="relative left-1/2 grid w-screen -translate-x-1/2 grid-cols-[1fr_auto_1fr] gap-4 px-2">        <HandPanel
        side="bottom"
        currentTurn={state.currentTurn}
        actionMode={state.actionMode}
        creatures={bottomHandCreatures}
        attacks={state.bottomPlayer.attacksDeck}
        mugics={state.bottomPlayer.mugicDeck}
        battlegears={state.bottomPlayer.battlegearDeck}
        onDragStartCreature={(cardId) => dispatch({ type: "START_DRAG", item: { type: "creature", side: "bottom", cardId } })}
        onDropCreatureInHand={() => {
          if (!state.dragItem || state.dragItem.type !== "creature" || state.dragItem.side !== "bottom") {
            return;
          }

          const creatureId = state.dragItem.cardId;

          setBottomCreatureSlots((previous) => previous.map((slotCreatureId) => (slotCreatureId === creatureId ? null : slotCreatureId)));

          dispatch({ type: "END_DRAG" });
        }}
        onDragOverCreatureInHand={() => undefined}
        onDragStartAttack={(cardId) => dispatch({ type: "START_DRAG", item: { type: "attack", side: "bottom", cardId } })}
        onDragStartMugic={(cardId) => dispatch({ type: "START_DRAG", item: { type: "mugic", side: "bottom", cardId } })}
        onDragStartBattlegear={(cardId) => dispatch({ type: "START_DRAG", item: { type: "battlegear", side: "bottom", cardId } })}
        onDragEnd={() => dispatch({ type: "END_DRAG" })}
      />
      </section>

      {showSetupModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h2 className="text-lg font-semibold text-slate-100">Configuração da batalha</h2>
            <p className="mt-1 text-sm text-slate-300">Escolha como montar seu lado do campo antes de iniciar.</p>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => setSetupMode("deck")}
                disabled={availableDecks.length === 0}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm ${setupMode === "deck" ? "border-sky-400 bg-sky-500/20 text-sky-100" : "border-slate-600 bg-slate-800 text-slate-100"} ${availableDecks.length === 0 ? "cursor-not-allowed opacity-40" : ""}`}
              >
                Utilizar deck pronto
              </button>
              <button
                type="button"
                onClick={() => setSetupMode("collection")}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm ${setupMode === "collection" ? "border-sky-400 bg-sky-500/20 text-sky-100" : "border-slate-600 bg-slate-800 text-slate-100"}`}
              >
                Utilizar todas as cartas da coleção
              </button>
            </div>

            {setupMode === "deck" ? (
              <div className="mt-4">
                <label className="mb-1 block text-xs text-slate-300">Selecione o deck</label>
                <select
                  value={selectedDeckOptionId ?? ""}
                  onChange={(event) => setSelectedDeckOptionId(event.target.value || null)}
                  className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                >
                  {availableDecks.map((deck) => (
                    <option key={deck.id} value={deck.id}>{deck.name}</option>
                  ))}
                </select>
              </div>
            ) : null}

            {setupError ? <p className="mt-3 text-sm text-red-300">{setupError}</p> : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleLoadBattle}
                disabled={isLoading || isLoadingOptions || (setupMode === "deck" && !selectedDeckOptionId)}
                className="rounded-md border border-sky-400 bg-sky-500/20 px-4 py-2 text-sm text-sky-100 disabled:opacity-50"
              >
                {isLoading ? "Carregando..." : "Iniciar batalha"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
