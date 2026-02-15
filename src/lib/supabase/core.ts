import { ABILITY_CATEGORIES, ABILITY_EFFECT_TYPES, ABILITY_STATS, ABILITY_TARGET_SCOPES, type AbilityCategory, type AbilityEffectType, type AbilityStat, type AbilityTargetScope } from "@/dto/ability";
import { CREATURE_ELEMENTS, CREATURE_TRIBES, type CreatureElement, type CreatureTribe } from "@/dto/creature";
import {
    LOCATION_BATTLE_RULE_TYPES,
    LOCATION_CARD_TYPES,
    LOCATION_EFFECT_TYPES,
    LOCATION_STATS,
    LOCATION_TARGET_SCOPES,
    type LocationBattleRuleType,
    type LocationCardType,
    type LocationEffectType,
    type LocationStat,
    type LocationTargetScope,
} from "@/dto/location";
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

export function getLocationsTableName() {
    return process.env.SUPABASE_LOCATIONS_TABLE ?? "locations";
}

export function getBattlegearTableName() {
    return process.env.SUPABASE_BATTLEGEAR_TABLE ?? "battlegear";
}

export function getMugicTableName() {
    return process.env.SUPABASE_MUGIC_TABLE ?? "mugic";
}

export function getAttacksTableName() {
    return process.env.SUPABASE_ATTACKS_TABLE ?? "attacks";
}

export function getUserProgressionTableName() {
    return process.env.SUPABASE_USER_PROGRESSION_TABLE ?? "user_progression";
}

export function getProgressionEventsTableName() {
    return process.env.SUPABASE_PROGRESSION_EVENTS_TABLE ?? "progression_events";
}

export function getUserCardsTableName() {
    return process.env.SUPABASE_USER_CARDS_TABLE ?? "user_cards";
}

export function getUserDecksTableName() {
    return process.env.SUPABASE_USER_DECKS_TABLE ?? "user_decks";
}

export function getUserDeckCardsTableName() {
    return process.env.SUPABASE_USER_DECK_CARDS_TABLE ?? "user_deck_cards";
}

export function getStorePacksTableName() {
    return process.env.SUPABASE_STORE_PACKS_TABLE ?? "store_packs";
}

export function getTournamentsTableName() {
    return process.env.SUPABASE_TOURNAMENTS_TABLE ?? "tournaments";
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

export function isValidLocationEffectType(value: string): value is LocationEffectType {
    return LOCATION_EFFECT_TYPES.includes(value as LocationEffectType);
}

export function isValidLocationStat(value: string): value is LocationStat {
    return LOCATION_STATS.includes(value as LocationStat);
}

export function isValidLocationCardType(value: string): value is LocationCardType {
    return LOCATION_CARD_TYPES.includes(value as LocationCardType);
}

export function isValidLocationTargetScope(value: string): value is LocationTargetScope {
    return LOCATION_TARGET_SCOPES.includes(value as LocationTargetScope);
}

export function isValidLocationBattleRuleType(value: string): value is LocationBattleRuleType {
    return LOCATION_BATTLE_RULE_TYPES.includes(value as LocationBattleRuleType);
}
