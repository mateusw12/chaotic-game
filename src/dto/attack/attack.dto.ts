import { CREATURE_ELEMENTS, type CardRarity, type CreatureElement } from "@/dto/creature";
import { LOCATION_EFFECT_TYPES, LOCATION_STATS, type LocationEffectType, type LocationStat } from "@/dto/location";

export const ATTACK_TARGET_SCOPES = ["attacker", "defender"] as const;

export type AttackTargetScope = (typeof ATTACK_TARGET_SCOPES)[number];

export const ATTACK_TARGET_SCOPE_OPTIONS: Array<{ value: AttackTargetScope; label: string }> = [
    { value: "attacker", label: "Criatura atacante" },
    { value: "defender", label: "Criatura adversária" },
];

export const ATTACK_EFFECT_TYPE_OPTIONS: Array<{ value: LocationEffectType; label: string }> = [
    { value: "increase", label: "Aumentar" },
    { value: "decrease", label: "Diminuir" },
];

export const ATTACK_STAT_OPTIONS: Array<{ value: LocationStat; label: string }> = [
    { value: "power", label: "Poder" },
    { value: "courage", label: "Coragem" },
    { value: "speed", label: "Velocidade" },
    { value: "wisdom", label: "Sabedoria" },
    { value: "mugic", label: "Mugic" },
    { value: "energy", label: "Energia" },
];

export type AttackElementValueDto = {
    element: CreatureElement;
    value: number;
};

export type AttackAbilityDto = {
    description: string;
    conditionElement?: CreatureElement;
    targetScope: AttackTargetScope;
    effectType: LocationEffectType;
    stat: LocationStat;
    value: number;
};

export type AttackDto = {
    id: string;
    name: string;
    rarity: CardRarity;
    imageFileId: string | null;
    imageUrl: string | null;
    energyCost: number;
    elementValues: AttackElementValueDto[];
    abilities: AttackAbilityDto[];
    createdAt: string;
    updatedAt: string;
};

export type CreateAttackRequestDto = {
    name: string;
    rarity: CardRarity;
    imageFileId?: string | null;
    energyCost: number;
    elementValues: AttackElementValueDto[];
    abilities: AttackAbilityDto[];
};

export type UpdateAttackRequestDto = CreateAttackRequestDto;

export type ListAttacksResponseDto = {
    success: boolean;
    attacks: AttackDto[];
    message?: string;
};

export type CreateAttackResponseDto = {
    success: boolean;
    attack: AttackDto | null;
    message?: string;
};

export type UpdateAttackResponseDto = {
    success: boolean;
    attack: AttackDto | null;
    message?: string;
};

export type DeleteAttackResponseDto = {
    success: boolean;
    message?: string;
};

export function isValidAttackTargetScope(value: string): value is AttackTargetScope {
    return ATTACK_TARGET_SCOPES.includes(value as AttackTargetScope);
}

export function isValidAttackEffectType(value: string): value is LocationEffectType {
    return LOCATION_EFFECT_TYPES.includes(value as LocationEffectType);
}

export function isValidAttackStat(value: string): value is LocationStat {
    return LOCATION_STATS.includes(value as LocationStat);
}

export function isValidAttackElement(value: string): value is CreatureElement {
    return CREATURE_ELEMENTS.includes(value as CreatureElement);
}
