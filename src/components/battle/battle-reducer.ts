import type {
  AttackCard,
  BattleAction,
  BattleFormat,
  BattleState,
  Creature,
  PlayerBattleState,
  PlayerSide,
} from "./types";

function getOpponentSide(side: PlayerSide): PlayerSide {
  return side === "bottom" ? "top" : "bottom";
}

function getPlayerBySide(state: BattleState, side: PlayerSide): PlayerBattleState {
  return side === "top" ? state.topPlayer : state.bottomPlayer;
}

function setPlayerBySide(state: BattleState, side: PlayerSide, player: PlayerBattleState): BattleState {
  if (side === "top") {
    return {
      ...state,
      topPlayer: player,
    };
  }

  return {
    ...state,
    bottomPlayer: player,
  };
}

function getCreatureById(creatures: Creature[], creatureId: string): Creature | undefined {
  return creatures.find((creature) => creature.id === creatureId);
}

function getActiveCreature(player: PlayerBattleState, activeCreatureId: string | null): Creature | undefined {
  if (!activeCreatureId) {
    return player.creatures.find((creature) => !creature.isDefeated);
  }

  return player.creatures.find((creature) => creature.id === activeCreatureId);
}

function computeWinner(state: BattleState): PlayerSide | null {
  const topAlive = state.topPlayer.creatures.some((creature) => !creature.isDefeated);
  const bottomAlive = state.bottomPlayer.creatures.some((creature) => !creature.isDefeated);

  if (!topAlive) {
    return "bottom";
  }

  if (!bottomAlive) {
    return "top";
  }

  return null;
}

function consumeAttack(player: PlayerBattleState, attackCardId: string): { player: PlayerBattleState; card: AttackCard | null } {
  const card = player.attacksDeck.find((attack) => attack.id === attackCardId) ?? null;

  if (!card) {
    return { player, card: null };
  }

  return {
    player: {
      ...player,
      attacksDeck: player.attacksDeck.filter((attack) => attack.id !== attackCardId),
    },
    card,
  };
}

function pickAutoAttack(player: PlayerBattleState): AttackCard | null {
  return player.attacksDeck[0] ?? null;
}

function resolveDamage(creature: Creature, damage: number): Creature {
  const nextEnergy = creature.energy - damage;
  const isDefeated = nextEnergy <= 0;

  return {
    ...creature,
    energy: Math.max(0, nextEnergy),
    health: isDefeated ? 0 : creature.health,
    isDefeated,
    battlegearEquipped: isDefeated ? null : creature.battlegearEquipped,
  };
}

function replaceCreature(player: PlayerBattleState, updated: Creature): PlayerBattleState {
  const creatures = player.creatures.map((creature) => (creature.id === updated.id ? updated : creature));
  const defeatedBefore = player.creatures.filter((creature) => creature.isDefeated).length;
  const defeatedAfter = creatures.filter((creature) => creature.isDefeated).length;

  return {
    ...player,
    creatures,
    defeatedCreatures: player.defeatedCreatures + Math.max(0, defeatedAfter - defeatedBefore),
  };
}

function nextAliveCreatureId(player: PlayerBattleState): string | null {
  return player.creatures.find((creature) => !creature.isDefeated)?.id ?? null;
}

export function calculateBattleXp(defeatedCreatures: number, format: BattleFormat): number {
  return defeatedCreatures * 50 + format * 25;
}

