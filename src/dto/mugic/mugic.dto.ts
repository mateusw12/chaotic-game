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
] as const;

export type MugicActionType = (typeof MUGIC_ACTION_TYPES)[number];

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
    ];

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
    effectType?: LocationEffectType;
    stats?: LocationStat[];
    cardTypes: LocationCardType[];
    targetScope: MugicTargetScope;
    value?: number;
    actionType?: MugicActionType;
};

export type MugicDto = {
    id: string;
    name: string;
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
