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
    "generic_special",
] as const;

export type AbilityBattleRuleType = (typeof ABILITY_BATTLE_RULE_TYPES)[number];

export type AbilityBattleRuleDto = {
    type: AbilityBattleRuleType;
    requiresTarget: boolean;
    usageLimitPerTurn: number | null;
    chooseIncreaseFrom?: AbilityDisciplineStat[];
    chooseDecreaseFrom?: AbilityDisciplineStat[];
    increaseValue?: number;
    decreaseValue?: number;
    ownMugicCardsToDiscard?: number;
    targetMugicCardsRandomDiscard?: number;
    moveBonusCells?: number;
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
