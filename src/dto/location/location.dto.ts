import type { CardRarity, CreatureElement, CreatureTribe } from "@/dto/creature";

export const LOCATION_INITIATIVE_ELEMENTS = [
    "fire",
    "water",
    "earth",
    "air",
    "power",
    "courage",
    "speed",
    "wisdom",
    "overworld",
    "underworld",
    "mipedian",
    "marrillian",
    "danian",
    "ancient",
    "past",
    "elementalist",
    "build_cost",
    "mugic_counters",
    "number_of_elements",
    "fewest_elements",
] as const;

export type LocationInitiativeElement = (typeof LOCATION_INITIATIVE_ELEMENTS)[number];

export const LOCATION_EFFECT_TYPES = [
    "increase",
    "decrease",
    "gain",
    "heal",
    "damage",
    "negate",
    "lose_element",
    "special",
] as const;

export type LocationEffectType = (typeof LOCATION_EFFECT_TYPES)[number];

export const LOCATION_TARGET_SCOPES = [
    "all_creatures",
    "all_players",
    "all_battlegear",
    "own_creatures",
    "enemy_creatures",
    "engaged_creatures",
    "creatures_in_location",
    "specific_tribes",
    "none",
] as const;

export type LocationTargetScope = (typeof LOCATION_TARGET_SCOPES)[number];

export const LOCATION_BATTLE_RULE_TYPES = [
    "attack_randomly_lowest_speed",
    "damage_reduction_first_attack",
    "damage_reduction_lowest_power",
    "damage_reduction_shared_element",
    "fail_checks_lowest_courage",
    "force_combat_at_turn_start",
    "gain_element",
    "gain_element_and_keyword",
    "gain_energy_on_element_gain",
    "gain_energy_per_element",
    "gain_keyword_battlegear",
    "gain_keyword_if_condition",
    "gain_mugic_counter_most_elements",
    "gain_mugic_on_attack_reveal",
    "heal_on_elemental_attack",
    "ignore_mugic_tribe_restriction",
    "infect_creature_on_reveal",
    "lose_all_elements_on_reveal",
    "lose_energy_on_element_loss",
    "move_mugic_counter_highest_wisdom",
    "prevent_battlegear_flip_without_element",
    "prevent_elemental_type_change",
    "prevent_heal_and_energy_gain",
    "prevent_mugic_usage_without_element",
    "recycle_mugic_card",
    "remove_all_tribes",
    "sacrifice_to_revive_creature",
    "set_tribe_to_past",
    "shuffle_hand_and_draw",
    "stat_modifier_for_tribe",
    "stat_modifier_if_element",
    "stat_modifier_mirage",
    "stat_modifier",
    "shuffle_attack_discard_into_deck",
    "return_battlegear_from_discard",
    "sacrifice_battlegear_on_activate",
    "remove_mugic_counter_on_activate",
    "cannot_relocate_creatures",
    "reveal_new_active_location",
    "relocate_to_empty_space_on_action_step",
    "shared_engaged_effect",
    "movement_lock_unless_pay_mugic",
    "damage_on_activation",
    "return_chieftain_from_discard",
    "jade_pillar_counter_damage",
    "mugic_name_lock_this_turn",
    "minion_activated_ability_cost_increase",
    "discard_attack_cards_from_deck",
    "draw_then_discard_attack_cards",
    "generic_special",
] as const;

export type LocationBattleRuleType = (typeof LOCATION_BATTLE_RULE_TYPES)[number];

export const LOCATION_BATTLE_TRIGGER_EVENTS = [
    "passive",
    "on_location_activate",
    "on_location_reveal",
    "on_combat_start",
    "on_combat",
    "on_turn_start",
    "on_action_step_start",
    "on_lose_initiative",
    "on_win_challenge",
    "on_element_gain",
    "on_element_loss",
    "on_elemental_attack_play",
    "on_first_attack",
    "on_damage_calculation",
] as const;

export type LocationBattleTriggerEvent = (typeof LOCATION_BATTLE_TRIGGER_EVENTS)[number];

export const LOCATION_BATTLE_TARGET_PLAYERS = ["self", "opponent", "all_players"] as const;

export type LocationBattleTargetPlayer = (typeof LOCATION_BATTLE_TARGET_PLAYERS)[number];

export const LOCATION_BATTLE_ACTIONS = [
    "sacrifice_battlegear",
    "remove_mugic_counter",
    "return_mugic_from_discard",
] as const;

export type LocationBattleAction = (typeof LOCATION_BATTLE_ACTIONS)[number];

export const LOCATION_CARD_TYPES = [
    "creature",
    "equipment",
    "attack",
    "mugic",
    "location",
] as const;

export type LocationCardType = (typeof LOCATION_CARD_TYPES)[number];

export const LOCATION_STATS = [
    "power",
    "courage",
    "speed",
    "wisdom",
    "mugic",
    "energy",
    "all",
    "none",
] as const;

export type LocationStat = (typeof LOCATION_STATS)[number];

export const LOCATION_EFFECT_TYPE_OPTIONS: Array<{
    value: LocationEffectType;
    label: string;
}> = [
        { value: "increase", label: "Aumentar" },
        { value: "decrease", label: "Diminuir" },
        { value: "gain", label: "Ganha condição" },
        { value: "heal", label: "Cura" },
        { value: "damage", label: "Dano" },
        { value: "negate", label: "Negar efeito" },
        { value: "lose_element", label: "Perder elemento" },
        { value: "special", label: "Especial" },
    ];

