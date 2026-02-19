import type { CardRarity, CreatureTribe } from "@/dto/creature";
import {
    LOCATION_CARD_TYPES,
    LOCATION_EFFECT_TYPES,
    LOCATION_STATS,
    type LocationCardType,
    type LocationEffectType,
    type LocationStat,
} from "@/dto/location";

export const MUGIC_TARGET_SCOPES = ["self", "enemy"] as const;

export type MugicTargetScope = (typeof MUGIC_TARGET_SCOPES)[number];

export const MUGIC_ABILITY_TYPES = ["stat_modifier", "action"] as const;

export type MugicAbilityType = (typeof MUGIC_ABILITY_TYPES)[number];

export const MUGIC_ACTION_TYPES = [
    "flip_target_battlegear",
    "flip_target_attack",
    "destroy_target_battlegear",
    "destroy_target_attack",
    "return_target_card_to_hand",
    "cancel_target_mugic",
    "discard_opponent_mugic_from_hand",
    "cancel_target_activated_ability",
    "modify_stats_map",
    "heal_target",
    "grant_mugic_counter",
    "grant_element_attack_bonus",
    "sacrifice_friendly_then_gain_energy_from_sacrificed",
    "sacrifice_friendly_then_reduce_enemy_by_sacrificed_stats",
    "banish_mugic_card_from_discard_then_deal_damage",
    "reduce_chosen_discipline",
    "prevent_stat_modifiers_on_target",
    "apply_status_effect",
] as const;

export type MugicActionType = (typeof MUGIC_ACTION_TYPES)[number];

export const MUGIC_STATUS_EFFECT_TYPES = ["exhaust_disciplines"] as const;

export type MugicStatusEffectType = (typeof MUGIC_STATUS_EFFECT_TYPES)[number];

export const MUGIC_STATUS_EFFECT_STAT_SCOPES = ["all_disciplines"] as const;

export type MugicStatusEffectStatScope = (typeof MUGIC_STATUS_EFFECT_STAT_SCOPES)[number];

export const MUGIC_ABILITY_TYPE_OPTIONS: Array<{
    value: MugicAbilityType;
    label: string;
}> = [
        { value: "stat_modifier", label: "Modificar atributo" },
        { value: "action", label: "Ação" },
    ];

export const MUGIC_ACTION_TYPE_OPTIONS: Array<{
    value: MugicActionType;
    label: string;
}> = [
        { value: "flip_target_battlegear", label: "Vire de cabeça para baixo (flip) um Battlegear alvo" },
        { value: "flip_target_attack", label: "Vire de cabeça para baixo (flip) um Ataque alvo" },
        { value: "destroy_target_battlegear", label: "Destrua um Battlegear alvo" },
        { value: "destroy_target_attack", label: "Destrua um Ataque alvo" },
        { value: "return_target_card_to_hand", label: "Retorne uma carta alvo para a mão" },
        { value: "cancel_target_mugic", label: "Cancele um Mugic alvo" },
        { value: "discard_opponent_mugic_from_hand", label: "Descartar Mugic da mão do oponente" },
        { value: "cancel_target_activated_ability", label: "Cancelar habilidade ativada" },
        { value: "modify_stats_map", label: "Modificar múltiplos atributos" },
        { value: "heal_target", label: "Curar criatura alvo" },
        { value: "grant_mugic_counter", label: "Conceder contador de Mugic" },
        { value: "grant_element_attack_bonus", label: "Conceder bônus elemental" },
        { value: "sacrifice_friendly_then_gain_energy_from_sacrificed", label: "Sacrificar aliado e ganhar energia" },
        { value: "sacrifice_friendly_then_reduce_enemy_by_sacrificed_stats", label: "Sacrificar aliado e reduzir inimigo" },
        { value: "banish_mugic_card_from_discard_then_deal_damage", label: "Banir carta e causar dano" },
        { value: "reduce_chosen_discipline", label: "Reduzir disciplina escolhida" },
        { value: "prevent_stat_modifiers_on_target", label: "Impedir aumento/redução de disciplinas" },
        { value: "apply_status_effect", label: "Aplicar efeito de status" },
    ];

