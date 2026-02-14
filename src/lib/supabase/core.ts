import { ABILITY_CATEGORIES, ABILITY_EFFECT_TYPES, ABILITY_STATS, ABILITY_TARGET_SCOPES, type AbilityCategory, type AbilityEffectType, type AbilityStat, type AbilityTargetScope } from "@/dto/ability";
import { CREATURE_ELEMENTS, CREATURE_TRIBES, type CreatureElement, type CreatureTribe } from "@/dto/creature";
import type { SupabaseApiError } from "./types";

export function isMissingTableError(error: SupabaseApiError): boolean {
    return error.code === "PGRST205";
}

export function getUsersTableName() {
    return process.env.SUPABASE_USERS_TABLE ?? "users";
}

export function getWalletsTableName() {
    return process.env.SUPABASE_WALLETS_TABLE ?? "user_wallets";
}

export function getCreaturesTableName() {
    return process.env.SUPABASE_CREATURES_TABLE ?? "creatures";
}

export function getAbilitiesTableName() {
    return process.env.SUPABASE_ABILITIES_TABLE ?? "abilities";
}

export function isValidTribe(value: string): value is CreatureTribe {
    return CREATURE_TRIBES.includes(value as CreatureTribe);
}

export function isValidElement(value: string): value is CreatureElement {
    return CREATURE_ELEMENTS.includes(value as CreatureElement);
}

export function isValidAbilityCategory(value: string): value is AbilityCategory {
    return ABILITY_CATEGORIES.includes(value as AbilityCategory);
}

export function isValidAbilityEffectType(value: string): value is AbilityEffectType {
    return ABILITY_EFFECT_TYPES.includes(value as AbilityEffectType);
}

export function isValidAbilityStat(value: string): value is AbilityStat {
    return ABILITY_STATS.includes(value as AbilityStat);
}

export function isValidAbilityTargetScope(value: string): value is AbilityTargetScope {
    return ABILITY_TARGET_SCOPES.includes(value as AbilityTargetScope);
}
