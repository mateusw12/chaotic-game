import type { CardRarity, CreatureTribe } from "@/dto/creature";
import {
    LOCATION_EFFECT_TYPES,
    LOCATION_TARGET_SCOPES,
    LOCATION_EFFECT_TYPE_OPTIONS,
    LOCATION_TARGET_SCOPE_OPTIONS,
    type LocationAbilityDto,
} from "@/dto/location";

export const BATTLEGEAR_EFFECT_TYPES = LOCATION_EFFECT_TYPES;

export type BattleGearEffectType = (typeof BATTLEGEAR_EFFECT_TYPES)[number];

export const BATTLEGEAR_TARGET_SCOPES = LOCATION_TARGET_SCOPES;

export type BattleGearTargetScope = (typeof BATTLEGEAR_TARGET_SCOPES)[number];

export const BATTLEGEAR_BATTLE_RULE_TYPES = [
    "prevent_targeting_by_lower_stat",
    "additional_damage_to_no_element_creatures",
    "expend_element_for_stat",
    "gain_keywords",
    "sacrifice_to_grant_keywords",
    "starts_face_up",
    "gain_stats_per_element",
    "gain_element_on_engage",
    "gain_energy_on_opponent_fail_check",
    "choose_elemental_keyword_and_gain_recklessness",
    "gain_energy_with_element_bonus",
    "destroy_battlegear_on_damage_threshold",
    "gain_keyword_if_moved",
    "gain_element_and_bonus_for_specific_creature",
    "sacrifice_for_mugic_and_heal",
    "sacrifice_for_damage_with_bonus",
    "forced_swap_at_turn_start",
    "prevent_elemental_loss_for_engaged",
    "look_at_opponent_battlegear",
    "gain_keyword_with_element_bonus",
    "redirect_damage_option",
    "reduce_opponent_stats_per_element",
    "gain_keywords_per_creature_in_discard",
    "additional_damage_if_has_element",
    "destroy_on_shuffle",
    "damage_cap",
] as const;

export type BattleGearBattleRuleType = (typeof BATTLEGEAR_BATTLE_RULE_TYPES)[number];

export type BattleGearBattleRuleDto = {
    type: BattleGearBattleRuleType;
    requiresTarget?: boolean;
    usageLimitPerTurn?: number | null;
    notes?: string | null;
    payload?: Record<string, unknown> | null;
};

export type BattleGearAbilityDto = Omit<LocationAbilityDto, "battleRules"> & {
    battleRules?: BattleGearBattleRuleDto | null;
};

export const BATTLEGEAR_EFFECT_TYPE_OPTIONS: Array<{
    value: BattleGearEffectType;
    label: string;
}> = LOCATION_EFFECT_TYPE_OPTIONS;

export const BATTLEGEAR_TARGET_SCOPE_OPTIONS: Array<{
    value: BattleGearTargetScope;
    label: string;
}> = LOCATION_TARGET_SCOPE_OPTIONS;

export type BattleGearDto = {
    id: string;
    name: string;
    fileName: string | null;
    rarity: CardRarity;
    imageFileId: string | null;
    imageUrl: string | null;
    allowedTribes: CreatureTribe[];
    allowedCreatureIds: string[];
    abilities: BattleGearAbilityDto[];
    createdAt: string;
    updatedAt: string;
};

export type CreateBattleGearRequestDto = {
    name: string;
    fileName?: string | null;
    rarity: CardRarity;
    imageFileId?: string | null;
    allowedTribes?: CreatureTribe[];
    allowedCreatureIds?: string[];
    abilities: BattleGearAbilityDto[];
};

export type UpdateBattleGearRequestDto = CreateBattleGearRequestDto;

export type ListBattleGearResponseDto = {
    success: boolean;
    battlegear: BattleGearDto[];
    message?: string;
};

export type CreateBattleGearResponseDto = {
    success: boolean;
    battlegearItem: BattleGearDto | null;
    message?: string;
};

export type UpdateBattleGearResponseDto = {
    success: boolean;
    battlegearItem: BattleGearDto | null;
    message?: string;
};

export type DeleteBattleGearResponseDto = {
    success: boolean;
    message?: string;
};