export type MugicStatusEffectActionPayload = {
    effectType: "status_effect";
    statusType: MugicStatusEffectType;
    statScope: MugicStatusEffectStatScope;
    value: number;
    durationTurns?: number | null;
};

export const MUGIC_TARGET_SCOPE_OPTIONS: Array<{
    value: MugicTargetScope;
    label: string;
}> = [
        { value: "self", label: "Própria criatura" },
        { value: "enemy", label: "Adversário" },
    ];

export const MUGIC_EFFECT_TYPE_OPTIONS: Array<{
    value: LocationEffectType;
    label: string;
}> = [
        { value: "increase", label: "Aumentar" },
        { value: "decrease", label: "Diminuir" },
    ];

export const MUGIC_STAT_OPTIONS: Array<{
    value: LocationStat;
    label: string;
}> = [
        { value: "power", label: "Poder" },
        { value: "courage", label: "Coragem" },
        { value: "speed", label: "Velocidade" },
        { value: "wisdom", label: "Sabedoria" },
        { value: "mugic", label: "Mugic" },
        { value: "energy", label: "Energia" },
    ];

export const MUGIC_CARD_TYPE_OPTIONS: Array<{
    value: LocationCardType;
    label: string;
}> = [
        { value: "creature", label: "Criatura" },
        { value: "equipment", label: "Equipamento" },
        { value: "attack", label: "Ataque" },
        { value: "mugic", label: "Mugic" },
        { value: "location", label: "Local" },
    ];

export type MugicAbilityDto = {
    abilityType: MugicAbilityType;
    description: string;
    effectType: LocationEffectType | null;
    stats: LocationStat[];
    cardTypes: LocationCardType[];
    targetScope: MugicTargetScope;
    targetTribes: CreatureTribe[];
    value: number;
    actionType: MugicActionType | null;
    actionPayload: MugicStatusEffectActionPayload | Record<string, unknown> | null;
};

export type MugicDto = {
    id: string;
    name: string;
    fileName: string | null;
    rarity: CardRarity;
    imageFileId: string | null;
    imageUrl: string | null;
    tribes: CreatureTribe[];
    cost: number;
    abilities: MugicAbilityDto[];
    createdAt: string;
    updatedAt: string;
};

export type CreateMugicRequestDto = {
    name: string;
    fileName?: string | null;
    rarity: CardRarity;
    imageFileId?: string | null;
    tribes?: CreatureTribe[];
    cost: number;
    abilities: MugicAbilityDto[];
};

export type UpdateMugicRequestDto = CreateMugicRequestDto;

export type ListMugicResponseDto = {
    success: boolean;
    mugics: MugicDto[];
    message?: string;
};

export type CreateMugicResponseDto = {
    success: boolean;
    mugic: MugicDto | null;
    message?: string;
};

export type UpdateMugicResponseDto = {
    success: boolean;
    mugic: MugicDto | null;
    message?: string;
};

export type DeleteMugicResponseDto = {
    success: boolean;
    message?: string;
};

export function isValidMugicTargetScope(value: string): value is MugicTargetScope {
    return MUGIC_TARGET_SCOPES.includes(value as MugicTargetScope);
}

export function isValidMugicAbilityType(value: string): value is MugicAbilityType {
    return MUGIC_ABILITY_TYPES.includes(value as MugicAbilityType);
}

export function isValidMugicActionType(value: string): value is MugicActionType {
    return MUGIC_ACTION_TYPES.includes(value as MugicActionType);
}

export function isValidMugicEffectType(value: string): value is LocationEffectType {
    return LOCATION_EFFECT_TYPES.includes(value as LocationEffectType);
}

export function isValidMugicStat(value: string): value is LocationStat {
    return LOCATION_STATS.includes(value as LocationStat);
}

export function isValidMugicCardType(value: string): value is LocationCardType {
    return LOCATION_CARD_TYPES.includes(value as LocationCardType);
}
