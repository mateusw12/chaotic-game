import type { UserRole } from "@/dto/user";
import type {
    AbilityBattleRuleDto,
    AbilityCategory,
    AbilityEffectType,
    AbilityStat,
    AbilityTargetScope,
} from "@/dto/ability";
import type { CardRarity, CreatureElement, CreatureTribe } from "@/dto/creature";
import type { LocationAbilityDto, LocationInitiativeElement } from "@/dto/location";
import type { BattleGearAbilityDto } from "@/dto/battlegear";
import type { AttackAbilityDto, AttackElementValueDto } from "@/dto/attack";
import type { MugicAbilityDto } from "@/dto/mugic";
import type { ProgressionEventSource, UserCardType } from "@/dto/progression";
import type { TournamentFormat, TournamentLocationMode, TournamentScheduleType } from "@/dto/tournament";

export type SupabaseApiError = {
    code?: string;
    message: string;
};

export type SupabaseUserRow = {
    id: string;
    role: UserRole;
    provider: string;
    provider_account_id: string;
    email: string;
    name: string | null;
    nick_name: string | null;
    image_url: string | null;
    last_login_at: string;
    created_at: string;
    updated_at: string;
};

export type SupabasePermissionUserRow = {
    id: string;
    name: string | null;
    email: string;
    image_url: string | null;
    role: UserRole;
    updated_at: string;
};

export type SupabaseWalletRow = {
    id: string;
    user_id: string;
    coins: number;
    diamonds: number;
    created_at: string;
    updated_at: string;
};

export type SupabaseCreatureRow = {
    id: string;
    name: string;
    file_name: string | null;
    rarity: CardRarity;
    image_file_id: string | null;
    image_url: string | null;
    tribe: CreatureTribe;
    power: number;
    courage: number;
    speed: number;
    wisdom: number;
    mugic: number;
    energy: number;
    dominant_elements: CreatureElement[];
    support_ability_ids: string[];
    support_ability_name: string[];
    brainwashed_ability_ids: string[];
    brainwashed_ability_name: string[];
    equipment_note: string | null;
    created_at: string;
    updated_at: string;
};

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

export type SupabaseLocationRow = {
    id: string;
    name: string;
    file_name: string | null;
    rarity: CardRarity;
    image_file_id: string | null;
    image_url: string | null;
    initiative_elements: LocationInitiativeElement[];
    tribes: CreatureTribe[];
    abilities: LocationAbilityDto[];
    created_at: string;
    updated_at: string;
};

export type SupabaseBattleGearRow = {
    id: string;
    name: string;
    file_name?: string | null;
    rarity: CardRarity;
    image_file_id: string | null;
    image_url: string | null;
    allowed_tribes: CreatureTribe[];
    allowed_creature_ids: string[];
    abilities: BattleGearAbilityDto[];
    created_at: string;
    updated_at: string;
};

export type SupabaseMugicRow = {
    id: string;
    name: string;
    file_name?: string | null;
    rarity: CardRarity;
    image_file_id: string | null;
    image_url: string | null;
    tribes: CreatureTribe[];
    cost: number;
    abilities: MugicAbilityDto[];
    created_at: string;
    updated_at: string;
};

export type SupabaseAttackRow = {
    id: string;
    name: string;
    file_name?: string | null;
    rarity: CardRarity;
    image_file_id: string | null;
    image_url: string | null;
    energy_cost: number;
    element_values: AttackElementValueDto[];
    abilities: AttackAbilityDto[];
    created_at: string;
    updated_at: string;
};

export type SupabaseUserProgressionRow = {
    id: string;
    user_id: string;
    xp_total: number;
    level: number;
    xp_current_level: number;
    xp_next_level: number;
    season_rank: string;
    created_at: string;
    updated_at: string;
};

export type SupabaseProgressionEventRow = {
    id: string;
    user_id: string;
    source: ProgressionEventSource;
    xp_delta: number;
    coins_delta: number;
    diamonds_delta: number;
    card_type: UserCardType | null;
    card_id: string | null;
    card_rarity: CardRarity | null;
    quantity: number;
    reference_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
};

export type SupabaseUserCardRow = {
    id: string;
    user_id: string;
    card_type: UserCardType;
    card_id: string;
    rarity: CardRarity;
    quantity: number;
    created_at: string;
    updated_at: string;
};

export type SupabaseUserDeckRow = {
    id: string;
    user_id: string;
    name: string;
    created_at: string;
    updated_at: string;
};

export type SupabaseUserDeckCardRow = {
    id: string;
    deck_id: string;
    card_type: UserCardType;
    card_id: string;
    quantity: number;
    created_at: string;
    updated_at: string;
};

export type SupabaseTournamentRow = {
    id: string;
    name: string;
    cover_image_file_id: string | null;
    cover_image_url: string | null;
    cards_count: number;
    players_count: number;
    allowed_formats: TournamentFormat[];
    deck_archetypes: string[];
    max_card_energy: number | null;
    allowed_tribes: string[];
    allow_mugic: boolean;
    location_mode: TournamentLocationMode;
    defined_locations: string[];
    additional_rules: string | null;
    schedule_type: TournamentScheduleType;
    start_at: string | null;
    end_at: string | null;
    period_days: number | null;
    is_enabled: boolean;
    created_at: string;
    updated_at: string;
};
