import type { CardRarity, CreatureElement, CreatureTribe } from "@/dto/creature";

export const LOCATION_EFFECT_TYPES = [
    "increase",
    "decrease",
    "gain",
    "damage",
    "negate",
    "lose_element",
    "special",
] as const;

export type LocationEffectType = (typeof LOCATION_EFFECT_TYPES)[number];

export const LOCATION_TARGET_SCOPES = [
    "all_creatures",
    "own_creatures",
    "enemy_creatures",
    "engaged_creatures",
    "specific_tribes",
    "none",
] as const;

export type LocationTargetScope = (typeof LOCATION_TARGET_SCOPES)[number];

export const LOCATION_BATTLE_RULE_TYPES = [
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
        { value: "own_creatures", label: "Suas criaturas" },
        { value: "enemy_creatures", label: "Criaturas inimigas" },
        { value: "engaged_creatures", label: "Criaturas engajadas" },
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

export type LocationBattleRuleDto = {
    type: LocationBattleRuleType;
    requiresTarget: boolean;
    usageLimitPerTurn: number | null;
    notes?: string | null;
    payload?: Record<string, unknown> | null;
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
    rarity: CardRarity;
    imageFileId: string | null;
    imageUrl: string | null;
    initiativeElements: CreatureElement[];
    tribes: CreatureTribe[];
    abilities: LocationAbilityDto[];
    createdAt: string;
    updatedAt: string;
};

export type CreateLocationRequestDto = {
    name: string;
    rarity: CardRarity;
    imageFileId?: string | null;
    initiativeElements: CreatureElement[];
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
