export const ABILITY_CATEGORIES = ["support", "brainwashed"] as const;

export type AbilityCategory = (typeof ABILITY_CATEGORIES)[number];

export const ABILITY_EFFECT_TYPES = ["increase", "decrease"] as const;

export type AbilityEffectType = (typeof ABILITY_EFFECT_TYPES)[number];

export const ABILITY_TARGET_SCOPES = [
    "all_creatures",
    "same_tribe",
    "enemy_only",
] as const;

export type AbilityTargetScope = (typeof ABILITY_TARGET_SCOPES)[number];

export const ABILITY_STATS = [
    "power",
    "courage",
    "speed",
    "wisdom",
    "energy",
] as const;

export type AbilityStat = (typeof ABILITY_STATS)[number];

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