export const LOCATION_TARGET_SCOPE_OPTIONS: Array<{
    value: LocationTargetScope;
    label: string;
}> = [
        { value: "all_creatures", label: "Todas as criaturas" },
        { value: "all_players", label: "Todos os jogadores" },
        { value: "all_battlegear", label: "Todos os Equipamentos" },
        { value: "own_creatures", label: "Suas criaturas" },
        { value: "enemy_creatures", label: "Criaturas inimigas" },
        { value: "engaged_creatures", label: "Criaturas engajadas" },
        { value: "creatures_in_location", label: "Criaturas no local" },
        { value: "specific_tribes", label: "Tribos específicas" },
        { value: "none", label: "Sem alvo direto" },
    ];

export const LOCATION_CARD_TYPE_OPTIONS: Array<{
    value: LocationCardType;
    label: string;
}> = [
        { value: "creature", label: "Criatura" },
        { value: "equipment", label: "Equipamento" },
        { value: "attack", label: "Ataque" },
        { value: "mugic", label: "Mugic" },
        { value: "location", label: "Local" },
    ];

export const LOCATION_STAT_OPTIONS: Array<{
    value: LocationStat;
    label: string;
}> = [
        { value: "power", label: "Poder" },
        { value: "courage", label: "Coragem" },
        { value: "speed", label: "Velocidade" },
        { value: "wisdom", label: "Sabedoria" },
        { value: "mugic", label: "Mugic" },
        { value: "energy", label: "Energia" },
        { value: "all", label: "Todas as disciplinas" },
        { value: "none", label: "Sem atributo" },
    ];

export const LOCATION_INITIATIVE_ELEMENT_OPTIONS: Array<{
    value: LocationInitiativeElement;
    label: string;
}> = [
        { value: "fire", label: "Fogo" },
        { value: "water", label: "Água" },
        { value: "earth", label: "Terra" },
        { value: "air", label: "Ar" },
        { value: "power", label: "Poder" },
        { value: "courage", label: "Coragem" },
        { value: "speed", label: "Velocidade" },
        { value: "wisdom", label: "Sabedoria" },
        { value: "overworld", label: "OverWorld" },
        { value: "underworld", label: "UnderWorld" },
        { value: "mipedian", label: "Mipedian" },
        { value: "marrillian", label: "M'arrillian" },
        { value: "danian", label: "Danian" },
        { value: "ancient", label: "Ancient" },
        { value: "past", label: "Past" },
        { value: "elementalist", label: "Elementalist" },
        { value: "build_cost", label: "Custo de construção" },
        { value: "mugic_counters", label: "Contadores de Mugic" },
        { value: "number_of_elements", label: "Quantidade de elementos" },
        { value: "fewest_elements", label: "Menos elementos" },
    ];

export type LocationBattleRulePayloadKeywordDto = {
    name: string;
    value?: number;
};

export type LocationBattleRulePayloadDto = {
    trigger?: LocationBattleTriggerEvent;
    targetPlayer?: LocationBattleTargetPlayer;
    action?: LocationBattleAction;
    amount?: number;
    appliesTo?: string;
    attackStat?: LocationStat;
    build_cost_threshold?: number;
    cannotGainBack?: boolean;
    condition?: string;
    condition_element?: CreatureElement;
    condition_subtype?: string;
    costIncrease?: number;
    damagePerCounterSpent?: number;
    discard?: number;
    draw?: number;
    draw_count?: number;
    element?: string;
    elements?: string[];
    excludeTribe?: CreatureTribe;
    finalDamage?: number;
    includesMinion?: boolean;
    initialCounters?: number;
    keyword?: string;
    keywords?: LocationBattleRulePayloadKeywordDto[];
    mirage?: boolean;
    mugicCost?: number;
    requiresEmptySpace?: boolean;
    requiresInfected?: boolean;
    reveal_count?: number;
    stat?: LocationStat;
    unique?: boolean;
};

export type LocationBattleRuleDto = {
    type: LocationBattleRuleType;
    requiresTarget?: boolean;
    usageLimitPerTurn?: number | null;
    notes?: string | null;
    payload?: LocationBattleRulePayloadDto | null;
};

export type LocationAbilityDto = {
    description: string;
    effectType: LocationEffectType;
    targetScope: LocationTargetScope;
    targetTribes: CreatureTribe[];
    stats: LocationStat[];
    cardTypes: LocationCardType[];
    value: number;
    battleRules?: LocationBattleRuleDto | null;
};

export type LocationDto = {
    id: string;
    name: string;
    fileName: string | null;
    rarity: CardRarity;
    imageFileId: string | null;
    imageUrl: string | null;
    initiativeElements: LocationInitiativeElement[];
    tribes: CreatureTribe[];
    abilities: LocationAbilityDto[];
    createdAt: string;
    updatedAt: string;
};

export type CreateLocationRequestDto = {
    name: string;
    fileName?: string | null;
    rarity: CardRarity;
    imageFileId?: string | null;
    initiativeElements: LocationInitiativeElement[];
    tribes?: CreatureTribe[];
    abilities: LocationAbilityDto[];
};

export type UpdateLocationRequestDto = CreateLocationRequestDto;

export type ListLocationsResponseDto = {
    success: boolean;
    locations: LocationDto[];
    message?: string;
};

export type CreateLocationResponseDto = {
    success: boolean;
    location: LocationDto | null;
    message?: string;
};

export type UpdateLocationResponseDto = {
    success: boolean;
    location: LocationDto | null;
    message?: string;
};

export type DeleteLocationResponseDto = {
    success: boolean;
    message?: string;
};
