import type { CardRarity, CreatureElement, CreatureTribe } from "@/dto/creature";

export const LOCATION_EFFECT_TYPES = ["increase", "decrease"] as const;

export type LocationEffectType = (typeof LOCATION_EFFECT_TYPES)[number];

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
] as const;

export type LocationStat = (typeof LOCATION_STATS)[number];

export const LOCATION_EFFECT_TYPE_OPTIONS: Array<{
    value: LocationEffectType;
    label: string;
}> = [
        { value: "increase", label: "Aumentar" },
        { value: "decrease", label: "Diminuir" },
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
    ];

export type LocationAbilityDto = {
    description: string;
    effectType: LocationEffectType;
    stats: LocationStat[];
    cardTypes: LocationCardType[];
    value: number;
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