export function battleReducer(state: BattleState, action: BattleAction): BattleState {
  switch (action.type) {
    case "INIT_BATTLE":
      return action.state;

    case "SET_FORMAT":
      return {
        ...state,
        format: action.format,
      };

    case "SET_ACTION_MODE":
      if (state.winner) {
        return state;
      }

      return {
        ...state,
        actionMode: action.mode,
      };

    case "SET_ACTIVE_CREATURE": {
      const player = getPlayerBySide(state, action.side);
      const creature = getCreatureById(player.creatures, action.creatureId);

      if (!creature || creature.isDefeated) {
        return state;
      }

      return {
        ...state,
        activeCreatureBySide: {
          ...state.activeCreatureBySide,
          [action.side]: action.creatureId,
        },
      };
    }

    case "START_DRAG":
      return {
        ...state,
        dragItem: action.item,
      };

    case "END_DRAG":
      return {
        ...state,
        dragItem: null,
      };

    case "DROP_ATTACK_IN_ARENA": {
      if (state.winner) {
        return state;
      }

      if (state.currentTurn !== action.side) {
        return {
          ...state,
          lastCombatResult: "Não é o turno desse jogador.",
          dragItem: null,
        };
      }

      const attacker = getPlayerBySide(state, action.side);
      const defenderSide = getOpponentSide(action.side);
      const defender = getPlayerBySide(state, defenderSide);

      const attackerSelection = consumeAttack(attacker, action.attackCardId);
      const defenderAutoAttack = pickAutoAttack(defender);

      if (!attackerSelection.card || !defenderAutoAttack) {
        return {
          ...state,
          lastCombatResult: "Ataque inválido ou sem cartas disponíveis.",
          dragItem: null,
        };
      }

      const defenderSelection = consumeAttack(defender, defenderAutoAttack.id);

      if (!defenderSelection.card) {
        return {
          ...state,
          lastCombatResult: "Oponente sem carta de ataque para responder.",
          dragItem: null,
        };
      }

      const attackerActive = getActiveCreature(attackerSelection.player, state.activeCreatureBySide[action.side]);
      const defenderActive = getActiveCreature(defenderSelection.player, state.activeCreatureBySide[defenderSide]);

      if (!attackerActive || !defenderActive || attackerActive.isDefeated || defenderActive.isDefeated) {
        return {
          ...state,
          lastCombatResult: "Selecione criaturas ativas válidas para atacar.",
          dragItem: null,
        };
      }

      const defenderAfterDamage = resolveDamage(defenderActive, attackerSelection.card.damage);
      const attackerAfterDamage = resolveDamage(attackerActive, defenderSelection.card.damage);

      let nextAttacker = replaceCreature(attackerSelection.player, attackerAfterDamage);
      let nextDefender = replaceCreature(defenderSelection.player, defenderAfterDamage);

      const activeCreatureBySide: BattleState["activeCreatureBySide"] = {
        ...state.activeCreatureBySide,
      };

      let nextLocationIndex = state.activeLocationIndex;
      const someoneDefeated = attackerAfterDamage.isDefeated || defenderAfterDamage.isDefeated;

      if (attackerAfterDamage.isDefeated) {
        activeCreatureBySide[action.side] = nextAliveCreatureId(nextAttacker);
      }

      if (defenderAfterDamage.isDefeated) {
        activeCreatureBySide[defenderSide] = nextAliveCreatureId(nextDefender);
      }

      if (someoneDefeated) {
        nextLocationIndex = Math.min(
          nextLocationIndex + 1,
          Math.min(nextAttacker.locationsDeck.length, nextDefender.locationsDeck.length) - 1,
        );
      }

      let nextState = setPlayerBySide(state, action.side, nextAttacker);
      nextState = setPlayerBySide(nextState, defenderSide, nextDefender);

      const winner = computeWinner(nextState);

      return {
        ...nextState,
        activeCreatureBySide,
        activeLocationIndex: nextLocationIndex,
        selectedAttackBySide: {
          [action.side]: attackerSelection.card,
          [defenderSide]: defenderSelection.card,
        },
        currentTurn: defenderSide,
        turnNumber: state.turnNumber + 1,
        actionMode: "idle",
        dragItem: null,
        winner,
        lastCombatResult:
          `${attackerSelection.card.name} vs ${defenderSelection.card.name}. ` +
          `${attackerSelection.player.name} causou ${attackerSelection.card.damage} de dano e ` +
          `${defenderSelection.player.name} causou ${defenderSelection.card.damage}.`,
      };
    }

    case "DROP_MUGIC_ON_CREATURE": {
      if (state.winner) {
        return state;
      }

      if (state.currentTurn !== action.side) {
        return {
          ...state,
          lastCombatResult: "Só o jogador do turno pode usar Mugic.",
          dragItem: null,
        };
      }

      const player = getPlayerBySide(state, action.side);
      const mugic = player.mugicDeck.find((item) => item.id === action.mugicId);
      const creature = getCreatureById(player.creatures, action.creatureId);

      if (!mugic || !creature || creature.isDefeated || creature.mugicUsed >= creature.mugicCounterMax) {
        return {
          ...state,
          lastCombatResult: "Mugic inválida para a criatura selecionada.",
          dragItem: null,
        };
      }

      const updatedCreature: Creature = {
        ...creature,
        mugicUsed: creature.mugicUsed + 1,
        health: Math.min(creature.maxHealth, creature.health + mugic.power),
      };

      const updatedPlayer: PlayerBattleState = {
        ...replaceCreature(player, updatedCreature),
        mugicDeck: player.mugicDeck.filter((item) => item.id !== action.mugicId),
      };

      return {
        ...setPlayerBySide(state, action.side, updatedPlayer),
        lastCombatResult: `${updatedPlayer.name} usou ${mugic.name} em ${updatedCreature.name}.`,
        dragItem: null,
      };
    }

    case "DROP_BATTLEGEAR_ON_CREATURE": {
      if (state.winner) {
        return state;
      }

      if (state.currentTurn !== action.side) {
        return {
          ...state,
          lastCombatResult: "Só o jogador do turno pode equipar Battlegear.",
          dragItem: null,
        };
      }

      const player = getPlayerBySide(state, action.side);
      const gear = player.battlegearDeck.find((item) => item.id === action.battlegearId);
      const creature = getCreatureById(player.creatures, action.creatureId);

      if (!gear || !creature || creature.isDefeated || creature.battlegearEquipped) {
        return {
          ...state,
          lastCombatResult: "Battlegear inválido para a criatura selecionada.",
          dragItem: null,
        };
      }

      const updatedCreature: Creature = {
        ...creature,
        battlegearEquipped: gear,
        maxEnergy: creature.maxEnergy + gear.bonusEnergy,
        energy: creature.energy + gear.bonusEnergy,
      };

      const updatedPlayer: PlayerBattleState = {
        ...replaceCreature(player, updatedCreature),
        battlegearDeck: player.battlegearDeck.filter((item) => item.id !== action.battlegearId),
      };

      return {
        ...setPlayerBySide(state, action.side, updatedPlayer),
        lastCombatResult: `${updatedPlayer.name} equipou ${gear.name} em ${updatedCreature.name}.`,
        dragItem: null,
      };
    }

    case "CANCEL_ACTION":
      return {
        ...state,
        actionMode: "idle",
        dragItem: null,
      };

    case "END_TURN": {
      if (state.winner) {
        return state;
      }

      const nextTurn = getOpponentSide(state.currentTurn);

      return {
        ...state,
        currentTurn: nextTurn,
        actionMode: "idle",
        dragItem: null,
        turnNumber: state.turnNumber + 1,
      };
    }

    default:
      return state;
  }
}
