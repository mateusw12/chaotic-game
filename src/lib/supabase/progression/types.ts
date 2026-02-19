import type { CardRarity } from "@/dto/creature";
import type { ProgressionEventSource, UserCardType } from "@/dto/progression";

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
