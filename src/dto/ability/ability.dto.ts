import type { CreatureElement, CreatureTribe } from "@/dto/creature";
import { LOCATION_CARD_TYPES, type LocationCardType } from "@/dto/location";

export const ABILITY_CATEGORIES = ["support", "brainwashed", "activated", "innate"] as const;

export type AbilityCategory = (typeof ABILITY_CATEGORIES)[number];

export const ABILITY_EFFECT_TYPES = ["increase", "decrease", "special"] as const;

export type AbilityEffectType = (typeof ABILITY_EFFECT_TYPES)[number];

export const ABILITY_TARGET_SCOPES = [
    "all_creatures",
    "same_tribe",
    "enemy_only",
    "self",
    "same_side",
    "opposing_creatures",
] as const;

export type AbilityTargetScope = (typeof ABILITY_TARGET_SCOPES)[number];

export const ABILITY_STATS = [
    "power",
    "courage",
    "speed",
    "wisdom",
    "energy",
    "mugic",
    "all",
    "none",
] as const;

export type AbilityStat = (typeof ABILITY_STATS)[number];

export const ABILITY_DISCIPLINE_STATS = ["power", "courage", "speed", "wisdom", "energy"] as const;

export type AbilityDisciplineStat = (typeof ABILITY_DISCIPLINE_STATS)[number];

export const ABILITY_BATTLE_RULE_TYPES = [
    "stat_modifier",
    "discipline_tradeoff",
    "discard_mugic_random",
    "remove_mugic_counter",
    "move_bonus",
    "intercept_range",
    "board_movement",
    "action_resolution",
    "generic_special",
] as const;

export type AbilityBattleRuleType = (typeof ABILITY_BATTLE_RULE_TYPES)[number];

export const ABILITY_ACTION_TYPES = [
    "none",
    "move_creature",
    "relocate_creature",
    "swap_creatures",
    "gain_element",
    "lose_element",
    "modify_stats_map",
    "apply_status_effect",
    "discard_cards",
    "draw_cards",
    "remove_mugic_counter",
    "add_mugic_counter",
    "heal_damage",
    "deal_damage",
    "move_card_between_zones",
] as const;

export type AbilityActionType = (typeof ABILITY_ACTION_TYPES)[number];

export const ABILITY_BOARD_ACTION_TYPES = [
    "move",
    "relocate",
    "swap",
    "intercept",
] as const;

export type AbilityBoardActionType = (typeof ABILITY_BOARD_ACTION_TYPES)[number];

export const ABILITY_CARD_TYPES = LOCATION_CARD_TYPES;

export type AbilityCardType = LocationCardType;

export const ABILITY_TRIGGER_EVENTS = [
    "on_activate",
    "turn_start",
    "turn_end",
    "combat_start",
    "combat_end",
    "on_attack_damage_dealt",
    "on_attack_damage_taken",
    "on_mugic_played",
    "passive_continuous",
] as const;

export type AbilityTriggerEvent = (typeof ABILITY_TRIGGER_EVENTS)[number];

export const ABILITY_TRIGGER_SOURCES = ["self", "controller", "target", "opponent"] as const;

export type AbilityTriggerSource = (typeof ABILITY_TRIGGER_SOURCES)[number];

export const ABILITY_COST_KINDS = [
    "none",
    "sacrifice_stat",
    "discard_card",
    "pay_element",
    "sacrifice_self",
    "remove_mugic_counter",
] as const;

export type AbilityCostKind = (typeof ABILITY_COST_KINDS)[number];

export const ABILITY_COST_SOURCES = ["self", "controller", "target"] as const;

export type AbilityCostSource = (typeof ABILITY_COST_SOURCES)[number];

export const ABILITY_CONDITION_KINDS = [
    "none",
    "stat_compare",
    "all_controlled_creatures_stat_compare",
    "target_has_zero_any_discipline",
    "has_element",
    "zone_card_count_compare",
] as const;

export type AbilityConditionKind = (typeof ABILITY_CONDITION_KINDS)[number];

export const ABILITY_EFFECT_KINDS = [
    "none",
    "modify_stat",
    "heal_damage",
    "deal_damage",
    "remove_mugic_counter",
    "add_mugic_counter",
    "gain_element",
    "lose_element",
    "move_card_between_zones",
    "draw_cards",
    "discard_cards",
    "swap_creatures",
    "relocate_creature",
] as const;

export type AbilityEffectKind = (typeof ABILITY_EFFECT_KINDS)[number];

export const ABILITY_COMPARE_OPERATORS = ["==", "!=", ">", ">=", "<", "<="] as const;

export type AbilityCompareOperator = (typeof ABILITY_COMPARE_OPERATORS)[number];

