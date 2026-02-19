import type {
    AbilityBattleRuleDto,
    AbilityCategory,
    AbilityEffectType,
    AbilityStat,
    AbilityTargetScope,
} from "@/dto/ability";

export type SupabaseAbilityRow = {
    id: string;
    name: string;
    category: AbilityCategory;
    effect_type: AbilityEffectType;
    target_scope: AbilityTargetScope;
    stat: AbilityStat;
    value: number;
    description: string | null;
    battle_rules: AbilityBattleRuleDto | null;
    created_at: string;
    updated_at: string;
};
