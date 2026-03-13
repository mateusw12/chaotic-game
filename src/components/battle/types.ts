export type BattleFormat = 1 | 3 | 6 | 10;

export type PlayerSide = "top" | "bottom";

export type ActionMode = "idle" | "attack" | "mugic" | "battlegear";

export type AttackCard = {
  id: string;
  name: string;
  damage: number;
  imageUrl: string;
};

export type MugicCard = {
  id: string;
  name: string;
  power: number;
  imageUrl: string;
};

export type BattlegearCard = {
  id: string;
  name: string;
  bonusEnergy: number;
  imageUrl: string;
};

export type LocationCardData = {
  id: string;
  name: string;
  effect: string;
  imageUrl: string;
};

export type Creature = {
  id: string;
  name: string;
  imageUrl: string;
  maxHealth: number;
  health: number;
  maxEnergy: number;
  energy: number;
  mugicCounterMax: number;
  mugicUsed: number;
  battlegearEquipped: BattlegearCard | null;
  isDefeated: boolean;
};

export type PlayerBattleState = {
  id: string;
  name: string;
  avatar: string;
  creatures: Creature[];
  attacksDeck: AttackCard[];
  mugicDeck: MugicCard[];
  battlegearDeck: BattlegearCard[];
  locationsDeck: LocationCardData[];
  defeatedCreatures: number;
};

export type DragItem =
  | {
    type: "creature";
    side: PlayerSide;
    cardId: string;
  }
  | {
    type: "attack";
    side: PlayerSide;
    cardId: string;
  }
  | {
    type: "mugic";
    side: PlayerSide;
    cardId: string;
  }
  | {
    type: "battlegear";
    side: PlayerSide;
    cardId: string;
  }
  | null;

export type DropZoneKind = "arena" | "creature";

export type DropZoneState = {
  id: string;
  kind: DropZoneKind;
  side?: PlayerSide;
  creatureId?: string;
  status: "valid" | "invalid" | "neutral";
};

export type BattleState = {
  format: BattleFormat;
  topPlayer: PlayerBattleState;
  bottomPlayer: PlayerBattleState;
  activeLocationIndex: number;
  currentTurn: PlayerSide;
  turnNumber: number;
  actionMode: ActionMode;
  selectedAttackBySide: Partial<Record<PlayerSide, AttackCard>>;
  lastCombatResult: string | null;
  dragItem: DragItem;
  activeCreatureBySide: Record<PlayerSide, string | null>;
  winner: PlayerSide | null;
};

export type BattleAction =
  | { type: "INIT_BATTLE"; state: BattleState }
  | { type: "SET_FORMAT"; format: BattleFormat }
  | { type: "SET_ACTION_MODE"; mode: ActionMode }
  | { type: "SET_ACTIVE_CREATURE"; side: PlayerSide; creatureId: string }
  | { type: "START_DRAG"; item: Exclude<DragItem, null> }
  | { type: "END_DRAG" }
  | { type: "DROP_ATTACK_IN_ARENA"; side: PlayerSide; attackCardId: string }
  | { type: "DROP_MUGIC_ON_CREATURE"; side: PlayerSide; creatureId: string; mugicId: string }
  | { type: "DROP_BATTLEGEAR_ON_CREATURE"; side: PlayerSide; creatureId: string; battlegearId: string }
  | { type: "CANCEL_ACTION" }
  | { type: "END_TURN" };

export type BattleTotals = {
  healthPercent: number;
  energyPercent: number;
};

export type BattleSetupResponseDto = {
  success: boolean;
  state: BattleState | null;
  message?: string;
};