export const ABILITY_ZONE_TYPES = [
    "deck",
    "hand",
    "discard_general",
    "discard_mugic",
    "battlefield",
] as const;

export type AbilityZoneType = (typeof ABILITY_ZONE_TYPES)[number];

export const ABILITY_EFFECT_TARGETS = [
    "self",
    "target",
    "controller",
    "opponent",
    "all_controlled_creatures",
] as const;

export type AbilityEffectTarget = (typeof ABILITY_EFFECT_TARGETS)[number];

export type AbilityPayloadPrimitive = string | number | boolean | null;

export type AbilityPayloadValue =
    | AbilityPayloadPrimitive
    | AbilityPayloadObject
    | AbilityPayloadValue[];

export type AbilityPayloadObject = {
    [key: string]: AbilityPayloadValue | undefined;
};

export type AbilityActionPayloadDto = AbilityPayloadObject;

export type AbilityGenericPayloadDto = AbilityPayloadObject;

export type AbilityTriggerDto = {
    event: AbilityTriggerEvent;
    source?: AbilityTriggerSource;
    oncePerTurn?: boolean;
};

export type AbilityCostDto = {
    kind: AbilityCostKind;
    source?: AbilityCostSource;
    stat?: AbilityStat;
    value?: number;
    element?: CreatureElement;
    cardType?: AbilityCardType;
    cardCount?: number;
    notes?: string | null;
};

export type AbilityConditionDto = {
    kind: AbilityConditionKind;
    scope?: "self" | "target" | "controller" | "opponent" | "all_controlled_creatures";
    stat?: AbilityStat;
    operator?: AbilityCompareOperator;
    value?: number;
    element?: CreatureElement;
    zone?: AbilityZoneType;
    cardType?: AbilityCardType;
};

export type AbilityEffectDto = {
    kind: AbilityEffectKind;
    target?: AbilityEffectTarget;
    stat?: AbilityStat;
    value?: number;
    element?: CreatureElement;
    fromZone?: AbilityZoneType;
    toZone?: AbilityZoneType;
    cardType?: AbilityCardType;
    cardCount?: number;
    payload?: AbilityGenericPayloadDto | null;
};

export type AbilityBattleRuleDto = {
    type: AbilityBattleRuleType;
    requiresTarget: boolean;
    usageLimitPerTurn: number | null;
    targetTribes?: CreatureTribe[];
    stats?: AbilityStat[];
    cardTypes?: AbilityCardType[];
    actionType?: AbilityActionType;
    boardActionType?: AbilityBoardActionType;
    trigger?: AbilityTriggerDto;
    costs?: AbilityCostDto[];
    conditions?: AbilityConditionDto[];
    effects?: AbilityEffectDto[];
    actionPayload?: AbilityActionPayloadDto | null;
    payload?: AbilityGenericPayloadDto | null;
    chooseIncreaseFrom?: AbilityDisciplineStat[];
    chooseDecreaseFrom?: AbilityDisciplineStat[];
    increaseValue?: number;
    decreaseValue?: number;
    ownMugicCardsToDiscard?: number;
    targetMugicCardsRandomDiscard?: number;
    moveBonusCells?: number;
    movementMinCells?: number;
    movementMaxCells?: number;
    notes?: string | null;
};

export const ABILITY_CATEGORY_OPTIONS: Array<{
    value: AbilityCategory;
    label: string;
    description: string;
}> = [
        {
            value: "support",
            label: "Support",
            description: "Habilidade de suporte aplicada em sinergia de batalha.",
        },
        {
            value: "brainwashed",
            label: "Brainwashed",
            description: "Habilidade de efeito mental/controle no combate.",
        },
        {
            value: "activated",
            label: "Activated",
            description: "Habilidade ativada durante o combate.",
        },
        {
            value: "innate",
            label: "Innate",
            description: "Habilidade inata/passiva da criatura.",
        },
    ];

export const ABILITY_EFFECT_TYPE_OPTIONS: Array<{
    value: AbilityEffectType;
    label: string;
    description: string;
}> = [
        {
            value: "increase",
            label: "Aumentar",
            description: "Aplica bônus no atributo alvo.",
        },
        {
            value: "decrease",
            label: "Diminuir",
            description: "Aplica redução no atributo alvo.",
        },
        {
            value: "special",
            label: "Especial",
            description: "Aplica um efeito especial não numérico.",
        },
    ];

