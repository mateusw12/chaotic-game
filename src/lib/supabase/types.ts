import type { UserRole } from "@/dto/user";
import type {
    AbilityCategory,
    AbilityEffectType,
    AbilityStat,
    AbilityTargetScope,
} from "@/dto/ability";
import type { CardRarity, CreatureElement, CreatureTribe } from "@/dto/creature";
import type { LocationAbilityDto } from "@/dto/location";
import type { AttackAbilityDto, AttackElementValueDto } from "@/dto/attack";

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
    support_ability_id: string | null;
    support_ability_name: string | null;
    brainwashed_ability_id: string | null;
    brainwashed_ability_name: string | null;
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
    created_at: string;
    updated_at: string;
};

export type SupabaseLocationRow = {
    id: string;
    name: string;
    rarity: CardRarity;
    image_file_id: string | null;
    image_url: string | null;
    initiative_elements: CreatureElement[];
    tribes: CreatureTribe[];
    abilities: LocationAbilityDto[];
    created_at: string;
    updated_at: string;
};

export type SupabaseBattleGearRow = {
    id: string;
    name: string;
    rarity: CardRarity;
    image_file_id: string | null;
    image_url: string | null;
    allowed_tribes: CreatureTribe[];
    allowed_creature_ids: string[];
    abilities: LocationAbilityDto[];
    created_at: string;
    updated_at: string;
};

export type SupabaseMugicRow = {
    id: string;
    name: string;
    rarity: CardRarity;
    image_file_id: string | null;
    image_url: string | null;
    tribes: CreatureTribe[];
    cost: number;
    abilities: unknown[];
    created_at: string;
    updated_at: string;
};

export type SupabaseAttackRow = {
    id: string;
    name: string;
    rarity: CardRarity;
    image_file_id: string | null;
    image_url: string | null;
    energy_cost: number;
    element_values: AttackElementValueDto[];
    abilities: AttackAbilityDto[];
    created_at: string;
    updated_at: string;
};
