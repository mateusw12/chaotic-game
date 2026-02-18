import {
    ABILITY_COMPARE_OPERATORS,
    ABILITY_CONDITION_KINDS,
    ABILITY_COST_KINDS,
    ABILITY_COST_SOURCES,
    ABILITY_EFFECT_KINDS,
    ABILITY_EFFECT_TARGETS,
    ABILITY_TRIGGER_EVENTS,
    ABILITY_TRIGGER_SOURCES,
    ABILITY_ZONE_TYPES,
    ABILITY_ACTION_TYPES,
    ABILITY_BATTLE_RULE_TYPES,
    ABILITY_BOARD_ACTION_TYPES,
    ABILITY_CARD_TYPES,
    ABILITY_CATEGORIES,
    ABILITY_EFFECT_TYPES,
    ABILITY_STATS,
    ABILITY_TARGET_SCOPES,
    type AbilityActionType,
    type AbilityBattleRuleType,
    type AbilityBoardActionType,
    type AbilityCardType,
    type AbilityCategory,
    type AbilityCompareOperator,
    type AbilityConditionKind,
    type AbilityCostKind,
    type AbilityCostSource,
    type AbilityEffectType,
    type AbilityEffectKind,
    type AbilityEffectTarget,
    type AbilityStat,
    type AbilityTargetScope,
    type AbilityTriggerEvent,
    type AbilityTriggerSource,
    type AbilityZoneType,
} from "@/dto/ability";
import { CREATURE_ELEMENTS, CREATURE_TRIBES, type CreatureElement, type CreatureTribe } from "@/dto/creature";
import {
    LOCATION_INITIATIVE_ELEMENTS,
    LOCATION_BATTLE_RULE_TYPES,
    LOCATION_CARD_TYPES,
    LOCATION_EFFECT_TYPES,
    LOCATION_STATS,
    LOCATION_TARGET_SCOPES,
    type LocationInitiativeElement,
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

export function isValidAbilityBattleRuleType(value: string): value is AbilityBattleRuleType {
    return ABILITY_BATTLE_RULE_TYPES.includes(value as AbilityBattleRuleType);
}

export function isValidAbilityActionType(value: string): value is AbilityActionType {
    return ABILITY_ACTION_TYPES.includes(value as AbilityActionType);
}

export function isValidAbilityBoardActionType(value: string): value is AbilityBoardActionType {
    return ABILITY_BOARD_ACTION_TYPES.includes(value as AbilityBoardActionType);
}

export function isValidAbilityCardType(value: string): value is AbilityCardType {
    return ABILITY_CARD_TYPES.includes(value as AbilityCardType);
}

export function isValidAbilityTriggerEvent(value: string): value is AbilityTriggerEvent {
    return ABILITY_TRIGGER_EVENTS.includes(value as AbilityTriggerEvent);
}

export function isValidAbilityCostKind(value: string): value is AbilityCostKind {
    return ABILITY_COST_KINDS.includes(value as AbilityCostKind);
}

export function isValidAbilityCostSource(value: string): value is AbilityCostSource {
    return ABILITY_COST_SOURCES.includes(value as AbilityCostSource);
}

export function isValidAbilityConditionKind(value: string): value is AbilityConditionKind {
    return ABILITY_CONDITION_KINDS.includes(value as AbilityConditionKind);
}

export function isValidAbilityEffectKind(value: string): value is AbilityEffectKind {
    return ABILITY_EFFECT_KINDS.includes(value as AbilityEffectKind);
}

export function isValidAbilityEffectTarget(value: string): value is AbilityEffectTarget {
    return ABILITY_EFFECT_TARGETS.includes(value as AbilityEffectTarget);
}

export function isValidAbilityCompareOperator(value: string): value is AbilityCompareOperator {
    return ABILITY_COMPARE_OPERATORS.includes(value as AbilityCompareOperator);
}

export function isValidAbilityZoneType(value: string): value is AbilityZoneType {
    return ABILITY_ZONE_TYPES.includes(value as AbilityZoneType);
}

export function isValidAbilityTriggerSource(value: string): value is AbilityTriggerSource {
    return ABILITY_TRIGGER_SOURCES.includes(value as AbilityTriggerSource);
}

export function isValidLocationEffectType(value: string): value is LocationEffectType {
    return LOCATION_EFFECT_TYPES.includes(value as LocationEffectType);
}

export function isValidLocationInitiativeElement(value: string): value is LocationInitiativeElement {
    return LOCATION_INITIATIVE_ELEMENTS.includes(value as LocationInitiativeElement);
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