export const ABILITY_TARGET_SCOPE_OPTIONS: Array<{
    value: AbilityTargetScope;
    label: string;
    description: string;
}> = [
        {
            value: "all_creatures",
            label: "Todas as criaturas",
            description: "Aplica o efeito em todas as criaturas da batalha.",
        },
        {
            value: "same_tribe",
            label: "Somente da mesma tribo",
            description: "Aplica o efeito apenas em criaturas da mesma tribo.",
        },
        {
            value: "enemy_only",
            label: "Somente adversárias",
            description: "Aplica o efeito somente nas criaturas adversárias.",
        },
        {
            value: "self",
            label: "A própria criatura",
            description: "Aplica o efeito apenas na própria criatura.",
        },
        {
            value: "same_side",
            label: "Mesmo lado",
            description: "Aplica o efeito em criaturas no mesmo lado do tabuleiro.",
        },
        {
            value: "opposing_creatures",
            label: "Criaturas oponentes",
            description: "Aplica o efeito apenas em criaturas oponentes.",
        },
    ];

export const ABILITY_STAT_OPTIONS: Array<{
    value: AbilityStat;
    label: string;
}> = [
        { value: "power", label: "Poder" },
        { value: "courage", label: "Coragem" },
        { value: "speed", label: "Velocidade" },
        { value: "wisdom", label: "Sabedoria" },
        { value: "energy", label: "Energia" },
        { value: "mugic", label: "Mugic" },
        { value: "all", label: "Todos" },
        { value: "none", label: "Nenhum" },
    ];

export const ABILITY_BATTLE_RULE_TYPE_OPTIONS: Array<{
    value: AbilityBattleRuleType;
    label: string;
}> = [
        { value: "stat_modifier", label: "Modificador de atributo" },
        { value: "discipline_tradeoff", label: "Troca de disciplinas" },
        { value: "discard_mugic_random", label: "Descarte de Mugic aleatório" },
        { value: "remove_mugic_counter", label: "Remover contador de Mugic" },
        { value: "move_bonus", label: "Bônus de movimento" },
        { value: "intercept_range", label: "Interceptar alcance" },
        { value: "board_movement", label: "Ação de movimento no tabuleiro" },
        { value: "action_resolution", label: "Resolução de ação" },
        { value: "generic_special", label: "Especial genérico" },
    ];

export const ABILITY_ACTION_TYPE_OPTIONS: Array<{
    value: AbilityActionType;
    label: string;
}> = [
        { value: "none", label: "Nenhuma" },
        { value: "move_creature", label: "Mover criatura" },
        { value: "relocate_creature", label: "Realocar criatura" },
        { value: "swap_creatures", label: "Trocar criaturas" },
        { value: "gain_element", label: "Ganhar elemento" },
        { value: "lose_element", label: "Perder elemento" },
        { value: "modify_stats_map", label: "Modificar atributos" },
        { value: "apply_status_effect", label: "Aplicar status" },
        { value: "discard_cards", label: "Descartar cartas" },
        { value: "draw_cards", label: "Comprar cartas" },
    ];

export const ABILITY_BOARD_ACTION_TYPE_OPTIONS: Array<{
    value: AbilityBoardActionType;
    label: string;
}> = [
        { value: "move", label: "Mover" },
        { value: "relocate", label: "Realocar" },
        { value: "swap", label: "Trocar" },
        { value: "intercept", label: "Interceptar" },
    ];

export const ABILITY_CARD_TYPE_OPTIONS: Array<{
    value: AbilityCardType;
    label: string;
}> = [
        { value: "creature", label: "Criatura" },
        { value: "equipment", label: "Equipamento" },
        { value: "attack", label: "Ataque" },
        { value: "mugic", label: "Mugic" },
        { value: "location", label: "Local" },
    ];

export const ABILITY_TRIGGER_EVENT_OPTIONS: Array<{ value: AbilityTriggerEvent; label: string }> = [
    { value: "on_activate", label: "Ao ativar" },
    { value: "turn_start", label: "Início do turno" },
    { value: "turn_end", label: "Fim do turno" },
    { value: "combat_start", label: "Início do combate" },
    { value: "combat_end", label: "Fim do combate" },
    { value: "on_attack_damage_dealt", label: "Ao causar dano de ataque" },
    { value: "on_attack_damage_taken", label: "Ao receber dano de ataque" },
    { value: "on_mugic_played", label: "Ao jogar Mugic" },
    { value: "passive_continuous", label: "Passivo contínuo" },
];

export const ABILITY_TRIGGER_SOURCE_OPTIONS: Array<{ value: AbilityTriggerSource; label: string }> = [
    { value: "self", label: "Própria criatura" },
    { value: "controller", label: "Controlador" },
    { value: "target", label: "Alvo" },
    { value: "opponent", label: "Oponente" },
];

export const ABILITY_COST_KIND_OPTIONS: Array<{ value: AbilityCostKind; label: string }> = [
    { value: "none", label: "Nenhum" },
    { value: "sacrifice_stat", label: "Sacrificar atributo" },
    { value: "discard_card", label: "Descartar carta" },
    { value: "pay_element", label: "Pagar elemento" },
    { value: "sacrifice_self", label: "Sacrificar a própria criatura" },
    { value: "remove_mugic_counter", label: "Remover contador de Mugic" },
];

export const ABILITY_EFFECT_KIND_OPTIONS: Array<{ value: AbilityEffectKind; label: string }> = [
    { value: "none", label: "Nenhum" },
    { value: "modify_stat", label: "Modificar atributo" },
    { value: "heal_damage", label: "Curar dano" },
    { value: "deal_damage", label: "Causar dano" },
    { value: "remove_mugic_counter", label: "Remover contador de Mugic" },
    { value: "add_mugic_counter", label: "Adicionar contador de Mugic" },
    { value: "gain_element", label: "Ganhar elemento" },
    { value: "lose_element", label: "Perder elemento" },
    { value: "move_card_between_zones", label: "Mover carta entre zonas" },
    { value: "draw_cards", label: "Comprar cartas" },
    { value: "discard_cards", label: "Descartar cartas" },
    { value: "swap_creatures", label: "Trocar criaturas" },
    { value: "relocate_creature", label: "Realocar criatura" },
];

export const ABILITY_EFFECT_TARGET_OPTIONS: Array<{ value: AbilityEffectTarget; label: string }> = [
    { value: "self", label: "Própria criatura" },
    { value: "target", label: "Alvo" },
    { value: "controller", label: "Controlador" },
    { value: "opponent", label: "Oponente" },
    { value: "all_controlled_creatures", label: "Todas as criaturas controladas" },
];

export type AbilityDto = {
    id: string;
    name: string;
    category: AbilityCategory;
    effectType: AbilityEffectType;
    targetScope: AbilityTargetScope;
    stat: AbilityStat;
    value: number;
    description: string | null;
    battleRules: AbilityBattleRuleDto | null;
    createdAt: string;
    updatedAt: string;
};

export type CreateAbilityRequestDto = {
    name: string;
    category: AbilityCategory;
    effectType: AbilityEffectType;
    targetScope: AbilityTargetScope;
    stat: AbilityStat;
    value: number;
    description?: string | null;
    battleRules?: AbilityBattleRuleDto | null;
};

export type ListAbilitiesResponseDto = {
    success: boolean;
    abilities: AbilityDto[];
    message?: string;
};

export type CreateAbilityResponseDto = {
    success: boolean;
    ability: AbilityDto | null;
    message?: string;
};

export type UpdateAbilityRequestDto = CreateAbilityRequestDto;

export type UpdateAbilityResponseDto = {
    success: boolean;
    ability: AbilityDto | null;
    message?: string;
};

export type DeleteAbilityResponseDto = {
    success: boolean;
    message?: string;
};

export function isValidAbilityBattleRuleType(value: string): value is AbilityBattleRuleType {
    return ABILITY_BATTLE_RULE_TYPES.includes(value as AbilityBattleRuleType);
}

export function isValidAbilityActionType(value: string): value is AbilityActionType {
    return ABILITY_ACTION_TYPES.includes(value as AbilityActionType);
}

export function isValidAbilityBoardActionType(value: string): value is AbilityBoardActionType {
    return ABILITY_BOARD_ACTION_TYPES.includes(value as AbilityBoardActionType);
}

export function isValidAbilityCardType(value: string): value is AbilityCardType {
    return ABILITY_CARD_TYPES.includes(value as AbilityCardType);
}

export function isValidAbilityTriggerEvent(value: string): value is AbilityTriggerEvent {
    return ABILITY_TRIGGER_EVENTS.includes(value as AbilityTriggerEvent);
}

export function isValidAbilityCostKind(value: string): value is AbilityCostKind {
    return ABILITY_COST_KINDS.includes(value as AbilityCostKind);
}

export function isValidAbilityConditionKind(value: string): value is AbilityConditionKind {
    return ABILITY_CONDITION_KINDS.includes(value as AbilityConditionKind);
}

export function isValidAbilityEffectKind(value: string): value is AbilityEffectKind {
    return ABILITY_EFFECT_KINDS.includes(value as AbilityEffectKind);
}

export function isValidAbilityCompareOperator(value: string): value is AbilityCompareOperator {
    return ABILITY_COMPARE_OPERATORS.includes(value as AbilityCompareOperator);
}

export function isValidAbilityZoneType(value: string): value is AbilityZoneType {
    return ABILITY_ZONE_TYPES.includes(value as AbilityZoneType);
}
